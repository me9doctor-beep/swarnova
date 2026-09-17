import { useRef } from "react";
import PropTypes from "prop-types";
import { Link, useMatches } from "react-router-dom";
import { ChevronDown, Menu } from "lucide-react";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import IconButton from "../ui/IconButton.jsx";

/**
 * CONSOLE TOPBAR — shared global chrome for the three management experiences.
 *
 *   drawer trigger (below `lg`) · breadcrumb · actions · identity
 *
 * The breadcrumb is derived from the matched route's `handle.crumb` (see
 * `app/router.jsx`), so a new console screen states its own place in the
 * hierarchy next to its route — no page has to push a title into the shell.
 * `actions` is the configurable slot for search, notifications and other
 * experience-specific controls; nothing forces an experience to use it.
 */
function UserMenu({ user, role, onSignOut }) {
  const ref = useRef(null);

  const initials = (user.name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <details
      ref={ref}
      className="group relative"
      onKeyDown={(event) => {
        if (event.key === "Escape") ref.current.open = false;
      }}
    >
      <summary
        aria-label={`Account menu — ${user.name}`}
        className="flex cursor-pointer list-none items-center gap-2 rounded-sm border border-border-default py-1 pl-1 pr-2.5 transition-colors duration-200 hover:border-brand-accent/45 [&::-webkit-details-marker]:hidden"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-pill bg-surface-muted font-sans text-label text-brand-primary"
        >
          {initials || "S"}
        </span>
        <span className="hidden max-w-[9rem] truncate font-sans text-body-sm text-text-primary sm:block">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-text-muted transition-transform duration-200 group-open:rotate-180"
        />
      </summary>

      <div className="absolute right-0 z-40 mt-2 w-60 rounded-md border border-border-default bg-surface-primary p-1 shadow-subtle">
        <p className="px-3 py-2 font-sans text-body-sm text-text-primary">
          {user.name}
          <span className="mt-0.5 block text-caption text-text-muted">
            {user.email ?? role}
          </span>
        </p>
        {onSignOut ? (
          <>
            <span className="my-1 block h-px bg-border-subtle" aria-hidden="true" />
            <button
              type="button"
              onClick={onSignOut}
              className="w-full rounded-sm px-3 py-2 text-left font-sans text-body-sm text-text-primary transition-colors duration-200 hover:bg-surface-secondary"
            >
              Sign out
            </button>
          </>
        ) : null}
      </div>
    </details>
  );
}

UserMenu.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }).isRequired,
  role: PropTypes.string,
  onSignOut: PropTypes.func,
};

export default function ConsoleTopbar({
  experience,
  homePath,
  role,
  user,
  onSignOut,
  actions,
  onOpenNav,
}) {
  const crumbs = useMatches()
    .map((match) => match.handle?.crumb)
    .filter(Boolean);

  return (
    <header className="sticky top-0 z-30 border-b border-border-default bg-surface-primary/95 backdrop-blur-sm">
      <div className="flex min-h-[72px] items-center gap-4 px-gutter py-3 lg:px-8">
        <IconButton
          label="Open navigation"
          size="touch"
          className="-ml-2 lg:hidden"
          onClick={onOpenNav}
        >
          <Menu size={20} strokeWidth={1.5} aria-hidden="true" />
        </IconButton>

        <nav aria-label="Breadcrumb" className="min-w-0">
          {/* Below `sm` only the current screen shows, so a long trail can
              never crowd the topbar on a phone. */}
          <ol className="flex items-center gap-2 font-sans text-label uppercase">
            <li className="hidden items-center gap-2 sm:flex">
              <Link
                to={homePath}
                className="text-text-secondary transition-colors duration-200 hover:text-brand-primary"
              >
                {experience}
              </Link>
              <span aria-hidden="true" className="text-text-muted">
                /
              </span>
            </li>
            {crumbs.map((crumb) => (
              <li key={crumb} className="truncate">
                <span aria-current="page" className="text-text-primary">
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {actions}
          {user ? (
            <UserMenu user={user} role={role} onSignOut={onSignOut} />
          ) : (
            <>
              <Badge variant="brand">{role}</Badge>
              <Button
                variant="secondary"
                size="sm"
                href="/staff/login"
                className="hidden sm:inline-flex"
              >
                Staff Sign In
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

ConsoleTopbar.propTypes = {
  experience: PropTypes.string.isRequired,
  homePath: PropTypes.string,
  /** Role label shown when no session exists ("Admin", "Employee", …). */
  role: PropTypes.string,
  /** Signed-in user — renders the account menu instead of the status badges. */
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onSignOut: PropTypes.func,
  /** Experience-specific controls: search, notifications, quick actions. */
  actions: PropTypes.node,
  onOpenNav: PropTypes.func,
};
