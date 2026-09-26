/**
 * PHASE 14.4 HOTFIX — Video Playback Debug + Validation
 *
 * Focused tests that verify the actual MP4 files are valid and the
 * hero/brand-film playback contracts are correctly implemented.
 *
 * These tests do NOT rely on browser automation — they inspect the real
 * files and real JSX to ensure the browser *can* play the videos.
 */

import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const FRONTEND_DIR = join(SRC_DIR, "..");
const read = (rel) => readFileSync(join(SRC_DIR, rel), "utf8");

function fileExists(rel) {
  return existsSync(join(SRC_DIR, rel));
}

function fileSize(rel) {
  return statSync(join(SRC_DIR, rel)).size;
}

function readBinary(rel) {
  return readFileSync(join(SRC_DIR, rel));
}

// ---------- 1. video asset exists ----------
test("hotfix · hero cinematic video asset exists", () => {
  /* Phase 14.4A: the abstract hero placeholders were removed (the hero brief
     forbids gradient motion); real hero footage uses the reel slots in
     phase14-4a-hero-reel.test.mjs. The brand-film placeholder remains. */
  assert.ok(!fileExists("mock/assets/videos/homepage/hero-cinematic.mp4"), "abstract hero placeholder must stay removed");
  assert.ok(!fileExists("mock/assets/videos/homepage/hero-cinematic-mobile.mp4"), "abstract hero placeholder must stay removed");
  assert.ok(fileExists("mock/assets/videos/homepage/hero-reel/README.md"), "hero reel footage slots must be documented");
  assert.ok(fileExists("mock/assets/videos/editorial/art-of-gold.mp4"), "art-of-gold.mp4 missing");
});

// ---------- 2. video asset is non-zero ----------
test("hotfix · video assets are non-zero and not sub-kilobyte stubs", () => {
  const brand = fileSize("mock/assets/videos/editorial/art-of-gold.mp4");
  // Old invalid files were 675 bytes — valid files must be larger and contain actual frames
  assert.ok(brand > 1000, `art-of-gold.mp4 too small: ${brand} bytes`);
  assert.ok(brand < 500000, `brand video unexpectedly large: ${brand}`);
});

// ---------- 3. valid MP4 container ----------
test("hotfix · video files are valid MP4 containers with ftyp, moov, mdat", () => {
  for (const rel of [
    "mock/assets/videos/editorial/art-of-gold.mp4",
  ]) {
    const data = readBinary(rel);
    // ftyp at start
    const ftypSize = data.readUInt32BE(0);
    assert.ok(ftypSize >= 20 && ftypSize <= 100, `${rel}: invalid ftyp size ${ftypSize}`);
    assert.equal(data.subarray(4, 8).toString(), "ftyp", `${rel}: missing ftyp`);

    // Must contain moov and mdat
    assert.ok(data.includes(Buffer.from("moov")), `${rel}: missing moov atom`);
    assert.ok(data.includes(Buffer.from("mdat")), `${rel}: missing mdat atom`);

    // moov must be before mdat for faststart
    const moovPos = data.indexOf(Buffer.from("moov"));
    const mdatPos = data.indexOf(Buffer.from("mdat"));
    assert.ok(moovPos < mdatPos, `${rel}: moov should be before mdat for faststart (moov ${moovPos}, mdat ${mdatPos})`);

    // Must contain avcC (H264 config) and avc1 (video track)
    assert.ok(data.includes(Buffer.from("avcC")), `${rel}: missing avcC (H264 config)`);
    assert.ok(data.includes(Buffer.from("avc1")), `${rel}: missing avc1 sample entry`);

    // stsd entry_count must be 1 (not malformed 114)
    const stsdPos = data.indexOf(Buffer.from("stsd"));
    assert.ok(stsdPos !== -1, `${rel}: missing stsd`);
    const entryCount = data.readUInt32BE(stsdPos + 8);
    assert.equal(entryCount, 1, `${rel}: stsd entry_count should be 1, got ${entryCount} (malformed)`);

    // Must contain at least one IDR NAL with length prefix
    const mdatBoxStart = data.indexOf(Buffer.from("mdat")) - 4;
    const mdatSize = data.readUInt32BE(mdatBoxStart);
    assert.ok(mdatSize > 100, `${rel}: mdat too small`);
    // Check first sample length
    const firstSampleLen = data.readUInt32BE(mdatBoxStart + 8);
    assert.ok(firstSampleLen > 100 && firstSampleLen < 100000, `${rel}: first sample length invalid ${firstSampleLen}`);
    /* Walk the first sample's length-prefixed AVCC NAL units and require that
       it carries an IDR slice (nal_unit_type 5) — i.e. it is a genuine
       random-access keyframe.

       This used to pin the very first NAL byte to 0x65. That only ever held
       for the hand-rolled placeholder: any real encoder (x264 included) emits
       SEI (6) before the IDR slice, so the old assertion would have rejected
       legitimate production footage — which the media contract explicitly
       requires to be swappable without component changes. Checking that an IDR
       slice is present in the keyframe is both correct and stricter. */
    const nalTypes = [];
    let cursor = mdatBoxStart + 8;
    const sampleEnd = cursor + mdatSize - 8;
    while (cursor + 4 <= sampleEnd && nalTypes.length < 8) {
      const nalLen = data.readUInt32BE(cursor);
      if (nalLen === 0 || cursor + 4 + nalLen > sampleEnd) break;
      nalTypes.push(data[cursor + 4] & 0x1f);
      cursor += 4 + nalLen;
    }
    assert.ok(nalTypes.length > 0, `${rel}: could not parse any NAL units from mdat`);
    assert.ok(
      nalTypes.includes(5),
      `${rel}: first keyframe carries no IDR slice (nal_unit_type 5); parsed [${nalTypes}]`
    );
  }
});

// ---------- 4. hero video has required attributes ----------
test("hotfix · CinematicVideo has required autoplay attributes", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /autoPlay/, "missing autoPlay");
  assert.match(cv, /muted/, "missing muted");
  assert.match(cv, /loop/, "missing loop");
  assert.match(cv, /playsInline/, "missing playsInline");
  assert.match(cv, /poster/, "missing poster");
  assert.match(cv, /preload/, "missing preload");
  assert.match(cv, /onCanPlay/, "missing onCanPlay");
  assert.match(cv, /onError/, "missing onError");
  assert.match(cv, /disablePictureInPicture/, "missing disablePictureInPicture");
});

// ---------- 5. hero video source resolves ----------
test("hotfix · hero video source resolves via mock asset boundary", () => {
  /* Phase 14.4A: the abstract hero placeholders were removed (the hero brief
     forbids gradient motion); real hero footage uses the reel slots in
     phase14-4a-hero-reel.test.mjs. The brand-film placeholder remains. */
  const assets = read("mock/assets/index.js");
  assert.match(assets, /heroReelSignatureVideo/, "hero reel slot not in asset index");
  assert.doesNotMatch(assets, /hero-cinematic\.mp4/, "abstract placeholder import must stay removed");

  const homepage = read("mock/data/homepage/index.js");
  assert.match(homepage, /src:\s*media\.heroReelSignatureVideo/, "hero video src not mapped");

  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /reel\.activeSrc/, "HeroSection does not use the resolved source");
  assert.match(hero, /CinematicVideo/, "HeroSection does not use CinematicVideo");
});

// ---------- 6. mobile source resolves ----------
test("hotfix · mobile source resolves and is distinct from desktop", () => {
  const assets = read("mock/assets/index.js");
  assert.match(assets, /heroReelSignatureMobileVideo/, "mobile slot not in asset index");

  const homepage = read("mock/data/homepage/index.js");
  assert.match(homepage, /mobileSrc/, "homepage missing mobileSrc");
  assert.match(homepage, /heroReelSignatureMobileVideo/, "mobile slot not referenced");

  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /effectiveSrc/, "CinematicVideo should resolve effectiveSrc");
  assert.match(cv, /isMobile/, "CinematicVideo should detect mobile viewport");
  assert.match(cv, /matchMedia.*max-width.*767/, "CinematicVideo should use 767px breakpoint");

  /* The hero resolves mobile vs desktop in the reel service on the same
     767px breakpoint (exercised behaviourally in phase14-4a-hero-reel). */
  const service = read("services/heroReelService.js");
  assert.match(service, /max-width: 767px/);
});

// ---------- 7. poster exists ----------
test("hotfix · poster exists and is referenced", () => {
  const assets = read("mock/assets/index.js");
  assert.match(assets, /heroEditorial/, "heroEditorial poster not in asset index");

  const homepage = read("mock/data/homepage/index.js");
  assert.match(homepage, /poster:\s*media\.heroEditorial/, "homepage video poster not mapped");

  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /reel\.poster\.src/, "HeroSection must paint the resolved poster first");

  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /poster/, "CinematicVideo must handle poster");
  assert.match(cv, /opacity-0/, "CinematicVideo should fade poster on canPlay");
});

// ---------- 8. play() failure has fallback ----------
test("hotfix · CinematicVideo handles play() promise rejection with fallback", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  // Must catch play() promise
  assert.match(cv, /\.play\(\)/, "should call play()");
  assert.match(cv, /\.catch\(/, "should catch play() promise");
  assert.match(cv, /needsTap/, "should have needsTap state for fallback");
  assert.match(cv, /showPlayFallback/, "should support showPlayFallback");
  assert.match(cv, /AbortError/, "should handle AbortError separately");
});

// ---------- 9. reduced motion disables autoplay ----------
test("hotfix · reduced motion disables autoplay", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /usePrefersReducedMotion/, "should use reduced motion hook");
  assert.match(cv, /reducedMotion/, "should have reducedMotion variable");
  assert.match(cv, /prefers-reduced-motion/, "should reference prefers-reduced-motion");

  const hero = read("pages/customer/home/components/HeroSection.jsx");
  assert.match(hero, /reel\.mode === "video"/, "HeroSection should only mount video in video mode");
  /* 14.4A: HeroSection reads reducedMotion through useHeroReel; the reel
     service forces poster mode when it is set. */
  assert.match(hero, /useHeroReel/, "HeroSection should resolve media via useHeroReel");
  const service = read("services/heroReelService.js");
  assert.match(service, /!reducedMotion && playable\.length > 0/, "reduced motion must force poster mode");

  const brand = read("pages/customer/home/components/BrandFilmSection.jsx");
  assert.match(brand, /reducedMotion/, "BrandFilmSection should check reducedMotion");
});

// ---------- 10. brand film play button triggers playback ----------
test("hotfix · brand film play button triggers video ref play()", () => {
  const brand = read("pages/customer/home/components/BrandFilmSection.jsx");
  assert.match(brand, /videoRef/, "should have videoRef");
  assert.match(brand, /handlePlay/, "should have handlePlay");
  // handlePlay should call play() on the video ref (either via v = videoRef.current; v.play() or directly)
  assert.match(brand, /videoRef\.current/, "should access videoRef.current");
  assert.match(brand, /\.play\(\)/, "handlePlay should call play()");
  assert.match(brand, /onClick.*handlePlay/, "play button should call handlePlay");
  assert.match(brand, /Play the art of gold film/, "should have accessible play label");
  assert.match(brand, /setPlaying\(true\)/, "should set playing true on play");
  assert.match(brand, /onEnded/, "should handle ended to reset");
});

// ---------- 11. video error falls back gracefully ----------
test("hotfix · video error falls back to poster gracefully", () => {
  const cv = read("components/ui/CinematicVideo.jsx");
  assert.match(cv, /failed/, "should have failed state");
  assert.match(cv, /setFailed\(true\)/, "should set failed on error");
  assert.match(cv, /onError/, "should have onError handler");
  assert.match(cv, /!failed/, "should not render video when failed");

  const brand = read("pages/customer/home/components/BrandFilmSection.jsx");
  assert.match(brand, /failed/, "BrandFilm should have failed state");
  assert.match(brand, /setFailed\(true\)/, "BrandFilm should set failed on error");
  assert.match(brand, /onError/, "BrandFilm should have onError");
});

// ---------- 12. H264 codec validation ----------
test("hotfix · videos are H264 baseline, yuv420p, browser compatible", () => {
  for (const rel of [
    "mock/assets/videos/editorial/art-of-gold.mp4",
  ]) {
    const data = readBinary(rel);
    const avcCPos = data.indexOf(Buffer.from("avcC"));
    assert.ok(avcCPos !== -1, `${rel}: avcC not found`);
    // avcC payload: after header (8), version, profile, compat, level, etc
    // profile should be baseline (66 = 0x42)
    const profile = data[avcCPos + 4 + 1]; // after box header, first byte of payload is version, second is profile
    // Actually avcC payload: version (1), profile (1), compat (1), level (1), ...
    // So profile at avcCPos+4+1
    const avcProfile = data[avcCPos + 4 + 1];
    assert.equal(avcProfile, 0x42, `${rel}: expected baseline profile 0x42, got 0x${avcProfile.toString(16)}`);
    const level = data[avcCPos + 4 + 3];
    assert.ok(level <= 0x1f, `${rel}: level should be low (<=31) for tiny video, got ${level}`);
  }
});
