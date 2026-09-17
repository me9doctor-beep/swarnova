import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Camera, Share2, Trash2, Eye, Check } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import IconButton from "../../../components/ui/IconButton.jsx";
import { useSavedDesigns } from "../../../state/SavedDesignsContext.jsx";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

/**
 * SAVED AI DESIGNS — the member's own studio shelf.
 *
 * Ownership first: the list comes from the owner-scoped saved-designs store
 * (`state/SavedDesignsContext.jsx`), so one customer never sees another's
 * concepts and a guest's work is adopted on sign-in rather than duplicated.
 * Nothing here invents design data — every card is the concept as the studio
 * saved it, and the two ways forward (refine, try on) hand the canonical
 * concept id back to the surfaces that own it. Removal is local: it clears
 * the shelf, never the studio's own record.
 */
export default function SavedDesignsPage() {
  useDocumentTitle("Saved AI Designs — Swarnova");

  const { designs, remove, count } = useSavedDesigns();
  const [activeModalDesign, setActiveModalDesign] = useState(null);
  const [shareNote, setShareNote] = useState({});

  const handleShare = async (concept) => {
    const url = `${window.location.origin}/ai-studio?concept=${concept.id}`;
    const text = `Explore this bespoke ${concept.title} concept envisioned at Swarnova AI Studio.`;

    let shared = false;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: concept.title, text, url });
        shared = true;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    if (!shared) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareNote((prev) => ({ ...prev, [concept.id]: "Copied to clipboard" }));
        setTimeout(() => {
          setShareNote((prev) => {
            const next = { ...prev };
            delete next[concept.id];
            return next;
          });
        }, 3000);
      } catch {
        setShareNote((prev) => ({ ...prev, [concept.id]: "Could not copy link" }));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-border-default pb-5">
        <div>
          <h2 className="font-serif text-h2 font-medium text-text-primary">Saved AI Designs</h2>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Bespoke concepts co-created in the Swarnova AI Jewellery Atelier.
          </p>
        </div>
        {count > 0 && (
          <p className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
            {count} {count === 1 ? "Concept" : "Concepts"} Saved
          </p>
        )}
      </div>

      {designs.length === 0 ? (
        <EmptyState
          title="No AI Designs Saved Yet"
          action={<Button href="/ai-studio">Enter AI Studio</Button>}
          className="py-16 text-center"
        >
          Envision jewellery using natural words and artistic directions in our AI Atelier.
          Saved bespoke concepts will be preserved here for your next visit or private viewing.
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {designs.map((entry) => {
            const { concept, saveId, savedAt } = entry;
            const plate = concept.images?.[0];
            const feedback = shareNote[concept.id];

            return (
              <Card key={saveId} className="flex h-full flex-col">
                <Card.Media ratio="4/3">
                  <img
                    src={plate?.src}
                    alt={plate?.alt ?? concept.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </Card.Media>

                <Card.Body padding="sm" className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-label font-medium uppercase tracking-[0.28em] text-brand-accent-strong">
                        {concept.purity} Gold · AI Studio Concept
                      </p>
                      <h3 className="mt-1 font-serif text-h4 leading-snug text-text-primary">
                        {concept.title}
                      </h3>
                    </div>
                    <IconButton
                      label={`Remove ${concept.title} from saved designs`}
                      size="sm"
                      variant="plain"
                      onClick={() => remove(saveId)}
                      className="text-text-muted hover:text-state-error shrink-0"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </IconButton>
                  </div>

                  {concept.promptSummary && (
                    <p className="mt-2 line-clamp-2 font-serif text-caption italic text-text-secondary">
                      &ldquo;{concept.promptSummary}&rdquo;
                    </p>
                  )}

                  <p className="mt-1 font-sans text-[11px] text-text-muted">
                    Saved on{" "}
                    {new Date(savedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>

                  {feedback && (
                    <p className="mt-2 text-caption text-brand-accent-strong flex items-center gap-1">
                      <Check size={12} /> {feedback}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-auto space-y-2 pt-5 border-t border-border-default">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setActiveModalDesign(concept)}
                      >
                        <Eye size={12} strokeWidth={1.5} aria-hidden="true" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        href={`/ai-studio?concept=${concept.id}`}
                      >
                        <Sparkles size={12} strokeWidth={1.5} aria-hidden="true" />
                        Refine
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        href={`/virtual-try-on?design=${concept.id}`}
                      >
                        <Camera size={12} strokeWidth={1.5} aria-hidden="true" />
                        Try On
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => handleShare(concept)}
                        aria-label={`Share ${concept.title}`}
                      >
                        <Share2 size={13} strokeWidth={1.5} aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* The concept detail overlay is the shared Dialog primitive: Escape,
          the backdrop and the close button all resolve through it, and the
          panel holds its own scroll and focus. */}
      <Dialog
        open={Boolean(activeModalDesign)}
        onClose={() => setActiveModalDesign(null)}
        title={
          activeModalDesign
            ? `${activeModalDesign.purity} Gold · AI Studio Concept`
            : "AI Studio Concept"
        }
        width="lg"
      >
        {activeModalDesign ? (
          <div className="space-y-6">
            <div className="aspect-[4/3] w-full overflow-hidden border border-border-default bg-surface-secondary">
              <img
                src={activeModalDesign.images?.[0]?.src}
                alt={activeModalDesign.images?.[0]?.alt ?? activeModalDesign.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <h3 className="font-serif text-h2 text-text-primary">
                {activeModalDesign.title}
              </h3>

              {activeModalDesign.story && (
                <p className="mt-4 font-serif text-body leading-relaxed text-text-secondary">
                  {activeModalDesign.story}
                </p>
              )}

              {activeModalDesign.promptSummary && (
                <div className="mt-4 border-l-2 border-brand-accent bg-surface-secondary p-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-text-muted">
                    Atelier Prompt
                  </p>
                  <p className="mt-1 font-serif text-body-sm italic text-text-primary">
                    &ldquo;{activeModalDesign.promptSummary}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 border-t border-border-default pt-6">
              <Button href={`/ai-studio?concept=${activeModalDesign.id}`}>
                <Sparkles size={13} strokeWidth={1.5} aria-hidden="true" />
                Continue Designing in Studio
              </Button>
              <Button
                variant="outline"
                href={`/virtual-try-on?design=${activeModalDesign.id}`}
              >
                <Camera size={13} strokeWidth={1.5} aria-hidden="true" />
                Try It On
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
