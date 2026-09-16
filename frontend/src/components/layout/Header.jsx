import { useEffect, useState } from "react";
import { Search, Heart, User, ShoppingBag, Menu, X } from "lucide-react";
import BrandMark from "../ui/BrandMark.jsx";
import Button from "../ui/Button.jsx";
import { useSite } from "../../hooks/useSite.js";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { cn } from "../../utils/cn.js";

function HeaderAction({ label, children, href, onClick, badge, transparent }) {
  const classes = cn(
    "relative flex h-10 w-10 items-center justify-center transition-colors duration-200",
    transparent
      ? "text-white/90 hover:text-white"
      : "text-ink/75 hover:text-wine"
  );
  const content = (
    <>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[9px] font-medium text-cream">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a href={href} aria-label={label} className={classes}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

function MobileMenu({ open, onClose, navigation }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Primary menu"
      className="fixed inset-0 z-[70] flex flex-col overscroll-contain bg-paper"
    >
      <div className="shell flex h-[72px] shrink-0 items-center justify-between">
        <BrandMark />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-10 w-10 items-center justify-center text-ink hover:text-wine"
        >
          <X size={22} strokeWidth={1.4} />
        </button>
      </div>

      {/* Navigation scrolls inside the panel so every destination stays
          reachable on a short phone; two-up keeps the list compact. */}
      <nav
        className="shell flex-1 overflow-y-auto pb-10 pt-2"
        aria-label="Mobile primary"
      >
        <ul className="grid grid-cols-2 gap-x-4 border-t border-line">
          {navigation.map((item) => (
            <li key={item.href + item.label} className="border-b border-line">
              <a
                href={item.href}
                onClick={onClose}
                className="flex min-h-[52px] items-center py-3 font-serif text-[19px] leading-tight text-ink transition-colors duration-200 hover:text-wine"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <Button href="#collections" className="w-full" onClick={onClose}>
            Explore Collections
          </Button>
          <Button
            href="#ai-studio"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Create with AI
          </Button>
        </div>

        <div className="mt-8 flex items-center gap-2 border-t border-line pt-6 text-ink/70">
          <HeaderAction label="Search" href="#search">
            <Search size={19} strokeWidth={1.5} />
          </HeaderAction>
          <HeaderAction label="Wishlist" href="#wishlist">
            <Heart size={19} strokeWidth={1.5} />
          </HeaderAction>
          <HeaderAction label="Account" href="#account">
            <User size={19} strokeWidth={1.5} />
          </HeaderAction>
          <HeaderAction label="Shopping bag" href="#cart">
            <ShoppingBag size={19} strokeWidth={1.5} />
          </HeaderAction>
        </div>
      </nav>
    </div>
  );
}

export default function Header() {
  const { data: site } = useSite();
  const { count } = useWishlist();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!site) return null;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {site.announcement?.enabled && (
          <div className="bg-wine-deep text-cream/85">
            <div className="shell flex h-9 items-center justify-center">
              <p className="truncate text-center text-[9px] font-light uppercase tracking-[0.22em] sm:text-[10px]">
                {site.announcement.message}
              </p>
            </div>
          </div>
        )}

        <div
          className={cn(
            "border-b transition-colors duration-200",
            scrolled
              ? "border-line bg-paper/95 backdrop-blur-sm"
              : "border-transparent bg-transparent"
          )}
        >
          <div className="shell flex h-[72px] items-center justify-between gap-6">
            <a href="#top" aria-label="Swarnova — home" className="shrink-0">
              <BrandMark tone={scrolled ? "dark" : "light"} />
            </a>

            <nav aria-label="Primary" className="hidden xl:block">
              <ul className="flex items-center gap-7 2xl:gap-9">
                {site.navigation.map((item) => (
                  <li key={item.href + item.label}>
                    <a
                      href={item.href}
                      className={cn(
                        "whitespace-nowrap font-sans text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-200",
                        scrolled
                          ? "text-ink/80 hover:text-gold-deep"
                          : "text-white/90 hover:text-white"
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center">
              <span className="hidden items-center sm:flex">
                <HeaderAction label="Search" href="#search" transparent={!scrolled}>
                  <Search size={18} strokeWidth={1.5} />
                </HeaderAction>
                <HeaderAction label="Wishlist" href="#wishlist" badge={count || undefined} transparent={!scrolled}>
                  <Heart size={18} strokeWidth={1.5} />
                </HeaderAction>
                <HeaderAction label="Account" href="#account" transparent={!scrolled}>
                  <User size={18} strokeWidth={1.5} />
                </HeaderAction>
                <HeaderAction label="Shopping bag" href="#cart" transparent={!scrolled}>
                  <ShoppingBag size={18} strokeWidth={1.5} />
                </HeaderAction>
              </span>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-10 items-center justify-center xl:hidden",
                  !scrolled ? "text-white" : "text-ink"
                )}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={22} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={site.navigation}
      />
    </>
  );
}
