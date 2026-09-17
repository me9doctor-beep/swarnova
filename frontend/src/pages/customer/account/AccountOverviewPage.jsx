import { Link } from "react-router-dom";
import {
  Heart,
  Sparkles,
  Camera,
  ShoppingBag,
  MapPin,
  User,
  ArrowRight,
  Package,
} from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Card from "../../../components/ui/Card.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Price from "../../../components/ui/Price.jsx";
import ProductCard from "../../../components/cards/ProductCard.jsx";
import { useCustomerProfile } from "../../../hooks/useCustomerProfile.js";
import { useWishlist } from "../../../state/WishlistContext.jsx";
import { useSavedDesigns } from "../../../state/SavedDesignsContext.jsx";
import { useSavedTryOns } from "../../../state/SavedTryOnsContext.jsx";
import { useOrders } from "../../../hooks/useOrders.js";
import { useProducts } from "../../../hooks/useProducts.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

const STATUS_BADGE_VARIANTS = {
  Delivered: "success",
  Shipped: "info",
  Processing: "brand",
  Confirmed: "neutral",
  Cancelled: "error",
};

export default function AccountOverviewPage() {
  useDocumentTitle("My Swarnova — Account Overview");

  const { profile } = useCustomerProfile();
  const { ids, count: wishlistCount } = useWishlist();
  const { count: designsCount } = useSavedDesigns();
  const { count: tryOnsCount } = useSavedTryOns();
  const { orders } = useOrders();
  const { data: allProducts } = useProducts();

  const customerName = profile?.name ?? "Client";
  const recentOrder = orders?.[0];

  /* Resolve recent wishlist products */
  const wishedProducts = (allProducts ?? []).filter((p) => ids.has(p.id)).slice(0, 3);

  const tiles = [
    {
      to: "/account/wishlist",
      title: "Wishlist",
      description: `${wishlistCount} saved piece${wishlistCount === 1 ? "" : "s"}`,
      Icon: Heart,
    },
    {
      to: "/account/saved-designs",
      title: "AI Designs",
      description: `${designsCount} concept${designsCount === 1 ? "" : "s"} generated`,
      Icon: Sparkles,
    },
    {
      to: "/account/saved-try-ons",
      title: "Fitting Room",
      description: `${tryOnsCount} try-on preview${tryOnsCount === 1 ? "" : "s"}`,
      Icon: Camera,
    },
    {
      to: "/account/orders",
      title: "Orders",
      description: `${orders.length} past acquisition${orders.length === 1 ? "" : "s"}`,
      Icon: ShoppingBag,
    },
    {
      to: "/account/addresses",
      title: "Addresses",
      description: "Manage delivery destinations",
      Icon: MapPin,
    },
    {
      to: "/account/profile",
      title: "Profile",
      description: "Preferences & measurements",
      Icon: User,
    },
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Message */}
      <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-h2 font-medium text-text-primary">
              Welcome, {customerName}
            </h2>
            <p className="mt-2 font-serif text-body leading-relaxed text-text-secondary">
              Your personal jewellery salon brings together your curated wishlist,
              bespoke AI atelier concepts, and virtual try-on previews in one sanctuary.
            </p>
          </div>
          <Button href="/collections" variant="outline" size="sm" className="shrink-0 self-start md:self-center">
            Explore Collections
          </Button>
        </div>
      </div>

      {/* Quick Navigation Tiles */}
      <div>
        <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
          Personal Collections
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {tiles.map(({ to, title, description, Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col justify-between border border-border-default bg-surface-primary p-5 transition-colors duration-200 hover:border-brand-accent/50"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-surface-secondary text-brand-accent-strong">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <ArrowRight
                  size={14}
                  className="text-text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-primary"
                  aria-hidden="true"
                />
              </div>
              <div className="mt-6">
                <p className="font-serif text-h4 leading-tight text-text-primary group-hover:text-brand-primary">
                  {title}
                </p>
                <p className="mt-1 font-sans text-caption text-text-muted">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex items-baseline justify-between border-b border-border-default pb-3">
          <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
            Recent Orders
          </h3>
          <Link
            to="/account/orders"
            className="font-sans text-caption font-medium uppercase tracking-[0.2em] text-brand-primary hover:text-brand-accent-strong"
          >
            All Orders ({orders.length}) →
          </Link>
        </div>

        <div className="mt-4">
          {recentOrder ? (
            <div className="border border-border-default bg-surface-primary p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-default pb-4">
                <div>
                  <p className="font-sans text-label uppercase tracking-[0.18em] text-text-muted">
                    Order {recentOrder.orderNumber}
                  </p>
                  <p className="mt-0.5 font-sans text-caption text-text-secondary">
                    Placed on{" "}
                    {new Date(recentOrder.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_BADGE_VARIANTS[recentOrder.status] ?? "neutral"} dot>
                    {recentOrder.status}
                  </Badge>
                  <Price amount={recentOrder.total} className="font-serif text-h4 font-medium" />
                </div>
              </div>

              {/* Items row */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {recentOrder.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden border border-border-default bg-surface-secondary">
                        <img
                          src={item.image.src}
                          alt={item.image.alt}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="hidden sm:block">
                        <p className="font-serif text-body-sm text-text-primary">
                          {item.name}
                        </p>
                        <p className="font-sans text-caption text-text-muted">
                          Qty: {item.quantity} · {item.purity} Gold
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentOrder.items.length > 3 && (
                    <span className="font-sans text-caption text-text-muted">
                      +{recentOrder.items.length - 3} more
                    </span>
                  )}
                </div>

                <Button href={`/account/orders/${recentOrder.id}`} variant="outline" size="sm">
                  View Order Details
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border-default bg-surface-primary p-8 text-center">
              <Package size={24} className="mx-auto text-text-muted" aria-hidden="true" />
              <p className="mt-3 font-serif text-h4 text-text-primary">No orders yet</p>
              <p className="mt-1 font-sans text-body-sm text-text-muted">
                Your acquisitions and bespoke commissions will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recently Saved Jewellery (Wishlist) */}
      <div>
        <div className="flex items-baseline justify-between border-b border-border-default pb-3">
          <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
            Recently Saved Jewellery
          </h3>
          <Link
            to="/account/wishlist"
            className="font-sans text-caption font-medium uppercase tracking-[0.2em] text-brand-primary hover:text-brand-accent-strong"
          >
            View Wishlist ({wishlistCount}) →
          </Link>
        </div>

        <div className="mt-6">
          {wishedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {wishedProducts.map((product) => (
                <ProductCard key={product.id} product={product} showTryOn />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border-default bg-surface-primary p-8 text-center">
              <Heart size={24} className="mx-auto text-text-muted" aria-hidden="true" />
              <p className="mt-3 font-serif text-h4 text-text-primary">Your wishlist is empty</p>
              <p className="mt-1 font-sans text-body-sm text-text-muted">
                Save jewellery pieces as you browse the catalogue to curate your personal collection.
              </p>
              <Button href="/products" variant="outline" size="sm" className="mt-5">
                Browse Jewellery
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Interactive AI Atelier & Virtual Try-On Showcase Banner */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="border border-border-default bg-surface-primary p-6">
          <Sparkles size={20} className="text-brand-accent-strong" aria-hidden="true" />
          <h4 className="mt-3 font-serif text-h3 text-text-primary">AI Jewellery Studio</h4>
          <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">
            Co-create bespoke jewellery concepts using natural language and artistic directions in our AI Atelier.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Button href="/ai-studio" size="sm">
              Enter Studio
            </Button>
            <Link
              to="/account/saved-designs"
              className="font-sans text-caption uppercase tracking-[0.2em] text-text-muted hover:text-brand-primary"
            >
              Saved Concepts ({designsCount})
            </Link>
          </div>
        </div>

        <div className="border border-border-default bg-surface-primary p-6">
          <Camera size={20} className="text-brand-accent-strong" aria-hidden="true" />
          <h4 className="mt-3 font-serif text-h3 text-text-primary">Virtual Try-On</h4>
          <p className="mt-2 text-body-sm text-text-secondary leading-relaxed">
            Preview catalogue pieces and AI concepts draped naturally on your own photograph or curated portraits.
          </p>
          <div className="mt-5 flex items-center gap-4">
            <Button href="/virtual-try-on" variant="outline" size="sm">
              Try It On
            </Button>
            <Link
              to="/account/saved-try-ons"
              className="font-sans text-caption uppercase tracking-[0.2em] text-text-muted hover:text-brand-primary"
            >
              Saved Previews ({tryOnsCount})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
