/**
 * MP4 / ISO-BMFF box reader — a dependency-free parser good enough to assert
 * the *real* structure of the bundled cinematic placeholders.
 *
 * The Phase 14.4 hotfix proved that "the bytes look like an MP4" is not the
 * same as "a browser can decode it": the previous placeholders were a
 * hand-muxed container whose packets the decoder rejected outright. These
 * helpers read the values a decoder actually relies on — track dimensions,
 * media timescale and duration, the sample (frame) table, the declared
 * keyframes and the AVC decoder configuration — so the tests assert facts
 * about the file rather than assumptions about who produced it.
 */
import { readFileSync } from "node:fs";

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl"]);

/** Walk the box tree and return a flat, ordered list of boxes. */
function walkBoxes(data) {
  const boxes = [];
  const walk = (start, end) => {
    let p = start;
    while (p + 8 <= end) {
      let size = data.readUInt32BE(p);
      const type = data.toString("latin1", p + 4, p + 8);
      let header = 8;
      if (size === 1) {
        size = Number(data.readBigUInt64BE(p + 8));
        header = 16;
      } else if (size === 0) {
        size = end - p;
      }
      if (size < 8 || p + size > end) break;
      boxes.push({ type, start: p, size });
      if (CONTAINERS.has(type)) walk(p + header, p + size);
      p += size;
    }
  };
  walk(0, data.length);
  return boxes;
}

/**
 * Read the media facts of an MP4 file.
 * @returns {{bytes:number, width:number, height:number, timescale:number,
 *   duration:number, seconds:number, samples:number, fps:number,
 *   keyframes:number, profile:number, level:number, sampleSizes:number[],
 *   chunkOffsets:number[], firstSampleNalTypes:number[], moovBeforeMdat:boolean}}
 */
export function readMp4(file) {
  const data = readFileSync(file);
  const boxes = walkBoxes(data);
  const box = (type) => boxes.find((b) => b.type === type);
  const out = { bytes: data.length };

  out.moovBeforeMdat =
    boxes.findIndex((b) => b.type === "moov") !== -1 &&
    boxes.findIndex((b) => b.type === "moov") < boxes.findIndex((b) => b.type === "mdat");

  /* Track header — width/height are 16.16 fixed-point in the final 8 bytes of
     the box, for both version 0 and version 1, so no version math is needed. */
  const tkhd = box("tkhd");
  if (tkhd) {
    const at = tkhd.start + tkhd.size - 8;
    out.width = data.readUInt32BE(at) >>> 16;
    out.height = data.readUInt32BE(at + 4) >>> 16;
  }

  /* Media header — the timescale/duration pair the timeline is built from. */
  const mdhd = box("mdhd");
  if (mdhd) {
    if (data[mdhd.start + 8] === 1) {
      out.timescale = data.readUInt32BE(mdhd.start + 28);
      out.duration = Number(data.readBigUInt64BE(mdhd.start + 32));
    } else {
      out.timescale = data.readUInt32BE(mdhd.start + 20);
      out.duration = data.readUInt32BE(mdhd.start + 24);
    }
    out.seconds = out.timescale ? out.duration / out.timescale : 0;
  }

  /* Time-to-sample — the authoritative frame count. */
  const stts = box("stts");
  if (stts) {
    const entries = data.readUInt32BE(stts.start + 12);
    let total = 0;
    for (let i = 0; i < entries; i += 1) total += data.readUInt32BE(stts.start + 16 + i * 8);
    out.samples = total;
    out.fps = out.seconds ? out.samples / out.seconds : 0;
  }

  /* Sync-sample table — how many random-access keyframes are declared. */
  const stss = box("stss");
  out.keyframes = stss ? data.readUInt32BE(stss.start + 12) : 0;

  /* Sample sizes and chunk offsets, so a sample can actually be located. */
  const stsz = box("stsz");
  if (stsz) {
    const fixed = data.readUInt32BE(stsz.start + 12);
    const count = data.readUInt32BE(stsz.start + 16);
    out.sampleSizes = [];
    for (let i = 0; i < Math.min(count, 4); i += 1) {
      out.sampleSizes.push(fixed || data.readUInt32BE(stsz.start + 20 + i * 4));
    }
  }
  const stco = box("stco");
  if (stco) {
    const count = data.readUInt32BE(stco.start + 12);
    out.chunkOffsets = [];
    for (let i = 0; i < count; i += 1) out.chunkOffsets.push(data.readUInt32BE(stco.start + 16 + i * 4));
  }

  /* AVC decoder configuration: profile_idc and level_idc. Baseline (66/0x42)
     is 4:2:0 by definition, which is what the yuv420p requirement means. */
  const avcC = data.indexOf(Buffer.from("avcC"));
  if (avcC !== -1) {
    out.profile = data[avcC + 5];
    out.level = data[avcC + 7];
  }

  /* NAL units of the first sample (length-prefixed AVCC), so we can prove the
     keyframe carries a real IDR slice. */
  out.firstSampleNalTypes = [];
  if (out.chunkOffsets?.length && out.sampleSizes?.length) {
    let cursor = out.chunkOffsets[0];
    const end = cursor + out.sampleSizes[0];
    while (cursor + 4 <= end && out.firstSampleNalTypes.length < 8) {
      const len = data.readUInt32BE(cursor);
      if (len === 0 || cursor + 4 + len > end) break;
      out.firstSampleNalTypes.push(data[cursor + 4] & 0x1f);
      cursor += 4 + len;
    }
  }

  return out;
}

export const NAL_TYPE = { SLICE: 1, IDR: 5, SEI: 6, SPS: 7, PPS: 8 };
