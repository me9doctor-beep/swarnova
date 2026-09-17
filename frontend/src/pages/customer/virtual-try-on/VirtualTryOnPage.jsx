import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import Section from "../../../components/ui/Section.jsx";
import SectionHeading from "../../../components/ui/SectionHeading.jsx";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import TryOnJewelleryCard from "../../../components/virtual-try-on/TryOnJewelleryCard.jsx";
import TryOnJewellerySelector from "../../../components/virtual-try-on/TryOnJewellerySelector.jsx";
import TryOnPhotoPicker from "../../../components/virtual-try-on/TryOnPhotoPicker.jsx";
import TryOnPhotoPreview from "../../../components/virtual-try-on/TryOnPhotoPreview.jsx";
import TryOnResult from "../../../components/virtual-try-on/TryOnResult.jsx";
import { useAddProductToBag } from "../../../hooks/useAddProductToBag.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useTryOnRoom } from "../../../hooks/useTryOnRoom.js";
import { useVirtualTryOn } from "../../../hooks/useVirtualTryOn.js";

/**
 * VIRTUAL TRY-ON — the shared digital fitting room at `/virtual-try-on`.
 *
 * One room serves both journeys, with no duplicated implementation:
 *
 *   AI Studio generated design → ?design=<concept-id>
 *   Catalogue product          → ?product=<product-id>
 *
 * The mirror (portrait, preview, result) stands beside the vanity — the
 * selected piece, the photograph intake and the actions — from `lg`, the
 * same two blocks stacked below it. All behaviour lives in `useVirtualTryOn`
 * → service → provider; the page only composes, exactly like the studio.
 */
export default function VirtualTryOnPage() {
  const roomState = useTryOnRoom();
  const fitting = useVirtualTryOn();
  const { addCanonical } = useAddProductToBag();

  /* Quiet confirmations (save / share / bag) — replaced by the next action. */
  const [note, setNote] = useState(null);
  const [changing, setChanging] = useState(false);

  useDocumentTitle("Virtual Try-On — Swarnova");

  /* A new preview or a fresh photograph supersedes the previous note. */
  useEffect(() => {
    setNote(null);
  }, [fitting.result, fitting.photo]);

  /* Opening the change rail brings it into view; the rail owns `try-on-change`. */
  useEffect(() => {
    if (changing) document.getElementById("try-on-change")?.scrollIntoView();
  }, [changing]);

  if (roomState.status !== "success") {
    return (
      <Container className="pb-20 pt-[160px] sm:pb-28">
        <AsyncBoundary
          status={roomState.status}
          error={roomState.error}
          onRetry={roomState.retry}
          className="min-h-[320px] py-0"
        />
      </Container>
    );
  }

  const room = roomState.data;

  const noteMessage =
    note === "saved"
      ? room.savedMessage
      : note === "bagged"
        ? room.baggedMessage
        : note === "bagUnavailable"
          ? room.bagUnavailableMessage
          : note
            ? room.share?.[note]
            : null;

  const handleSave = () => {
    if (!fitting.result || fitting.isResultSaved) return;
    fitting.saveResult();
    setNote("saved");
  };

  /* Share is browser-native, the studio's own pattern: the platform share
     sheet where it exists, the clipboard otherwise. */
  const handleShare = async () => {
    if (!fitting.spec || !fitting.jewellery) return;
    const url = window.location.href;
    const text = `${fitting.jewellery.name} — seen on me in the Swarnova fitting room.`;

    let shared = false;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Swarnova Virtual Try-On", text, url });
        shared = true;
      } catch (shareError) {
        /* The customer closed the share sheet — nothing to report. */
        if (shareError?.name === "AbortError") return;
      }
    }
    if (shared) {
      setNote("shared");
      return;
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setNote("copied");
    } catch {
      setNote("unavailable");
    }
  };

  /* Catalogue pieces join the bag through the existing cart, and the bag line
     is the CANONICAL piece — the room's own summary is a preview of the
     jewellery, not a commerce record, and a concept that is not a published
     product never becomes a bag line at all. AI designs never pretend to be
     purchasable, so this path stays product-only. */
  const handleAddToBag = async () => {
    if (!fitting.jewellery) return;
    const { added } = await addCanonical(fitting.jewellery.id);
    setNote(added ? "bagged" : "bagUnavailable");
  };

  const handleSelectJewellery = (productId) => {
    fitting.selectJewellery(productId);
    setChanging(false);
    document.getElementById("fitting-room")?.scrollIntoView();
  };

  const toggleChanging = () => setChanging((value) => !value);

  return (
    <>
      <CatalogueHeader
        eyebrow={room.page.eyebrow}
        title={room.page.title}
        description={room.page.description}
      />

      <Section id="fitting-room" background="ivory" ariaLabel="The virtual fitting room">
        <Container>
          {!fitting.spec ? (
            <EmptyState
              title={room.errors.noSource.title}
              action={
                <>
                  <Button href="/ai-studio">{room.errors.noSource.studio}</Button>
                  <Button variant="outline" href="/products">
                    {room.errors.noSource.browse}
                  </Button>
                </>
              }
            >
              {room.errors.noSource.body}
            </EmptyState>
          ) : fitting.sourceStatus !== "success" ? (
            <AsyncBoundary
              status={fitting.sourceStatus}
              error={fitting.sourceError}
              onRetry={fitting.retrySource}
              className="min-h-[320px] py-0"
            />
          ) : !fitting.source ? (
            <EmptyState
              title={room.errors.notFound.title}
              action={
                <>
                  <Button href="/ai-studio">{room.errors.notFound.studio}</Button>
                  <Button variant="outline" href="/products">
                    {room.errors.notFound.browse}
                  </Button>
                </>
              }
            >
              {room.errors.notFound.body}
            </EmptyState>
          ) : (
            <div className="grid items-start gap-12 lg:grid-cols-[7fr_5fr] lg:gap-16">
              {/* The mirror — portrait, preview and result share one stage. */}
              <div>
                {fitting.result ? (
                  <TryOnResult copy={room.result} result={fitting.result} />
                ) : fitting.photo ? (
                  <TryOnPhotoPreview
                    copy={room.photo}
                    photo={fitting.photo}
                    busy={fitting.status === "processing"}
                    busyMessage={room.generation.preparing}
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-full flex-col items-center justify-center border border-dashed border-border-default bg-surface-primary px-6 text-center sm:px-10">
                    <p className="eyebrow eyebrow-light">{room.photo.heading}</p>
                    <p className="mt-4 font-serif text-h3 leading-snug text-text-primary">
                      {room.photo.emptyTitle}
                    </p>
                    <p className="mt-3 max-w-xs text-body-sm leading-relaxed text-text-secondary">
                      {room.photo.emptyBody}
                    </p>
                  </div>
                )}
              </div>

              {/* The vanity — piece, photograph and actions. */}
              <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
                <TryOnJewelleryCard
                  copy={room.jewellery}
                  jewellery={fitting.jewellery}
                  sourceType={fitting.spec.sourceType}
                  changing={changing}
                  onChangeRequest={toggleChanging}
                />

                <div className="mt-8 border-t border-border-default pt-8">
                  <TryOnPhotoPicker
                    copy={room.photo}
                    samples={room.samples}
                    photo={fitting.photo}
                    error={fitting.photoError}
                    onSampleSelect={fitting.selectSample}
                    onFileSelect={fitting.uploadPhoto}
                    onRemove={fitting.removePhoto}
                  />
                </div>

                <div className="mt-8 border-t border-border-default pt-8">
                  {fitting.result ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          variant={fitting.isResultSaved ? "secondary" : "primary"}
                          disabled={fitting.isResultSaved}
                          onClick={handleSave}
                          className="flex-1"
                        >
                          {fitting.isResultSaved ? (
                            <>
                              <Check size={13} strokeWidth={1.8} aria-hidden="true" />
                              {room.actions.saved}
                            </>
                          ) : (
                            room.actions.save
                          )}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={handleShare}>
                          {room.actions.share}
                        </Button>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={toggleChanging}
                          aria-expanded={changing}
                          aria-controls="try-on-change"
                        >
                          {room.actions.change}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={fitting.retry}>
                          {room.actions.tryAgain}
                        </Button>
                      </div>
                      <div className="border-t border-border-default pt-4">
                        {fitting.spec.sourceType === "product" ? (
                          <div className="flex flex-col gap-3">
                            <Button href={fitting.jewellery.href} className="w-full">
                              {room.actions.viewProduct}
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={handleAddToBag}
                            >
                              {room.actions.addToBag}
                            </Button>
                          </div>
                        ) : (
                          <Button href="/ai-studio" className="w-full">
                            {room.actions.continueDesigning}
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Button
                        className="w-full"
                        disabled={!fitting.canTryOn}
                        onClick={fitting.tryOn}
                      >
                        <Sparkles size={14} strokeWidth={1.6} aria-hidden="true" />
                        {room.cta.tryOn}
                      </Button>
                      {!fitting.photo && (
                        <p className="mt-3 text-center text-body-sm text-text-muted">
                          {room.cta.needsPhoto}
                        </p>
                      )}
                    </div>
                  )}

                  {/* The room's single live status channel — busy, failure and
                      confirmations all render in one aria-live region. */}
                  <div className="mt-4" aria-live="polite">
                    {fitting.status === "processing" ? (
                      <p role="status" className="eyebrow eyebrow-light">
                        {room.generation.preparing}
                      </p>
                    ) : fitting.status === "error" ? (
                      <div role="alert">
                        <p className="text-body text-state-error">
                          {fitting.error?.message ?? room.generation.errorFallback}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={fitting.retry}
                        >
                          {room.actions.tryAgain}
                        </Button>
                      </div>
                    ) : noteMessage ? (
                      <p role="status" className="text-body-sm text-brand-accent-strong">
                        {noteMessage}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>

      {/* Change jewellery — the catalogue's eligible rail, shared by both
          journeys; the room keeps the photograph when the piece changes. */}
      {changing && fitting.spec && fitting.sourceStatus === "success" && fitting.source && (
        <Section id="try-on-change" ariaLabel={room.change.title}>
          <Container>
            <SectionHeading
              eyebrow={room.change.eyebrow}
              title={room.change.title}
              description={room.change.description}
              headingLevel={2}
            />
            <div className="mt-12">
              <TryOnJewellerySelector
                copy={room.change}
                currentId={
                  fitting.spec.sourceType === "product" ? fitting.spec.sourceId : null
                }
                onSelect={handleSelectJewellery}
              />
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
