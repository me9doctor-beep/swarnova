/**
 * MULTI-ANGLE HOVER SEQUENCE — Phase 14.4B
 * -----------------------------------------------------------------------------
 * The timing brain behind a product card's multi-angle hover. It knows
 * nothing about React or the DOM: it receives pointer intent and frame load
 * results, and reports `{ engaged, active }` through `render`. That keeps the
 * interaction deterministic and testable with fake timers.
 *
 *   active = -1          the canonical primary still
 *   active = 0 … n-1     hover frame i (slight left → slight right → detail)
 *   engaged              whether the hover layer is showing at all
 *
 * Sequence
 *   enter  → after `leadMs`, frame 0; then one frame every `stepMs`. The
 *            sequence settles on the LAST frame (detail) and holds there —
 *            it never loops, so it reads as one camera move around the
 *            piece, not a slideshow.
 *   leave  → `engaged` drops at once (the whole layer dissolves back to the
 *            primary as ONE surface: detail → primary, no intermediate
 *            angles flashing through). Once the dissolve has finished
 *            (`settleMs`) `active` quietly resets to -1.
 *   re-enter during that dissolve simply resumes: the reset is cancelled,
 *            the layer fades back in on the frame it left, and stepping
 *            continues. Nothing can stick on an alternate frame.
 *
 * Frames advance only once they have loaded (a half-downloaded image never
 * fades in); a frame that fails to load is skipped for good. When no usable
 * frame remains the card simply stays on the primary.
 */

/** Media queries that gate the interaction (read at pointer time). */
export const HOVER_CAPABLE_QUERY = "(hover: hover) and (pointer: fine)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const HOVER_SEQUENCE_DEFAULTS = Object.freeze({
  /** Pause before the first angle, so a pointer merely crossing the grid
      does not set a card moving. */
  leadMs: 260,
  /** One frame to the next: a ~700 ms dissolve (CSS) plus a quiet hold. */
  stepMs: 1500,
  /** Wait before resetting to the primary: just longer than the 700 ms CSS
      dissolve, so the reset always happens while the layer is invisible. */
  settleMs: 720,
});

/**
 * Whether this environment should play the multi-angle hover at all:
 * a real hovering, fine pointer (desktop / trackpad — not phones or touch
 * tablets) and no reduced-motion preference. `pointerType`, when given, must
 * be a mouse: a tap on a hybrid laptop never starts the sequence.
 */
export function canPlayHoverSequence(win = typeof window === "undefined" ? undefined : window, pointerType) {
  if (pointerType && pointerType !== "mouse") return false;
  if (!win || typeof win.matchMedia !== "function") return false;
  if (win.matchMedia(REDUCED_MOTION_QUERY).matches) return false;
  return win.matchMedia(HOVER_CAPABLE_QUERY).matches;
}

export function createHoverSequence({
  getFrameCount,
  render,
  timing = HOVER_SEQUENCE_DEFAULTS,
  timers = { setTimeout: globalThis.setTimeout.bind(globalThis), clearTimeout: globalThis.clearTimeout.bind(globalThis) },
} = {}) {
  const { leadMs, stepMs, settleMs } = { ...HOVER_SEQUENCE_DEFAULTS, ...timing };
  const loaded = new Set();
  const failed = new Set();
  const state = { engaged: false, active: -1 };
  let stepTimer = null;
  let resetTimer = null;
  let waitingFor = null;
  let disposed = false;

  const count = () => Math.max(0, Number(getFrameCount?.()) || 0);
  const emit = () => render?.({ ...state });
  const clear = (timer) => timer !== null && timers.clearTimeout(timer);

  function nextIndex(from) {
    for (let i = from + 1; i < count(); i += 1) if (!failed.has(i)) return i;
    return null;
  }

  function schedule(delay) {
    clear(stepTimer);
    stepTimer = timers.setTimeout(() => {
      stepTimer = null;
      step();
    }, delay);
  }

  function step() {
    if (disposed || !state.engaged) return;
    const next = nextIndex(state.active);
    if (next === null) return; // settled on the final frame — hold.
    if (!loaded.has(next)) {
      waitingFor = next; // advance the moment it arrives
      return;
    }
    waitingFor = null;
    state.active = next;
    emit();
    if (nextIndex(next) !== null) schedule(stepMs);
  }

  return {
    get state() {
      return { ...state };
    },

    enter() {
      if (disposed || count() === 0) return;
      clear(resetTimer);
      resetTimer = null;
      if (!state.engaged) {
        state.engaged = true;
        emit();
      }
      schedule(state.active < 0 ? leadMs : stepMs);
    },

    leave() {
      if (disposed) return;
      clear(stepTimer);
      stepTimer = null;
      waitingFor = null;
      if (state.engaged) {
        state.engaged = false;
        emit();
      }
      clear(resetTimer);
      resetTimer = timers.setTimeout(() => {
        resetTimer = null;
        if (state.engaged || state.active === -1) return;
        state.active = -1;
        emit();
      }, settleMs);
    },

    frameLoaded(index) {
      if (disposed || failed.has(index)) return;
      loaded.add(index);
      if (waitingFor === index && state.engaged && stepTimer === null) step();
    },

    frameFailed(index) {
      if (disposed) return;
      failed.add(index);
      loaded.delete(index);
      if (state.active === index) {
        state.active = -1;
        emit();
      }
      if (waitingFor === index) {
        waitingFor = null;
        step();
      }
    },

    isFrameUsable(index) {
      return !failed.has(index);
    },

    dispose() {
      disposed = true;
      clear(stepTimer);
      clear(resetTimer);
      stepTimer = resetTimer = null;
    },
  };
}
