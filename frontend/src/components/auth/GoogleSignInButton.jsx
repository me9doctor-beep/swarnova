import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";

/**
 * Clean vector glyph for Google authentication.
 */
function GoogleGlyph({ className = "h-4 w-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

GoogleGlyph.propTypes = {
  className: PropTypes.string,
};

/**
 * GOOGLE SIGN IN CTA (Phase 13.5)
 * -----------------------------------------------------------------------------
 * Editorial "Continue with Google" action for customer authentication.
 *
 * Designed in the Swarnova luxury visual language:
 * - Subtle champagne hairline separator with uppercase micro label
 * - Restrained outline/secondary action matching salon aesthetic
 * - Clean SVG glyph with accessible state handling
 */
export default function GoogleSignInButton({
  onClick,
  disabled = false,
  busy = false,
  label = "Continue with Google",
  showDivider = true,
}) {
  return (
    <div className="w-full">
      {showDivider ? (
        <div className="relative my-6 text-center">
          <div aria-hidden="true" className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default" />
          </div>
          <span className="relative bg-surface-primary px-3 font-sans text-caption uppercase tracking-[0.2em] text-text-muted">
            Or continue with
          </span>
        </div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="w-full justify-center gap-3 border-border-default hover:border-brand-accent/60"
        onClick={onClick}
        disabled={disabled || busy}
      >
        <GoogleGlyph className="h-4 w-4 shrink-0" />
        <span>{busy ? "Connecting to Google…" : label}</span>
      </Button>
    </div>
  );
}

GoogleSignInButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  busy: PropTypes.bool,
  label: PropTypes.string,
  showDivider: PropTypes.bool,
};
