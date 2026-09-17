import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/Dialog.jsx";
import Button from "../ui/Button.jsx";
import Textarea from "../ui/Textarea.jsx";

/**
 * CONFIRM DIALOG — the gate before destructive or governance-critical
 * actions (reject, publish, disable, delete).
 *
 * Two shapes in one primitive:
 *   plain confirm   title + body + Cancel / Confirm
 *   reason confirm  adds a required reason field (reject flows) — the dialog
 *                   refuses to confirm until a reason is written, and the
 *                   reason travels with the action into the audit trail.
 *
 * Mock-backend failures surface in place: the dialog stays open with the
 * provider's message so the administrator can act on it.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  busy = false,
  error = null,
  reason = null,
}) {
  const [reasonText, setReasonText] = useState("");
  const [reasonError, setReasonError] = useState(null);

  /* Reset the reason field whenever a new dialog instance opens. */
  useEffect(() => {
    if (open) {
      setReasonText("");
      setReasonError(null);
    }
  }, [open]);

  const confirm = () => {
    if (reason?.required && reasonText.trim().length < 8) {
      setReasonError("Please write a clear reason (at least a short sentence).");
      return;
    }
    onConfirm(reason?.required ? reasonText.trim() : undefined);
  };

  return (
    <Dialog open={open} onClose={busy ? () => {} : onClose} title={title} width="sm">
      <p className="font-sans text-body-sm text-text-secondary">{body}</p>

      {reason?.required ? (
        <div className="mt-5">
          <Textarea
            label={reason.label ?? "Reason"}
            hint={reason.hint}
            required
            rows={3}
            value={reasonText}
            onChange={(event) => {
              setReasonText(event.target.value);
              if (reasonError) setReasonError(null);
            }}
            error={reasonError}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error">
          {error.message ?? String(error)}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant={confirmVariant} size="sm" onClick={confirm} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  /** Called with the reason string when `reason.required`, otherwise undefined. */
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  body: PropTypes.node.isRequired,
  confirmLabel: PropTypes.string,
  confirmVariant: PropTypes.oneOf(["primary", "secondary", "outline", "danger", "success"]),
  busy: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  reason: PropTypes.shape({
    required: PropTypes.bool,
    label: PropTypes.string,
    hint: PropTypes.string,
  }),
};
