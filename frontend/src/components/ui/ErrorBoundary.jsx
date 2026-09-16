import { Component } from "react";
import PropTypes from "prop-types";

/**
 * Catches render-time failures so the page never shows a blank screen.
 * `section` mode renders a quiet, minimal block; root mode renders a full
 * recoverable panel.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Future: report to the monitoring/observability provider.
    if (typeof console !== "undefined") {
      console.error("Swarnova UI error:", error, info);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    const { hasError, error } = this.state;
    const { variant = "root", label, children } = this.props;

    if (!hasError) return children;

    if (variant === "section") {
      return (
        <div
          role="alert"
          className="border border-line bg-ivory px-6 py-12 text-center"
          aria-label={label}
        >
          <p className="eyebrow eyebrow-light">Temporarily Unavailable</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-ash">
            This content could not be displayed. The rest of the house remains
            open — please continue browsing.
          </p>
        </div>
      );
    }

    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-ivory px-6">
        <div className="max-w-md border border-line bg-paper px-10 py-12 text-center">
          <p className="eyebrow eyebrow-light">Swarnova</p>
          <h1 className="mt-4 font-serif text-3xl text-ink">
            Something interrupted the page
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ash">
            An unexpected rendering issue occurred. Reloading usually resolves
            it in a moment.
          </p>
          {error?.message && (
            <p className="mt-4 break-words border-t border-line pt-4 text-[11px] tracking-wide text-mist">
              {error.message}
            </p>
          )}
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-7 inline-flex items-center justify-center rounded-[2px] border border-wine bg-wine px-8 py-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-cream transition-colors duration-200 hover:bg-wine-deep"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  variant: PropTypes.oneOf(["root", "section"]),
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
};
