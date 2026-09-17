import { useState } from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/Dialog.jsx";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Textarea from "../ui/Textarea.jsx";

/**
 * ADJUST STOCK DIALOG — one stock correction, captured the way the backend
 * requires it: a direction, whole pieces and a written reason that travels
 * into the movement log and the audit trail.
 *
 * Presentational only: the caller owns the call and passes `busy` / `error`
 * back in, so the Admin console and the Employee console share this one form
 * while each keeps its own scoped service. (The reason minimum mirrors the
 * confirm-dialog rule: a short sentence, never a dash.)
 */
export default function AdjustStockDialog({ row, onClose, onAdjust, busy = false, error = null }) {
  const [direction, setDirection] = useState("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    setLocalError(null);

    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      setLocalError("Enter a whole-piece quantity greater than zero.");
      return;
    }
    if (reason.trim().length < 8) {
      setLocalError("Write a clear reason for this adjustment.");
      return;
    }

    onAdjust({
      delta: direction === "add" ? amount : -amount,
      reason: reason.trim(),
    });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Adjust Stock"
      description={`${row.productName} · ${row.branchName} · ${row.available} available now`}
    >
      <form onSubmit={submit} className="space-y-4">
        <Select
          label="Direction"
          size="sm"
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
        >
          <option value="add">Add stock (receipt / correction)</option>
          <option value="remove">Remove stock (damage / correction)</option>
        </Select>
        <Input
          label="Quantity (pieces)"
          required
          size="sm"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
        />
        <Textarea
          label="Reason"
          required
          rows={2}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          hint="Recorded in the movement log and the audit trail."
        />

        {(localError || error) && (
          <p
            role="alert"
            className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error"
          >
            {localError ?? error?.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Adjusting…" : "Adjust Stock"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

AdjustStockDialog.propTypes = {
  /** The stock row being adjusted (uses productName, branchName, available). */
  row: PropTypes.shape({
    productName: PropTypes.string,
    branchName: PropTypes.string,
    available: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  /** Receives { delta, reason }. */
  onAdjust: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
};
