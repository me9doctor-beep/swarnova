import PropTypes from "prop-types";

/**
 * DEMO ACCESS (Phase 11)
 * ----------------------------------------------------------------------------
 * The ONE development-only disclosure for customer authentication — the same
 * explicit `<details>` mechanism the staff login already uses. Mock
 * credentials and mock reset references appear only here, never in page
 * copy, and a real identity provider removes this box without touching the
 * forms it sits beside.
 */
export default function DemoAccessBox({ summary = "Demo access", children }) {
  return (
    <details className="border border-border-default bg-surface-primary px-5 py-4">
      <summary className="cursor-pointer font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
        {summary}
      </summary>
      <div className="mt-3 space-y-3 font-sans text-caption leading-relaxed text-text-muted">
        {children}
      </div>
    </details>
  );
}

DemoAccessBox.propTypes = {
  summary: PropTypes.string,
  children: PropTypes.node.isRequired,
};
