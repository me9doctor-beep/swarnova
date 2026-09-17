import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Container from "../../../components/ui/Container.jsx";
import Eyebrow from "../../../components/ui/Eyebrow.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import Price from "../../../components/ui/Price.jsx";
import IconButton from "../../../components/ui/IconButton.jsx";
import { useCart } from "../../../state/CartContext.jsx";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

export default function CartPage() {
  useDocumentTitle("Shopping Bag — Swarnova");

  const {
    items,
    increment,
    decrement,
    remove,
    clear,
    count,
    subtotal,
  } = useCart();

  const [checkoutNotice, setCheckoutNotice] = useState(false);

  const handleCheckoutClick = () => {
    setCheckoutNotice(true);
    setTimeout(() => {
      setCheckoutNotice(false);
    }, 6000);
  };

  return (
    <div className="bg-surface-secondary/30 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
      <Container>
        {/* Masthead */}
        <div className="border-b border-border-default pb-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Eyebrow tone="gold" className="tracking-[0.3em]">
                  SWARNOVA by MediXO
                </Eyebrow>
                <span className="text-border-default">·</span>
                <span className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
                  Client Bag
                </span>
              </div>
              <h1 className="mt-2 font-serif text-h2 font-medium text-text-primary sm:text-h1">
                Shopping Bag
              </h1>
            </div>

            {count > 0 && (
              <p className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
                {count} {count === 1 ? "Piece" : "Pieces"} in Bag
              </p>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="Your bag is waiting."
              action={<Button href="/products">Explore Jewellery</Button>}
              className="py-20 text-center"
            >
              Discover jewellery crafted for your next moment. Pieces added to your shopping bag
              will appear here ready for checkout.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-10 grid items-start gap-12 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px]">
            {/* Bag line items list */}
            <div className="space-y-6">
              <div className="border border-border-default bg-surface-primary">
                {/* Table Header (desktop) */}
                <div className="hidden grid-cols-12 border-b border-border-default px-6 py-3.5 font-sans text-label uppercase tracking-[0.2em] text-text-muted sm:grid">
                  <div className="col-span-6">Jewellery Piece</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Unit Price</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items */}
                <div className="divide-y divide-border-default">
                  {items.map((item) => {
                    const product = item.product;
                    const image = product.images?.[0];
                    const lineTotal = product.price * item.quantity;

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-12 sm:items-center sm:gap-4"
                      >
                        {/* Piece Info */}
                        <div className="col-span-6 flex items-center gap-4">
                          <Link
                            to={product.href ?? `/product/${product.id}`}
                            className="h-20 w-20 shrink-0 overflow-hidden border border-border-default bg-surface-secondary"
                          >
                            <img
                              src={image?.src}
                              alt={image?.alt ?? product.name}
                              className="h-full w-full object-cover"
                            />
                          </Link>

                          <div className="min-w-0">
                            <p className="font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-brand-accent-strong">
                              {product.purity} Gold
                            </p>
                            <h3 className="mt-0.5 truncate font-serif text-h4 font-medium text-text-primary">
                              <Link
                                to={product.href ?? `/product/${product.id}`}
                                className="hover:text-brand-primary"
                              >
                                {product.name}
                              </Link>
                            </h3>
                            {product.sku && (
                              <p className="mt-0.5 font-sans text-caption text-text-muted">
                                SKU: {product.sku}
                              </p>
                            )}

                            {/* Mobile line total */}
                            <div className="mt-2 flex items-center gap-3 sm:hidden">
                              <Price amount={lineTotal} className="font-serif text-body font-medium" />
                            </div>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="col-span-2 flex items-center sm:justify-center">
                          <div className="flex items-center border border-border-default bg-surface-secondary">
                            <button
                              type="button"
                              onClick={() => decrement(item.id)}
                              aria-label={`Decrease quantity of ${product.name}`}
                              className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-brand-primary disabled:opacity-40"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="flex h-8 w-8 items-center justify-center font-sans text-body-sm font-medium text-text-primary">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => increment(item.id)}
                              aria-label={`Increase quantity of ${product.name}`}
                              className="flex h-8 w-8 items-center justify-center text-text-secondary hover:text-brand-primary"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <IconButton
                            label={`Remove ${product.name} from bag`}
                            size="sm"
                            variant="plain"
                            onClick={() => remove(item.id)}
                            className="ml-2 text-text-muted hover:text-state-error sm:hidden"
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </div>

                        {/* Unit Price (Desktop) */}
                        <div className="col-span-2 hidden text-right sm:block">
                          <Price amount={product.price} className="font-sans text-body-sm text-text-secondary" />
                        </div>

                        {/* Line Total & Remove (Desktop) */}
                        <div className="col-span-2 hidden items-center justify-end gap-3 sm:flex">
                          <Price amount={lineTotal} className="font-serif text-h4 font-medium" />
                          <IconButton
                            label={`Remove ${product.name} from bag`}
                            size="sm"
                            variant="plain"
                            onClick={() => remove(item.id)}
                            className="text-text-muted hover:text-state-error"
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/products"
                  className="font-sans text-caption font-medium uppercase tracking-[0.2em] text-brand-primary hover:text-brand-accent-strong"
                >
                  ← Continue Exploring Jewellery
                </Link>

                <button
                  type="button"
                  onClick={clear}
                  className="font-sans text-caption uppercase tracking-[0.2em] text-text-muted hover:text-state-error"
                >
                  Clear Bag
                </button>
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="space-y-6">
              <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary pb-4 border-b border-border-default">
                  Order Summary
                </h2>

                <div className="mt-5 space-y-3.5 font-sans text-body-sm">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal ({count} {count === 1 ? "piece" : "pieces"})</span>
                    <Price amount={subtotal} />
                  </div>

                  <div className="flex justify-between text-text-secondary">
                    <span>Insured Courier Shipping</span>
                    <span className="font-medium text-state-success">Complimentary</span>
                  </div>

                  <div className="flex justify-between text-text-secondary">
                    <span>GST (3% Indian Jewellery Tax)</span>
                    <span className="text-text-muted">Included</span>
                  </div>

                  <div className="flex justify-between border-t border-border-default pt-4 font-serif text-h3 text-text-primary">
                    <span>Estimated Total</span>
                    <Price amount={subtotal} />
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    className="w-full justify-center"
                    size="md"
                    onClick={handleCheckoutClick}
                  >
                    Proceed to Checkout
                  </Button>
                </div>

                {checkoutNotice && (
                  <div
                    role="status"
                    className="mt-4 border border-brand-accent/40 bg-surface-muted p-4 text-caption text-text-primary leading-relaxed"
                  >
                    <p className="font-semibold uppercase tracking-[0.16em] text-brand-accent-strong flex items-center gap-1.5">
                      <Sparkles size={13} /> Demonstration Commerce Environment
                    </p>
                    <p className="mt-1 text-text-secondary">
                      Full payment gateways, Razorpay/Stripe, and automated consignment generation
                      arrive in subsequent phases. Your shopping bag remains active for this visit.
                    </p>
                  </div>
                )}

                {/* Trust Points */}
                <div className="mt-8 border-t border-border-default pt-6 space-y-3.5 text-caption text-text-secondary">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={16} className="text-brand-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                    <span>BIS Hallmarked 22K certified authenticity with lab certificate.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck size={16} className="text-brand-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                    <span>Complimentary, insured, armoured courier delivery across India.</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw size={16} className="text-brand-accent-strong shrink-0 mt-0.5" aria-hidden="true" />
                    <span>30-day effortless exchange and lifetime valuation guarantees.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
