import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { X } from "lucide-react";
import BrandMark from "../ui/BrandMark.jsx";
import IconButton from "../ui/IconButton.jsx";
import { cn } from "../../utils/cn.js";

/**
 * CONSOLE SIDEBAR — one sidebar architecture for all three management
 * experiences, driven entirely by configuration.
 *
 *   BrandMark + experience label
 *   Navigation groups  →  items (icon, label, route, active state)
 *   Bottom utility area (storefront link)
 *
 * There is deliberately no AdminSidebar / SuperAdminSidebar / EmployeeSidebar:
 * the experiences differ in their navigation *data* (see
 * `src/layouts/console/config.js`), not in their structure. The same component
 * is the off-canvas drawer below `lg` and the fixed rail above it.
 */
function SidebarNavItem({ item, onNavigate }) {
  const Glyph = item.icon;

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 border-l-2 py-3 pl-5 pr-4 font-sans text-nav font-medium uppercase transition-colors duration-200",
            isActive
              ? "border-brand-primary bg-surface-muted/50 text-brand-primary"
              : "border-transparent text-text-primary/70 hover:border-brand-accent/45 hover:text-text-primary"
          )
        }
      >
        {Glyph ? <Glyph size={16} strokeWidth={1.5} aria-hidden="true" /> : null}
        {item.label}
      </NavLink>
    </li>
  );
}

SidebarNavItem.propTypes = {
  item: PropTypes.shape({
    label: PropTypes.string.isRequired,
    to: PropTypes.string.isRequired,
    end: PropTypes.bool,
    icon: PropTypes.elementType,
  }).isRequired,
  onNavigate: PropTypes.func,
};

export default function ConsoleSidebar({
  experience,
  homePath,
  navigation,
  open = false,
  onClose,
}) {
  return (
    <aside
      className={cn(
        /* Closed below `lg` the drawer is invisible rather than only off-screen:
           an off-screen panel keeps its links focusable, `invisible` removes
           them from the tab order and the accessibility tree. From `lg` it is
           always the fixed rail. */
        "fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-border-default bg-surface-primary transition-transform duration-200",
        open ? "translate-x-0 visible" : "-translate-x-full invisible lg:visible lg:translate-x-0"
      )}
    >
      <div className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-border-default px-gutter">
        <Link to={homePath} onClick={onClose} aria-label={`Swarnova ${experience} — home`}>
          <BrandMark compact />
        </Link>
        <IconButton label="Close navigation" size="touch" className="lg:hidden" onClick={onClose}>
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </IconButton>
      </div>

      <p className="shrink-0 px-gutter pt-6 font-sans text-label uppercase tracking-[0.32em] text-brand-accent-strong">
        {experience}
      </p>

      <nav
        aria-label={`${experience} navigation`}
        className="mt-4 flex-1 overflow-y-auto pb-6"
      >
        {navigation.map((group, index) => (
          <div key={group.label ?? index} className={cn(index > 0 && "mt-6")}>
            {group.label ? (
              <p className="px-gutter pb-2 font-sans text-label uppercase text-text-muted">
                {group.label}
              </p>
            ) : null}
            <ul>
              {group.items.map((item) => (
                <SidebarNavItem
                  key={item.to + item.label}
                  item={item}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-border-default px-gutter py-4">
        <Link
          to="/"
          className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary transition-colors duration-200 hover:text-brand-primary"
        >
          View Storefront
        </Link>
      </div>
    </aside>
  );
}

ConsoleSidebar.propTypes = {
  /** Experience label, e.g. "Admin" — used for the label and the nav landmark. */
  experience: PropTypes.string.isRequired,
  /** The console's own root route, used by the brand link. */
  homePath: PropTypes.string,
  /** Navigation groups: [{ label?, items: [{ label, to, end?, icon, capability? }] }]. */
  navigation: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      items: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          to: PropTypes.string.isRequired,
          end: PropTypes.bool,
          icon: PropTypes.elementType,
          capability: PropTypes.string,
        })
      ).isRequired,
    })
  ).isRequired,
  /** Drawer state below the `lg` breakpoint. */
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
