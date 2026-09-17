import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import ProductGrid from "../../../components/catalogue/ProductGrid.jsx";
import { useWishlist } from "../../../state/WishlistContext.jsx";
import { useProducts } from "../../../hooks/useProducts.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

export default function WishlistPage() {
  useDocumentTitle("My Wishlist — Swarnova");

  const { ids, count, has } = useWishlist();
  const { data: allProducts, status, error, retry } = useProducts();

  const wishedProducts = (allProducts ?? []).filter((product) => has(product.id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-border-default pb-5">
        <div>
          <h2 className="font-serif text-h2 font-medium text-text-primary">My Wishlist</h2>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Curated catalogue pieces saved for your consideration.
          </p>
        </div>
        {count > 0 && (
          <p className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
            {count} {count === 1 ? "Piece" : "Pieces"} Saved
          </p>
        )}
      </div>

      {status !== "success" ? (
        <AsyncBoundary
          status={status}
          error={error}
          onRetry={retry}
          className="min-h-[300px]"
        />
      ) : wishedProducts.length === 0 ? (
        <EmptyState
          title="Your collection is waiting."
          action={<Button href="/products">Continue Shopping</Button>}
          className="py-16 text-center"
        >
          Discover jewellery crafted for your next moment. Save pieces you love while browsing our collections.
        </EmptyState>
      ) : (
        <div>
          <ProductGrid products={wishedProducts} showTryOn={true} />
        </div>
      )}
    </div>
  );
}
