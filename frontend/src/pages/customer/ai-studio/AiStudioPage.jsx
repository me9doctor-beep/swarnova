import ContentLink from "../../../components/ui/ContentLink.jsx";
import { intakeLink } from "../../../utils/links.js";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import Section from "../../../components/ui/Section.jsx";
import SectionHeading from "../../../components/ui/SectionHeading.jsx";
import TextLink from "../../../components/ui/TextLink.jsx";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import AiDesignResult from "../../../components/ai/AiDesignResult.jsx";
import AiSavedDesigns from "../../../components/ai/AiSavedDesigns.jsx";
import AiStudioPrompt from "../../../components/ai/AiStudioPrompt.jsx";
import { useAiAtelier } from "../../../hooks/useAiAtelier.js";
import { useAiDesignSession } from "../../../hooks/useAiDesignSession.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useSavedDesigns } from "../../../state/SavedDesignsContext.jsx";
import { useStorefrontAvailability } from "../../../features/storefront/StorefrontFeatures.jsx";
import { isFeatureOpen } from "../../../features/storefront/availability.js";

/**
 * AI JEWELLERY STUDIO — the dedicated customer atelier at `/ai-studio`.
 *
 * The homepage introduces the studio; this page owns the experience:
 * describe a piece, let the atelier render it, explore variations, refine,
 * save and share — and continue toward the catalogue when ready.
 *
 * Composition at every width: the creation form beside the generated design
 * from `lg`, the same two blocks stacked below it. Generation behaviour
 * lives in the session hook → service → provider; the page only composes.
 */
export default function AiStudioPage() {
  const availability = useStorefrontAvailability();
  const { status, data: atelier, error, retry } = useAiAtelier();
  const studio = useAiDesignSession();
  const { designs, save, remove, has } = useSavedDesigns();
  const [searchParams] = useSearchParams();

  /* Quiet confirmations (save / share) — replaced by the next action. */
  const [note, setNote] = useState(null);

  useDocumentTitle("AI Jewellery Studio — Swarnova");

  const concept = studio.concept;

  const conceptParam = searchParams.get("concept");
  useEffect(() => {
    if (conceptParam && !studio.concept) {
      const match = designs.find((d) => d.concept.id === conceptParam);
      if (match) {
        studio.load(match.concept);
      }
    }
  }, [conceptParam, designs, studio]);

  /* A new concept supersedes the previous one's confirmations. */
  useEffect(() => {
    setNote(null);
  }, [concept]);

  const busyMessage = studio.isBusy
    ? studio.action === "refine"
      ? atelier?.generation.refining
      : studio.action === "vary"
        ? atelier?.generation.varying
        : atelier?.generation.creating
    : null;

  const noteMessage =
    note === "saved" ? atelier?.result.savedMessage : note ? atelier?.share?.[note] : null;

  const handleSave = () => {
    if (!concept || has(concept.id)) return;
    save(concept);
    setNote("saved");
  };

  /* Share is browser-native: the platform share sheet where it exists, the
     clipboard otherwise. No sharing backend in Phase 5. */
  const handleShare = async () => {
    if (!concept) return;
    const url = window.location.href;
    const text = `${concept.title} — a jewellery concept imagined in the Swarnova AI Studio.`;

    let shared = false;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Swarnova AI Studio", text, url });
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

  const handleOpenSaved = (entry) => {
    studio.load(entry.concept);
    document.getElementById("atelier")?.scrollIntoView();
  };

  /* Entry is the route guard. This page only waits for the atelier document. */
  if (status !== "success") {
    return (
      <Container className="pb-20 pt-[160px] sm:pb-28">
        <AsyncBoundary
          status={status === "error" ? "error" : "loading"}
          error={error}
          onRetry={retry}
          className="min-h-[320px] py-0"
        />
      </Container>
    );
  }

  const { page, result: resultCopy, generation, savedDesigns, nextSteps } = atelier;
  const isSaved = concept ? has(concept.id) : false;

  /* A generated concept points at the catalogue's own category, so the
     onward CTA deep-links into the existing product listing. The same
     concept also carries into the shared fitting room — one try-on
     experience, never a second implementation inside the studio. */
  const catalogueHref = concept?.category
    ? `/products?category=${concept.category}`
    : nextSteps.cta.href;
  const tryOnHref =
    concept && isFeatureOpen(availability, "virtualTryOn")
      ? `/virtual-try-on?design=${concept.id}`
      : undefined;

  return (
    <>
      <CatalogueHeader
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
      />

      {/* The atelier — creation area beside the generated design. */}
      <Section id="atelier" background="ivory" ariaLabelledby="ai-studio-create-title">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
              <AiStudioPrompt copy={atelier} busy={studio.isBusy} onCreate={studio.create} />
            </div>

            <section aria-labelledby="ai-studio-result-title">
              <h2
                id="ai-studio-result-title"
                className="font-serif text-h2 leading-[1.2] text-text-primary"
              >
                {resultCopy.heading}
              </h2>

              {concept && <p className="mt-5"><ContentLink className="underline underline-offset-4" href={intakeLink("custom", { aiDesignId: concept.id })}>Discuss this concept as a custom piece</ContentLink></p>}
              <div className="mt-6">
                {concept ? (
                  <AiDesignResult
                    copy={atelier}
                    concept={concept}
                    activePlate={studio.activePlate}
                    onPlateChange={studio.setActivePlate}
                    busyAction={studio.isBusy ? studio.action : null}
                    busyMessage={busyMessage}
                    error={studio.error}
                    note={noteMessage}
                    isSaved={isSaved}
                    tryOnHref={tryOnHref}
                    onRefine={studio.refine}
                    onVary={studio.createVariations}
                    onSave={handleSave}
                    onShare={handleShare}
                  />
                ) : studio.isBusy ? (
                  <div
                    role="status"
                    aria-live="polite"
                    className="motion-atelier-pulse flex min-h-[320px] flex-col items-center justify-center border border-brand-accent/30 bg-surface-primary px-6 py-16 text-center"
                  >
                    <p className="eyebrow tracking-[0.34em] text-brand-accent-strong">
                      {atelier?.generation?.atelierLabel ?? "Creating Your Design"}
                    </p>
                    <p className="mt-4 font-serif text-h3 italic leading-relaxed text-text-secondary">
                      {busyMessage}
                    </p>
                    {/* Ornamental gold hairline — the "atelier is at work" sign. */}
                    <div className="mt-8 flex items-center gap-3" aria-hidden="true">
                      <span className="h-px w-12 bg-brand-accent/40" />
                      <span className="h-[5px] w-[5px] rotate-45 border border-brand-accent/50" />
                      <span className="h-px w-12 bg-brand-accent/40" />
                    </div>
                  </div>
                ) : studio.status === "error" ? (
                  <div
                    role="alert"
                    className="border border-dashed border-border-default bg-surface-primary px-6 py-16 text-center"
                  >
                    <p className="mx-auto max-w-md text-body text-text-secondary">
                      {studio.error?.message ?? generation.errorFallback}
                    </p>
                    <Button variant="outline" size="sm" className="mt-6" onClick={studio.retry}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <EmptyState className="flex min-h-[320px] items-center justify-center text-center">
                    {resultCopy.emptyMessage}
                  </EmptyState>
                )}
              </div>
            </section>
          </div>
        </Container>
      </Section>

      {/* Saved designs — the visit's atelier shelf. */}
      <Section ariaLabel={savedDesigns.title}>
        <Container>
          <SectionHeading
            eyebrow={savedDesigns.eyebrow}
            title={savedDesigns.title}
            description={savedDesigns.description}
            headingLevel={2}
          />
          <div className="mt-12">
            <AiSavedDesigns
              copy={savedDesigns}
              context={atelier.context}
              designs={designs}
              onOpen={handleOpenSaved}
              onRemove={remove}
            />
          </div>
        </Container>
      </Section>

      {/* Onward — toward the catalogue, never a manufacturing workflow. */}
      <Section background="wine" ariaLabel={nextSteps.title}>
        <Container>
          <SectionHeading
            tone="wine"
            eyebrow={nextSteps.eyebrow}
            title={nextSteps.title}
            description={nextSteps.description}
            headingLevel={2}
          />
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Button variant="outlineInverse" href={catalogueHref}>
              {nextSteps.cta.label}
            </Button>
            <TextLink href={nextSteps.secondaryCta.href} tone="light">
              {nextSteps.secondaryCta.label}
            </TextLink>
          </div>
        </Container>
      </Section>
    </>
  );
}
