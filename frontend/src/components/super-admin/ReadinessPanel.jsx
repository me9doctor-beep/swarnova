import PropTypes from "prop-types";
import { Check, X } from "lucide-react";
import Badge from "../ui/Badge.jsx";

/**
 * READINESS PANEL — the publish-readiness contract, rendered plainly.
 *
 * The provider computes the checks; this panel shows them. Two states only:
 * READY TO PUBLISH or NEEDS ATTENTION — never a fake percentage.
 */
export default function ReadinessPanel({ readiness }) {
  if (!readiness) return null;

  return (
    <section
      aria-label="Product readiness"
      className="border border-border-default bg-surface-primary p-panel"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
          Readiness
        </h2>
        <Badge variant={readiness.ready ? "success" : "warning"} dot>
          {readiness.ready ? "Ready to Publish" : "Needs Attention"}
        </Badge>
      </div>

      <ul className="mt-5 space-y-2.5">
        {readiness.checks.map((check) => (
          <li key={check.key} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 items-center justify-center rounded-pill ${
                check.ok
                  ? "bg-state-success-soft text-state-success"
                  : "bg-state-warning-soft text-state-warning"
              }`}
            >
              {check.ok ? <Check size={12} strokeWidth={2} /> : <X size={12} strokeWidth={2} />}
            </span>
            <span className="font-sans text-body-sm text-text-primary">{check.label}</span>
            <span className="sr-only">{check.ok ? "complete" : "missing"}</span>
            {!check.ok ? (
              <span aria-hidden="true" className="ml-auto font-sans text-label uppercase text-state-warning">
                Missing
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

ReadinessPanel.propTypes = {
  readiness: PropTypes.shape({
    ready: PropTypes.bool.isRequired,
    checks: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        ok: PropTypes.bool.isRequired,
      })
    ).isRequired,
  }),
};
