import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canPlayHoverSequence,
  createHoverSequence,
} from "../features/product-media/hoverSequence.js";

/**
 * useProductMediaHover — Phase 14.4B.
 *
 * Wires a card's multi-angle hover: pointer intent in, frame visibility out.
 * The sequence rules live in `features/product-media/hoverSequence.js`; this
 * hook adds only the browser facts and keeps React out of the frame loop:
 *
 *   · Nothing is fetched until the first real mouse hover on a capable
 *     device. That hover "arms" the card — the ONLY React state update this
 *     hook ever makes — which mounts the frame layers so the browser starts
 *     downloading that one card's angles. A grid of forty cards costs zero
 *     alternate-image requests on load.
 *   · Every later change (engaged / active frame) is written straight to the
 *     layer's data attributes, which CSS turns into opacity dissolves. The
 *     card never re-renders while its sequence plays.
 *   · Touch, pen, `(hover: none)` devices and reduced-motion visitors never
 *     arm: the card keeps its static primary still.
 *
 * Returns `{ hasFrames, armed, bind, layersRef, onFrameLoad, onFrameError }`:
 * spread `bind` on the element that defines the hover area (the image frame
 * including its overlay actions, so moving onto the wishlist control is not
 * a "leave"), and hand the rest to <ProductMediaHover>.
 */
export function useProductMediaHover(frames) {
  const frameCount = Array.isArray(frames) ? frames.length : 0;
  const [armed, setArmed] = useState(false);
  const countRef = useRef(frameCount);
  const layersEl = useRef(null);
  const sequenceRef = useRef(null);
  countRef.current = frameCount;

  const paint = useCallback((state) => {
    const layer = layersEl.current;
    const sequence = sequenceRef.current;
    if (!layer || !sequence) return;
    layer.dataset.engaged = state.engaged ? "true" : "false";
    Array.from(layer.children).forEach((node, index) => {
      node.dataset.shown = index <= state.active && sequence.isFrameUsable(index) ? "true" : "false";
    });
  }, []);

  const sequence = useCallback(() => {
    sequenceRef.current ??= createHoverSequence({
      getFrameCount: () => countRef.current,
      render: paint,
    });
    return sequenceRef.current;
  }, [paint]);

  useEffect(() => () => sequenceRef.current?.dispose(), []);

  const onPointerEnter = useCallback(
    (event) => {
      if (countRef.current === 0) return;
      if (!canPlayHoverSequence(window, event?.pointerType)) return;
      setArmed(true); // no-op after the first hover
      sequence().enter();
    },
    [sequence]
  );

  const onPointerLeave = useCallback(() => {
    sequenceRef.current?.leave();
  }, []);

  /* Callback ref: when the layers mount (first hover) paint the current
     state, and report frames the browser already had cached — their `load`
     event may have fired before React could listen. */
  const layersRef = useCallback(
    (node) => {
      layersEl.current = node;
      if (!node) return;
      const seq = sequence();
      Array.from(node.children).forEach((img, index) => {
        if (img.complete && img.naturalWidth > 0) seq.frameLoaded(index);
      });
      paint(seq.state);
    },
    [paint, sequence]
  );

  const onFrameLoad = useCallback((index) => sequence().frameLoaded(index), [sequence]);

  const onFrameError = useCallback(
    (index) => {
      sequence().frameFailed(index);
      paint(sequence().state);
    },
    [paint, sequence]
  );

  const bind = useMemo(() => ({ onPointerEnter, onPointerLeave }), [onPointerEnter, onPointerLeave]);

  return {
    hasFrames: frameCount > 0,
    armed,
    bind,
    layersRef,
    onFrameLoad,
    onFrameError,
  };
}

export default useProductMediaHover;
