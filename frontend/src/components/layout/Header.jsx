import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, Heart, User, ShoppingBag, Menu, X } from "lucide-react";
import BrandMark from "../ui/BrandMark.jsx";
import Button from "../ui/Button.jsx";
import Container from "../ui/Container.jsx";
import IconButton from "../ui/IconButton.jsx";
import ContentLink from "../ui/ContentLink.jsx";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { useSite } from "../../hooks/useSite.js";
import { useWishlist } from "../../state/WishlistContext.jsx";
import { useCart } from "../../state/CartContext.jsx";
import { cn } from "../../utils/cn.js";

const HEADER_ACTIONS = [
  { label: "Search", href: "/products", Glyph: Search, size: 18 },
  { label: "Wishlist", href: "/account/wishlist", Glyph: Heart, size: 18 },
  { label: "Account", href: "/account", Glyph: User, size: 18 },
  { label: "Shopping bag", href: "/cart", Glyph: ShoppingBag, size: 18 },
];

function MobileMenu({ open, onClose, navigation, badges = {} }) {
  useBodyScrollLock(open);

  /* A dialog closes on Escape. Registered above the early return so the hook
     order never depends on the open state. */
  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Primary menu"
      className="fixed inset-0 z-[70] flex flex-col overscroll-contain bg-surface-primary"
    >
      <Container className="flex h-[72px] shrink-0 items-center justify-between">
        <BrandMark />
        <IconButton
          label="Close menu"
          size="touch"
          className="text-text-primary"
          onClick={onClose}
        >
          <X size={22} strokeWidth={1.4} />
        </IconButton>
      </Container>

      {/* Navigation scrolls inside the panel so every destination stays
          reachable on a short phone; two-up keeps the list compact. */}
      <Container
        as="nav"
        aria-label="Mobile primary"
        className="flex-1 overflow-y-auto pb-10 pt-2"
      >
        <ul className="grid grid-cols-2 gap-x-4 border-t border-border-default">
          {navigation.map((item) => (
            <li key={item.href + item.label} className="border-b border-border-default">
              <ContentLink
                href={item.href}
                onClick={onClose}
                className="flex min-h-[52px] items-center py-3 font-serif text-h4 leading-tight text-text-primary transition-colors duration-200 hover:text-brand-primary"
              >
                {item.label}
              </ContentLink>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-3">
          <Button href="/#collections" className="w-full" onClick={onClose}>
            Explore Collections
          </Button>
          <Button
            href="/ai-studio"
            variant="outline"
            className="w-full"
            onClick={onClose}
          >
            Create with AI
          </Button>
        </div>

        <div className="mt-8 flex items-center gap-2 border-t border-border-default pt-6 text-text-primary/70">
          {HEADER_ACTIONS.map(({ label, href, Glyph }) => (
            <IconButton
              key={label}
              label={label}
              href={href}
              badge={badges[label] || undefined}
              size="touch"
              onClick={onClose}
            >
              <Glyph size={19} strokeWidth={1.5} />
            </IconButton>
          ))}
        </div>
      </Container>
    </div>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { data: site } = useSite();
  const { count: wishlistCount } = useWishlist();
  const { count: bagCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!site) return null;

  /* The two client-side customer states surface their counts on the icons
     that already own them — the IconButton badge slot, no new chrome. */
  const badges = { Wishlist: wishlistCount, "Shopping bag": bagCount };

  /* The transparent, light-tinted chrome is designed to sit over the hero
     photograph — the only customer route with a dark backdrop. Every other
     storefront page has a light background, so it keeps the solid chrome from
     the first pixel (the homepage keeps its exact scroll behaviour). */
  const solid = pathname === "/" ? scrolled : true;
  const actionVariant = solid ? "plain" : "inverse";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        {site.announcement?.enabled && (
          <div className="bg-surface-inverse-deep text-text-inverse/85">
            {/* On phones the message was cut mid-word by `truncate`. The data
                layer's shorter variant now wraps to at most two tighter-set
                lines (≤42px tall, so the fixed header never exceeds the 112px
                section scroll margin). From `sm` up the full message and the
                original single-line truncation are unchanged. */}
            <Container className="flex items-center justify-center py-1 sm:h-9 sm:py-0">
              <p className="line-clamp-2 text-center text-label font-light uppercase leading-[1.45] tracking-[0.1em] sm:hidden">
                {site.announcement.shortMessage ?? site.announcement.message}
              </p>
              <p className="hidden text-center text-label font-light uppercase tracking-[0.22em] sm:block sm:truncate">
                {site.announcement.message}
              </p>
            </Container>
          </div>
        )}

        <div
          className={cn(
            "border-b transition-colors duration-200",
            solid
              ? "border-border-default bg-surface-primary/95 backdrop-blur-sm"
              : "border-transparent bg-transparent"
          )}
        >
          <Container className="flex h-[72px] items-center justify-between gap-6">
            <ContentLink href="/#top" aria-label="Swarnova — home" className="shrink-0">
              <BrandMark tone={solid ? "dark" : "light"} />
            </ContentLink>

            <nav aria-label="Primary" className="hidden xl:block">
              {/* gap-5 rather than gap-7 at the 1280–1535 breakpoint: the eight
                  links plus the four header actions overflowed the row by 18px
                  at exactly 1280px, clipping the shopping-bag icon. */}
              <ul className="flex items-center gap-5 2xl:gap-9">
                {site.navigation.map((item) => (
                  <li key={item.href + item.label}>
                    <ContentLink
                      href={item.href}
                      className={cn(
                        "whitespace-nowrap font-sans text-nav font-medium uppercase transition-colors duration-200",
                        solid
                          ? "text-text-primary/80 hover:text-brand-accent-strong"
                          : "text-white/90 hover:text-white"
                      )}
                    >
                      {item.label}
                    </ContentLink>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex shrink-0 items-center">
              <span className="hidden items-center sm:flex">
                {HEADER_ACTIONS.map(({ label, href, Glyph }) => (
                  <IconButton
                    key={label}
                    label={label}
                    href={href}
                    variant={actionVariant}
                    badge={badges[label] || undefined}
                    size="touch"
                  >
                    <Glyph size={18} strokeWidth={1.5} />
                  </IconButton>
                ))}
              </span>
              {/* Solid ink/white rather than the icon actions' 75–90% tone: the
                  trigger sits alone against the hero and reads as chrome. */}
              <IconButton
                label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                size="touch"
                className={cn(
                  "xl:hidden",
                  /* `plain` supplies the shape; the hover tone is neutralised
                     here because the trigger sits alone on the hero photograph
                     and reads as chrome, not as content. */
                  solid
                    ? "text-text-primary hover:text-text-primary"
                    : "text-white hover:text-white"
                )}
              >
                <Menu size={22} strokeWidth={1.4} />
              </IconButton>
            </div>
          </Container>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        navigation={site.navigation}
        badges={badges}
      />
    </>
  );
}
