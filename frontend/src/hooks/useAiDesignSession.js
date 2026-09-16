import { useCallback, useEffect, useRef, useState } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { aiStudioService } from "../services/aiStudioService.js";

/**
 * AI DESIGN SESSION — the studio's action lifecycle.
 *
 * One hook owns the whole generation conversation so the page and its
 * components stay presentational:
 *
 *   create(request)          natural-language prompt + design direction → concept
 *   refine(feedback)         re-renders the current concept from new words
 *   createVariations()       renders variation plates for the current concept
 *   load(concept)            reopens a saved design in the studio
 *   retry()                  repeats the last attempt after an error
 *
 * Statuses: `idle` (nothing created yet) · `busy` (an action is rendering —
 * `action` says which) · `ready` (a concept is on the table) · `error`.
 * All generation behaviour lives behind the provider; this hook only tracks
 * the conversation.
 */
const INITIAL = { status: "idle", action: null, concept: null, error: undefined };

export function useAiDesignSession() {
  const provider = useDataProvider();
  const [state, setState] = useState(INITIAL);
  const [activePlate, setActivePlate] = useState(0);

  const alive = useRef(true);
  const conceptRef = useRef(null);
  const lastAttempt = useRef(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const applyConcept = useCallback((concept) => {
    conceptRef.current = concept;
    setActivePlate(0);
  }, []);

  const dispatch = useCallback(
    (action, request, task) => {
      lastAttempt.current = { action, request };
      setState((prev) => ({ ...prev, status: "busy", action, error: undefined }));

      Promise.resolve()
        .then(task)
        .then((result) => {
          if (!alive.current) return;

          if (action === "vary") {
            /* Variations arrive as { id, images } — the provider owns which
               plates exist; the session only adopts them for its concept. */
            setState((prev) =>
              prev.concept && prev.concept.id === result.id
                ? { status: "ready", action: null, error: undefined,
                    concept: { ...prev.concept, images: result.images } }
                : { ...prev, status: "ready", action: null }
            );
            setActivePlate(0);
            return;
          }

          applyConcept(result);
          setState({ status: "ready", action: null, concept: result, error: undefined });
        })
        .catch((error) => {
          if (!alive.current) return;
          setState((prev) => ({ ...prev, status: "error", action, error }));
        });
    },
    [applyConcept]
  );

  const create = useCallback(
    (request) =>
      dispatch("create", request, () => aiStudioService.generateDesign(provider, request)),
    [dispatch, provider]
  );

  const refine = useCallback(
    (feedback) => {
      const concept = conceptRef.current;
      if (!concept) return;
      const request = { conceptId: concept.id, feedback, purity: concept.purity };
      dispatch("refine", request, () => aiStudioService.refineDesign(provider, request));
    },
    [dispatch, provider]
  );

  const createVariations = useCallback(() => {
    const concept = conceptRef.current;
    if (!concept) return;
    dispatch("vary", { conceptId: concept.id }, () =>
      aiStudioService.createVariations(provider, concept.id)
    );
  }, [dispatch, provider]);

  /** Reopen a saved design — the studio adopts it exactly as saved. */
  const load = useCallback(
    (concept) => {
      lastAttempt.current = null;
      applyConcept(concept);
      setState({ status: "ready", action: null, concept, error: undefined });
    },
    [applyConcept]
  );

  const retry = useCallback(() => {
    const attempt = lastAttempt.current;
    if (!attempt) return;
    if (attempt.action === "create") create(attempt.request);
    else if (attempt.action === "refine") dispatch("refine", attempt.request, () =>
      aiStudioService.refineDesign(provider, attempt.request)
    );
    else if (attempt.action === "vary") dispatch("vary", attempt.request, () =>
      aiStudioService.createVariations(provider, attempt.request.conceptId)
    );
  }, [create, dispatch, provider]);

  return {
    status: state.status,
    action: state.action,
    concept: state.concept,
    error: state.error,
    isBusy: state.status === "busy",
    activePlate,
    setActivePlate,
    create,
    refine,
    createVariations,
    load,
    retry,
  };
}

export default useAiDesignSession;
