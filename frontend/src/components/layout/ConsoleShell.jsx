import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import BrandMark from "../ui/BrandMark.jsx";
import { cn } from "../../utils/cn.js";

/**
 * CONSOLE SHELL — the shared structural shell for the three management
 * experiences (Super Admin, Admin, Employee).
 *
 *   ConsoleShell
 *   ├── Sidebar   (brand, experience, navigation)
 *   ├── Topbar    (navigation trigger, experience title, session meta)
 *   └── Main      (the route's page content)
 *
 * Each experience owns its own layout (its own navigation, permissions and
 * information density) and stays deliberately separate, but they all render
 * through this one shell so the enterprise chrome and design tokens are shared.
 * Design direction: premium enterprise — calm surfaces, champagne rules, wine
 * accents, no storefront atmosphere.
 */
function ConsoleNavItem({ item, onNavigate }) {
  const Glyph = item.icon;

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 border-l-2 py-3 pl-5 pr-4 font-sans text-[11px] font-medium uppercase tracking-[0.18em] transition-colors duration-200",
            isActive
              ? "border-wine bg-cream/50 text-wine"
              : "border-transparent text-ink/70 hover:border-gold/45 hover:text-ink"
          )
        }
      >
        {Glyph ? <Glyph size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
        {item.label}
      </NavLink>
    </li>
  );
}

ConsoleNavItem.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    end: PropTypes.bool,
    icon: PropTypes.elementType,
  }).isRequired,
  onNavigate: PropTypes.func,
};

export default function ConsoleShell({
  experience,
  navLabel,
  items,
  homePath = "/",
  meta = [],
  children,
}) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const closeNav = () => setNavOpen(false);

  return (
    <div className="min-h-screen bg-ivory">
      {navOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeNav}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-paper transition-transform duration-200 lg:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-line px-5">
          <Link
            to={homePath}
            onClick={closeNav}
            aria-label={`Swarnova ${experience} — home`}
          >
            <BrandMark compact />
          </Link>
          <button
            type="button"
            onClick={closeNav}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center text-ink/70 transition-colors duration-200 hover:text-wine lg:hidden"
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <p className="shrink-0 px-5 pt-6 font-sans text-[10px] font-medium uppercase tracking-[0.32em] text-gold-deep">
          {experience}
        </p>

        <nav aria-label={navLabel} className="mt-4 flex-1 overflow-y-auto pb-6">
          <ul>
            {items.map((item) => (
              <ConsoleNavItem
                key={item.to + item.label}
                item={item}
                onNavigate={closeNav}
              />
            ))}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line px-5 py-4">
          <Link
            to="/"
            className="font-sans text-[10px] font-medium uppercase tracking-[0.24em] text-ash transition-colors duration-200 hover:text-wine"
          >
            View Storefront
          </Link>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
          <div className="flex min-h-[72px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 lg:px-8">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Open navigation"
              className="flex h-10 w-10 items-center justify-center text-ink/80 transition-colors duration-200 hover:text-wine lg:hidden"
            >
              <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>

            <p className="font-serif text-[20px] leading-none text-ink">
              {experience}
            </p>

            {meta.length > 0 && (
              <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 lg:ml-auto">
                {meta.map((entry) => (
                  <div key={entry.label} className="flex items-center gap-2">
                    <dt className="font-sans text-[9px] font-medium uppercase tracking-[0.22em] text-mist">
                      {entry.label}
                    </dt>
                    <dd className="font-sans text-[11px] font-medium uppercase tracking-[0.16em] text-ink/80">
                      {entry.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </header>

        <main className="px-5 py-8 lg:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

ConsoleShell.propTypes = {
  experience: PropTypes.string.isRequired,
  navLabel: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      end: PropTypes.bool,
      icon: PropTypes.elementType,
    })
  ).isRequired,
  /** The console's own root route, used by the sidebar brand link. */
  homePath: PropTypes.string,
  meta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node,
    })
  ),
  children: PropTypes.node,
};
