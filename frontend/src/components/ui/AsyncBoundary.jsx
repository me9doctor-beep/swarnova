import PropTypes from "prop-types";
import Button from "./Button.jsx";

/**
 * Graceful loading / error / empty states for data-driven sections.
 * Deliberately static — no spinners or motion, in keeping with the house.
 */
export default function AsyncBoundary({
  status,
  error,
  isEmpty = false,
  emptyMessage = "Nothing to display at the moment.",
  errorMessage = "We couldn't load this content. Please try again.",
  onRetry,
  children,
  className = "py-16",
}) {
  if (status === "loading") {
    return (
      <div className={className} role="status" aria-live="polite">
        <p className="eyebrow eyebrow-light text-center">Loading</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${className} text-center`} role="alert">
        <p className="mx-auto max-w-md text-body text-text-secondary">{error?.message ?? errorMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-6" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    );
  }

  if (status === "success" && isEmpty) {
    return (
      <div className={`${className} text-center`}>
        <p className="mx-auto max-w-md text-body text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return children;
}

AsyncBoundary.propTypes = {
  status: PropTypes.oneOf(["loading", "success", "error"]).isRequired,
  error: PropTypes.object,
  isEmpty: PropTypes.bool,
  emptyMessage: PropTypes.string,
  errorMessage: PropTypes.string,
  onRetry: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
};
