import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Eye, Trash2, Share2, ShoppingBag, X, Check } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import IconButton from "../../../components/ui/IconButton.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { useSavedTryOns } from "../../../state/SavedTryOnsContext.jsx";
import { useCart } from "../../../state/CartContext.jsx";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

export default function SavedTryOnsPage() {
  useDocumentTitle("Saved Try-Ons — Swarnova");

  const { savedResults, removeResult, count } = useSavedTryOns();
  const { add } = useCart();
  const [activeModalResult, setActiveModalResult] = useState(null);
  const [shareNote, setShareNote] = useState({});
  const [bagNote, setBagNote] = useState({});

  const handleShare = async (entry) => {
    const { result } = entry;
    const isAi = result.sourceType === "ai-design";
    const param = isAi ? `design=${result.sourceId}` : `product=${result.sourceId}`;
    const url = `${window.location.origin}/virtual-try-on?${param}`;
    const text = `See how ${result.jewellery} looks in the Swarnova Virtual Fitting Room:`;

    let shared = false;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Swarnova Virtual Try-On", text, url });
        shared = true;
      } catch (err) {
        if (err?.name === "AbortError") return;
      }
    }

    if (!shared) {
      try {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareNote((prev) => ({ ...prev, [entry.saveId]: "Copied to clipboard" }));
        setTimeout(() => {
          setShareNote((prev) => {
            const next = { ...prev };
            delete next[entry.saveId];
            return next;
          });
        }, 3000);
      } catch {
        setShareNote((prev) => ({ ...prev, [entry.saveId]: "Could not copy link" }));
      }
    }
  };

  const handleAddToBag = (entry) => {
    const details = entry.result?.jewelleryDetails;
    if (details) {
      add(details);
      setBagNote((prev) => ({ ...prev, [entry.saveId]: "Added to bag" }));
      setTimeout(() => {
        setBagNote((prev) => {
          const next = { ...prev };
          delete next[entry.saveId];
          return next;
        });
      }, 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-border-default pb-5">
        <div>
          <h2 className="font-serif text-h2 font-medium text-text-primary">Saved Try-On Results</h2>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Your personal digital fitting previews draped in our virtual mirror.
          </p>
        </div>
        {count > 0 && (
          <p className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
            {count} {count === 1 ? "Preview" : "Previews"} Saved
          </p>
        )}
      </div>

      {savedResults.length === 0 ? (
        <EmptyState
          title="No Saved Fitting Previews"
          action={<Button href="/virtual-try-on">Try Jewellery On</Button>}
          className="py-16 text-center"
        >
          Step into our virtual fitting room to see Swarnova pieces or your custom AI concepts
          draped on your portrait. Saved snapshots will appear here for your visit.
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {savedResults.map((entry) => {
            const { result, saveId, savedAt } = entry;
            const previewImg = result.resultReference?.src ?? result.resultReference;
            const altText = result.resultReference?.alt ?? `${result.jewellery} preview`;
            const isProduct = result.sourceType === "product";
            const tryOnParam = isProduct
              ? `product=${result.sourceId}`
              : `design=${result.sourceId}`;
            const feedback = shareNote[saveId];
            const addedToBag = bagNote[saveId];

            return (
              <Card key={saveId} className="flex h-full flex-col">
                <Card.Media ratio="4/3">
                  <img
                    src={previewImg}
                    alt={altText}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </Card.Media>

                <Card.Body padding="sm" className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="brand" className="mb-2">
                        {isProduct ? "Catalogue Jewellery" : "AI Studio Design"}
                      </Badge>
                      <h3 className="font-serif text-h4 leading-snug text-text-primary">
                        {result.jewellery}
                      </h3>
                    </div>
                    <IconButton
                      label={`Remove ${result.jewellery} preview`}
                      size="sm"
                      variant="plain"
                      onClick={() => removeResult(saveId)}
                      className="text-text-muted hover:text-state-error shrink-0"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </IconButton>
                  </div>

                  <p className="mt-2 font-sans text-[11px] text-text-muted">
                    Photo source:{" "}
                    {result.photoReference?.origin === "sample"
                      ? "Studio Portrait Model"
                      : "Client Uploaded Photo"}
                  </p>

                  <p className="font-sans text-[11px] text-text-muted">
                    Captured on{" "}
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
                  {addedToBag && (
                    <p className="mt-2 text-caption text-state-success flex items-center gap-1">
                      <Check size={12} /> {addedToBag}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-auto space-y-2 pt-5 border-t border-border-default">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setActiveModalResult(entry)}
                      >
                        <Eye size={12} strokeWidth={1.5} aria-hidden="true" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        href={`/virtual-try-on?${tryOnParam}`}
                      >
                        <Camera size={12} strokeWidth={1.5} aria-hidden="true" />
                        Fitting Room
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      {isProduct && result.jewelleryDetails ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToBag(entry)}
                        >
                          <ShoppingBag size={12} strokeWidth={1.5} aria-hidden="true" />
                          Add to Bag
                        </Button>
                      ) : isProduct ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          href={`/product/${result.sourceId}`}
                        >
                          View Piece
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          href={`/ai-studio?concept=${result.sourceId}`}
                        >
                          Atelier Concept
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="px-3"
                        onClick={() => handleShare(entry)}
                        aria-label={`Share ${result.jewellery} preview`}
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

      {/* Preview Detail Modal */}
      {activeModalResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto bg-surface-primary p-6 sm:p-8 border border-border-default">
            <button
              type="button"
              onClick={() => setActiveModalResult(null)}
              className="absolute right-4 top-4 text-text-muted hover:text-text-primary"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>

            <div className="aspect-[3/4] w-full overflow-hidden border border-border-default bg-surface-secondary">
              <img
                src={
                  activeModalResult.result.resultReference?.src ??
                  activeModalResult.result.resultReference
                }
                alt={activeModalResult.result.jewellery}
                className="h-full w-full object-cover object-top"
              />
            </div>

            <div className="mt-6">
              <p className="font-sans text-label uppercase tracking-[0.28em] text-brand-accent-strong">
                {activeModalResult.result.sourceType === "product"
                  ? "Catalogue Jewellery"
                  : "AI Studio Concept"}
              </p>
              <h3 id="preview-modal-title" className="mt-1 font-serif text-h2 text-text-primary">
                {activeModalResult.result.jewellery}
              </h3>

              <div className="mt-6 flex flex-wrap gap-3 border-t border-border-default pt-6">
                <Button
                  href={`/virtual-try-on?${
                    activeModalResult.result.sourceType === "product"
                      ? `product=${activeModalResult.result.sourceId}`
                      : `design=${activeModalResult.result.sourceId}`
                  }`}
                >
                  <Camera size={13} aria-hidden="true" />
                  Reopen in Fitting Room
                </Button>
                {activeModalResult.result.sourceType === "product" && (
                  <Button
                    variant="outline"
                    href={`/product/${activeModalResult.result.sourceId}`}
                  >
                    View Product Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
