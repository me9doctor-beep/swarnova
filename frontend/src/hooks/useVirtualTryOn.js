import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { virtualTryOnService } from "../services/virtualTryOnService.js";
import { useSavedTryOns } from "../state/SavedTryOnsContext.jsx";
import { useAsync } from "./useAsync.js";

/** Phone photographs can be heavy; the room accepts up to 8 MB. */
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const SESSION_IDLE = { status: "idle", result: null, error: undefined };

/** The room's arrival contract — `?design=<id>` for an AI Studio concept,
 *  `?product=<id>` for a catalogue piece. Query parameters are the
 *  API-ready transfer mechanism: stateless, reload-safe and the exact
 *  shape a future `GET /try-on/:type/:id` would accept. */
function readSpec(searchParams) {
  const designId = searchParams.get("design");
  if (designId) return { sourceType: "ai-design", sourceId: designId };
  const productId = searchParams.get("product");
  if (productId) return { sourceType: "product", sourceId: productId };
  return null;
}

/**
 * VIRTUAL TRY-ON SESSION — the fitting room's action lifecycle.
 *
 * One hook owns the whole room so the page and its components stay
 * presentational:
 *
 *   selectSample(sample)    stand in one of the curated portraits
 *   uploadPhoto(file)       a customer photograph, validated + previewed
 *   removePhoto()           clear the mirror (and any preview it produced)
 *   tryOn()                 dress the photo in the selected jewellery
 *   retry()                 repeat the attempt after a failure
 *   selectJewellery(id)     swap the piece, keep the photograph
 *   saveResult()            snapshot the preview for this visit
 *
 * Session statuses: `idle` (mirror undressed) · `processing` (the room is
 * preparing) · `ready` (a preview is on the mirror) · `error`. The source —
 * AI design or catalogue piece — resolves through the provider, so the room
 * never knows whether mock data or a future API supplies it.
 *
 * Transient by design: the mirror, the preview and the visit's saved results
 * live here, not in global state — nothing outside the room needs them yet.
 */
export function useVirtualTryOn() {
  const provider = useDataProvider();
  const [searchParams, setSearchParams] = useSearchParams();

  const spec = useMemo(() => readSpec(searchParams), [searchParams]);
  const specKey = spec ? `${spec.sourceType}:${spec.sourceId}` : "none";

  /* The jewellery the room dresses — resolved through the provider so a null
     answer (unknown or ineligible piece) reads exactly like a 404. */
  const task = useCallback(
    () =>
      spec
        ? virtualTryOnService.getSource(provider, spec)
        : Promise.resolve(null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, specKey]
  );
  const sourceState = useAsync(task, [provider, specKey]);

  const [photo, setPhoto] = useState(null);
  const [photoError, setPhotoError] = useState(undefined);
  const [session, setSession] = useState(SESSION_IDLE);
  const { savedResults, saveResult: persistResult, hasResult, count: savedCount } = useSavedTryOns();

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  /* A new piece supersedes the previous preview — the mirror keeps the
     photograph, exactly as a real fitting room would. */
  useEffect(() => {
    setSession(SESSION_IDLE);
  }, [specKey]);

  const adoptPhoto = useCallback((nextPhoto) => {
    setPhoto(nextPhoto);
    setPhotoError(undefined);
    setSession(SESSION_IDLE);
  }, []);

  /** Stand in a curated sample portrait. */
  const selectSample = useCallback(
    (sample) => {
      if (!sample?.image) return;
      adoptPhoto({
        origin: "sample",
        sampleId: sample.id,
        name: sample.name,
        image: sample.image,
      });
    },
    [adoptPhoto]
  );

  /** A customer photograph — validated and previewed entirely in-browser. */
  const uploadPhoto = useCallback(
    (file) => {
      if (!file) return;
      if (!file.type || !file.type.startsWith("image/")) {
        setPhotoError(
          "That file doesn't look like a photograph. Please choose a JPG or PNG image."
        );
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setPhotoError(
          "That photograph is larger than 8 MB. Please choose a smaller image."
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (!alive.current) return;
        if (typeof reader.result !== "string") {
          setPhotoError("We couldn't read that photograph. Please try another file.");
          return;
        }
        adoptPhoto({
          origin: "upload",
          name: file.name,
          image: { src: reader.result, alt: `Your photograph — ${file.name}` },
        });
      };
      reader.onerror = () => {
        if (alive.current) {
          setPhotoError("We couldn't read that photograph. Please try another file.");
        }
      };
      reader.readAsDataURL(file);
    },
    [adoptPhoto]
  );

  const removePhoto = useCallback(() => {
    setPhoto(null);
    setPhotoError(undefined);
    setSession(SESSION_IDLE);
  }, []);

  const clearPhotoError = useCallback(() => setPhotoError(undefined), []);

  /** Dress the photograph in the selected jewellery. Photo and source are
   *  untouched by success or failure, so Try Again never loses the mirror. */
  const tryOn = useCallback(() => {
    if (!spec || !photo) return;
    setSession({ status: "processing", result: null, error: undefined });
    const request = { sourceType: spec.sourceType, sourceId: spec.sourceId, photo };

    Promise.resolve()
      .then(() => virtualTryOnService.createTryOn(provider, request))
      .then((result) => {
        if (alive.current) setSession({ status: "ready", result, error: undefined });
      })
      .catch((error) => {
        if (alive.current) setSession({ status: "error", result: null, error });
      });
  }, [provider, spec, photo]);

  /** Swap the piece under the URL — the room re-resolves the source and keeps
   *  the photograph; the shared fitting room serves both journeys. */
  const selectJewellery = useCallback(
    (productId) => {
      setSearchParams({ product: productId });
    },
    [setSearchParams]
  );

  /* Visit-scoped snapshots of finished previews delegated to SavedTryOnsContext. */
  const isResultSaved = Boolean(
    session.result && hasResult(session.result.id)
  );

  const saveResult = useCallback(() => {
    if (!session.result) return;
    persistResult(session.result);
  }, [session.result, persistResult]);

  return {
    /* Source */
    spec,
    sourceStatus: sourceState.status,
    source: sourceState.data,
    sourceError: sourceState.error,
    retrySource: sourceState.retry,
    jewellery: sourceState.data?.jewellery ?? null,

    /* Mirror */
    photo,
    photoError,
    selectSample,
    uploadPhoto,
    removePhoto,
    clearPhotoError,

    /* Session */
    status: session.status,
    result: session.result,
    error: session.error,
    canTryOn: Boolean(spec && sourceState.data && photo && session.status !== "processing"),
    tryOn,
    retry: tryOn,

    /* Visit shelf */
    savedCount: savedResults.length,
    isResultSaved,
    saveResult,

    /* Change jewellery */
    selectJewellery,
  };
}

export default useVirtualTryOn;
