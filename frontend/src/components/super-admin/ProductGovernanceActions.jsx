import { useState } from "react";
import PropTypes from "prop-types";
import Button from "../ui/Button.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { PRODUCT_ACTIONS } from "../../features/super-admin/governance.js";

/**
 * PRODUCT GOVERNANCE ACTIONS — the lifecycle buttons for one product.
 *
 * Only the actions the provider marked valid for the product's current
 * status are rendered (`product.actions`) — a Draft never shows Publish, an
 * Approved piece never shows Approve again. Every action passes through a
 * confirmation dialog; reject additionally requires a written reason.
 *
 * The transition itself runs in the owning page (useGovernanceMutation →
 * service → provider); this component owns dialog state and button layout.
 */
export default function ProductGovernanceActions({ product, onTransition, busy, error }) {
  const [pending, setPending] = useState(null); // the action awaiting confirmation
  const config = pending ? PRODUCT_ACTIONS[pending] : null;

  const confirm = async (reason) => {
    try {
      await onTransition(pending, reason ? { reason } : {});
      setPending(null);
    } catch {
      /* The page surfaces the provider's message through `error`; the dialog
         stays open so the administrator can read it. */
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2" aria-label="Product lifecycle actions">
        {(product.actions ?? []).map((action) => {
          const meta = PRODUCT_ACTIONS[action];
          if (!meta) return null;
          return (
            <Button
              key={action}
              variant={meta.variant === "danger" ? "danger" : meta.variant === "success" ? "success" : "outline"}
              size="sm"
              disabled={busy}
              onClick={() => setPending(action)}
            >
              {meta.label}
            </Button>
          );
        })}
        {(product.actions ?? []).length === 0 ? (
          <p className="font-sans text-caption text-text-muted">
            No further lifecycle actions for a published product.
          </p>
        ) : null}
      </div>

      {config ? (
        <ConfirmDialog
          open
          onClose={() => setPending(null)}
          onConfirm={confirm}
          title={config.confirmTitle}
          body={config.confirmBody}
          confirmLabel={config.confirmLabel}
          confirmVariant={config.variant}
          busy={busy}
          error={error}
          reason={
            config.requiresReason
              ? { required: true, label: config.reasonLabel, hint: config.reasonHint }
              : null
          }
        />
      ) : null}
    </>
  );
}

ProductGovernanceActions.propTypes = {
  product: PropTypes.shape({
    actions: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  /** Runs the lifecycle action; must reject (throw) on failure. */
  onTransition: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
};
