import PropTypes from "prop-types";
import { Lock } from "lucide-react";
import Button from "../../components/ui/Button.jsx";
import { useAuth } from "./useAuth.js";
import { roleHomePath, roleLabel } from "./roles.js";

/**
 * ACCESS DENIED — the proper refusal state for RBAC.
 *
 * Shown when a signed-in user reaches a route their role or capabilities do
 * not cover (direct navigation, stale links, guessed URLs). It never reveals
 * what sits behind the boundary — only that this account cannot enter.
 *
 * Two placements:
 *   full    replaces the whole screen (a role boundary refusal)
 *   inline  renders inside an existing console shell (a capability gate)
 */
export default function AccessDenied({ inline = false }) {
  const { isAuthenticated, role } = useAuth();

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      {isAuthenticated ? (
        <Button size="sm" href={roleHomePath(role)}>
          Go to my workspace
        </Button>
      ) : (
        <Button size="sm" href="/staff/login">
          Staff Sign In
        </Button>
      )}
      <Button variant="outline" size="sm" href="/">
        Return to Storefront
      </Button>
    </div>
  );

  if (inline) {
    return (
      <section
        aria-label="Access denied"
        className="mt-6 border border-border-default bg-surface-primary px-6 py-10 text-center"
      >
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-pill border border-border-default bg-surface-secondary text-brand-accent-strong">
          <Lock size={18} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
          Access Restricted
        </h2>
        <p className="mx-auto mt-3 max-w-md font-sans text-body-sm text-text-muted">
          Your account does not include the capability this area requires. If
          you believe it should, speak with your administrator.
        </p>
        <div className="mt-6 flex justify-center">{actions}</div>
      </section>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-secondary px-gutter py-16">
      <section
        aria-label="Access denied"
        className="w-full max-w-lg border border-border-default bg-surface-primary px-8 py-12 text-center sm:px-12"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-pill border border-border-default bg-surface-secondary text-brand-accent-strong">
          <Lock size={20} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="mt-6 font-sans text-label uppercase tracking-[0.28em] text-brand-accent-strong">
          Swarnova
        </p>
        <h1 className="mt-3 text-h2 text-text-primary">Access Restricted</h1>
        <p className="mx-auto mt-4 max-w-md font-sans text-body-sm text-text-secondary">
          {isAuthenticated
            ? `This workspace belongs to a different role. You are signed in as ${roleLabel(role)} — your own workspace has everything you need.`
            : "This workspace is for Swarnova staff. Sign in with your staff account to continue."}
        </p>
        <div className="mt-8 flex justify-center">{actions}</div>
      </section>
    </div>
  );
}

AccessDenied.propTypes = {
  /** Render inside an existing console shell instead of full-screen. */
  inline: PropTypes.bool,
};
