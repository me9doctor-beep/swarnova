import { useState } from "react";
import { Camera, Eye, Trash2, Share2, ShoppingBag, Check } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import IconButton from "../../../components/ui/IconButton.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { useSavedTryOns } from "../../../state/SavedTryOnsContext.jsx";
import { useAddProductToBag } from "../../../hooks/useAddProductToBag.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { cn } from "../../../utils/cn.js";

/* The two quiet confirmations the bag action can leave behind. */
const BAG_ADDED_NOTE = "Added to bag";
const BAG_UNAVAILABLE_NOTE = "This piece is no longer in the catalogue.";

/**
 * SAVED TRY-ONS — the customer's own fitting-room shelf.
 *
 * Each entry reopens the room it came from through the room's own arrival
 * contract (`?product=` for a catalogue piece, `?design=` for an atelier
 * concept), so a saved preview is a route back into the fitting room rather
 * than a second copy of it. Catalogue pieces can also join the bag — always
 * the canonical piece, re-resolved through the product contract, never the
 * snapshot the preview was dressed with. AI concepts keep their own route back
 * to the atelier and never become a bag line at all.
 */
export default function SavedTryOnsPage() {
  useDocumentTitle("Saved Try-Ons — Swarnova");

  const { savedResults, removeResult, count } = useSavedTryOns();
  const { addCanonical } = useAddProductToBag();
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

  /* The snapshot a saved fitting carries is a memory of the preview, not a
     commerce record — the bag line is always the canonical piece the catalogue
     offers today, re-resolved through the product contract. */
  const handleAddToBag = async (entry) => {
    const { added } = await addCanonical(entry.result?.sourceId);
    setBagNote((prev) => ({
      ...prev,
      [entry.saveId]: added ? BAG_ADDED_NOTE : BAG_UNAVAILABLE_NOTE,
    }));
    setTimeout(() => {
      setBagNote((prev) => {
        const next = { ...prev };
        delete next[entry.saveId];
        return next;
      });
    }, 3000);
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
                    <p
                      role={addedToBag === BAG_ADDED_NOTE ? "status" : "alert"}
                      className={cn(
                        "mt-2 text-caption",
                        addedToBag === BAG_ADDED_NOTE
                          ? "text-state-success"
                          : "text-state-warning"
                      )}
                    >
                      {addedToBag}
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
                      {isProduct ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToBag(entry)}
                        >
                          <ShoppingBag size={12} strokeWidth={1.5} aria-hidden="true" />
                          Add to Bag
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

      {/* The preview overlay is the shared Dialog primitive — the same
          escape / backdrop / focus behaviour the consoles get, and the panel
          owns its own scroll. */}
      <Dialog
        open={Boolean(activeModalResult)}
        onClose={() => setActiveModalResult(null)}
        title={
          activeModalResult?.result.sourceType === "product"
            ? "Catalogue Jewellery"
            : "AI Studio Concept"
        }
      >
        {activeModalResult ? (
          <div className="space-y-6">
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

            <h3 className="font-serif text-h2 text-text-primary">
              {activeModalResult.result.jewellery}
            </h3>

            <div className="flex flex-wrap gap-3 border-t border-border-default pt-6">
              <Button
                href={`/virtual-try-on?${
                  activeModalResult.result.sourceType === "product"
                    ? `product=${activeModalResult.result.sourceId}`
                    : `design=${activeModalResult.result.sourceId}`
                }`}
              >
                <Camera size={13} strokeWidth={1.5} aria-hidden="true" />
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
        ) : null}
      </Dialog>
    </div>
  );
}
