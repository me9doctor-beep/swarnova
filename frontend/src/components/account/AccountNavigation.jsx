import { intakePaths } from "../../utils/links.js";
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Sparkles,
  Camera,
} from "lucide-react";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { useSavedDesigns } from "../../state/SavedDesignsContext.jsx";
import { useSavedTryOns } from "../../state/SavedTryOnsContext.jsx";
import { useOrders } from "../../hooks/useOrders.js";
import { cn } from "../../utils/cn.js";

/**
 * REUSABLE CUSTOMER ACCOUNT NAVIGATION
 *
 * Compact, quiet, editorial navigation designed specifically for the customer
 * salon experience. Avoids admin rails or heavy cards.
 *
 * Desktop: refined vertical list with subtle gold accents and counter pills.
 * Mobile: horizontally scrollable pill strip with thumb-friendly targets.
 */
export default function AccountNavigation({ className }) {
  const { count: wishlistCount } = useWishlist();
  const { count: designsCount } = useSavedDesigns();
  const { count: tryOnsCount } = useSavedTryOns();
  const { orders } = useOrders();

  const links = [
    {
      to: "/account",
      label: "Overview",
      end: true,
      Icon: LayoutDashboard,
    },
    {
      to: "/account/profile",
      label: "Profile",
      Icon: User,
    },
    {
      to: "/account/orders",
      label: "Orders",
      Icon: ShoppingBag,
      count: orders.length,
    },
    ...Object.values(intakePaths).map((path) => ({ to: path.account, label: path.title, Icon: ShoppingBag })),
    {
      to: "/account/addresses",
      label: "Addresses",
      Icon: MapPin,
    },
    {
      to: "/account/wishlist",
      label: "Wishlist",
      Icon: Heart,
      count: wishlistCount,
    },
    {
      to: "/account/saved-designs",
      label: "Saved Designs",
      Icon: Sparkles,
      count: designsCount,
    },
    {
      to: "/account/saved-try-ons",
      label: "Saved Try-Ons",
      Icon: Camera,
      count: tryOnsCount,
    },
  ];

  return (
    <nav aria-label="Account navigation" className={cn("w-full", className)}>
      {/* Mobile: Horizontal scrollable navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none lg:hidden">
        {links.map(({ to, label, end, Icon, count }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "inline-flex shrink-0 items-center gap-2 border px-3.5 py-2 font-sans text-label uppercase tracking-[0.2em] transition-colors duration-200",
                isActive
                  ? "border-brand-primary bg-brand-primary text-text-inverse"
                  : "border-border-default bg-surface-primary text-text-secondary hover:border-brand-accent/45 hover:text-text-primary"
              )
            }
          >
            <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{label}</span>
            {typeof count === "number" && count > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand-accent px-1 text-[9px] font-medium text-text-inverse">
                {count}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      {/* Desktop: Refined vertical side navigation */}
      <ul className="hidden space-y-1.5 lg:block">
        {links.map(({ to, label, end, Icon, count }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "group flex items-center justify-between border-l-2 px-3 py-2.5 font-sans text-nav font-medium uppercase tracking-[0.22em] transition-colors duration-200",
                  isActive
                    ? "border-brand-primary bg-surface-muted/60 text-brand-primary font-semibold"
                    : "border-transparent text-text-secondary hover:border-brand-accent/50 hover:bg-surface-primary hover:text-text-primary"
                )
              }
            >
              <span className="flex items-center gap-3">
                <Icon
                  size={16}
                  strokeWidth={1.5}
                  className="transition-colors duration-200 group-hover:text-brand-accent-strong"
                  aria-hidden="true"
                />
                <span>{label}</span>
              </span>

              {typeof count === "number" && count > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-pill bg-surface-secondary px-1.5 text-[10px] font-medium text-text-secondary border border-border-default">
                  {count}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

AccountNavigation.propTypes = {
  className: PropTypes.string,
};
