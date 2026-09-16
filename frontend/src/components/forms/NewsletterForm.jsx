import { useState } from "react";
import PropTypes from "prop-types";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "../../utils/cn.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Premium newsletter field. Two presentations:
 *  - full: framed input for the standalone section
 *  - compact: underline field for the wine footer
 * Submit is a graceful in-place success state (ready for an API endpoint).
 */
export default function NewsletterForm({
  variant = "full",
  placeholder = "Your email address",
  buttonLabel = "Subscribe",
  successMessage = "Thank you for subscribing.",
  className,
}) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    // Future: contentService.subscribe(provider, { email })
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p
        role="status"
        className={cn(
          "flex items-center justify-center gap-2.5 text-[13px]",
          variant === "compact" ? "text-champagne" : "text-gold-deep",
          className
        )}
      >
        <Check size={15} strokeWidth={1.6} aria-hidden="true" />
        {successMessage}
      </p>
    );
  }

  const isCompact = variant === "compact";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(isCompact ? "w-full" : "w-full max-w-lg", className)}
    >
      <label htmlFor={`newsletter-${variant}`} className="sr-only">
        Email address
      </label>
      <div
        className={cn(
          "flex items-stretch",
          isCompact ? "border-b border-cream/30" : "border border-ink/25 bg-paper"
        )}
      >
        <input
          id={`newsletter-${variant}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `newsletter-error-${variant}` : undefined}
          className={cn(
            // 16px on phones: iOS Safari zooms the whole page when a field
            // smaller than that receives focus, which broke the mobile layout.
            "min-w-0 flex-1 bg-transparent font-sans text-[16px] tracking-wide outline-none placeholder:text-mist sm:text-sm",
            isCompact
              ? "px-1 py-3 text-cream placeholder:text-cream/45"
              : "px-5 py-3.5 text-ink"
          )}
        />
        <button
          type="submit"
          className={cn(
            "flex shrink-0 items-center justify-center px-5 transition-colors duration-200",
            isCompact
              ? "text-champagne hover:text-cream"
              : "bg-wine text-cream hover:bg-wine-deep"
          )}
          aria-label={buttonLabel}
        >
          <ArrowRight size={17} strokeWidth={1.6} />
        </button>
      </div>
      {error && (
        <p
          id={`newsletter-error-${variant}`}
          className={cn(
            "mt-2 text-xs",
            isCompact ? "text-champagne" : "text-wine"
          )}
        >
          {error}
        </p>
      )}
    </form>
  );
}

NewsletterForm.propTypes = {
  variant: PropTypes.oneOf(["full", "compact"]),
  placeholder: PropTypes.string,
  buttonLabel: PropTypes.string,
  successMessage: PropTypes.string,
  className: PropTypes.string,
};
