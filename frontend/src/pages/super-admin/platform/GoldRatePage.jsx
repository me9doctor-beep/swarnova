import { useEffect, useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useGoldRateBoard } from "../../../hooks/useGoldRateBoard.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { platformGovernanceService } from "../../../services/platformGovernanceService.js";
import { formatDateTime } from "../../../utils/format.js";

/**
 * GOLD RATE GOVERNANCE — the daily indicative board.
 *
 * Rates are indicative INR per 10 g for reference; the mock board updates in
 * place and the storefront's gold-rate section reads the same board, so an
 * update here is an update everywhere. No live market feed — rates are set
 * by hand, exactly as a daily desk would publish them.
 */
export default function GoldRatePage() {
  useDocumentTitle("Gold Rate — Swarnova Super Admin");

  const { status, data: board, error, retry } = useGoldRateBoard();
  const [editing, setEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Platform Governance"
        title="Gold Rate"
        description="The indicative daily rates the storefront shows its customers. One board, one source — updating it here updates the storefront."
        actions={
          <Button size="sm" onClick={() => setEditing(true)} disabled={status !== "success"}>
            Update Rates
          </Button>
        }
      />

      <div className="mt-6">
        {savedNotice ? (
          <p role="status" className="mb-4 border border-state-success/30 bg-state-success-soft px-5 py-3 font-sans text-body-sm text-state-success">
            The gold-rate board has been updated. The storefront shows the new
            rates immediately.
          </p>
        ) : null}

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="The gold-rate board could not be loaded."
        >
          {board ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <Badge variant="brand" dot>
                  {board.market}
                </Badge>
                <p className="font-sans text-caption text-text-muted">
                  Last updated {formatDateTime(board.updatedAt)} · {board.sourceLabel}
                </p>
              </div>

              <Table
                caption={`Indicative gold rates per ${board.unit}, ${board.currency}`}
                hideCaption
                headers={[
                  { label: "Karat" },
                  { label: "Description" },
                  { label: `Rate per ${board.unit} (INR)`, align: "right" },
                  { label: "Status" },
                ]}
              >
                {[...(board.rates ?? [])]
                  .sort((a, b) => Number.parseInt(b.karat, 10) - Number.parseInt(a.karat, 10))
                  .map((rate) => (
                    <Table.Row key={rate.karat}>
                      <Table.Cell>
                        <span className="font-serif text-h4 text-text-primary">{rate.karat}</span>
                        <span className="ml-2 font-sans text-caption text-text-muted">{rate.label}</span>
                      </Table.Cell>
                      <Table.Cell className="text-text-secondary">{rate.description}</Table.Cell>
                      <Table.Cell align="right">
                        <span className="font-sans text-price text-text-primary">
                          <span className="mr-0.5 font-light">₹</span>
                          {rate.pricePer10g.toLocaleString("en-IN")}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge variant="success" dot>
                          Current
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table>

              <p className="max-w-2xl font-sans text-caption text-text-muted">
                {board.note} {board.includes}.
              </p>
            </div>
          ) : null}
        </AsyncBoundary>
      </div>

      {editing && board ? (
        <GoldRateDialog
          board={board}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setSavedNotice(true);
            retry();
          }}
        />
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Update dialog                                                           */
/* ---------------------------------------------------------------------- */

function GoldRateDialog({ board, onClose, onSaved }) {
  const mutation = useGovernanceMutation();
  const [values, setValues] = useState(() =>
    Object.fromEntries(board.rates.map((rate) => [rate.karat, String(rate.pricePer10g)]))
  );
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    setValues(Object.fromEntries(board.rates.map((rate) => [rate.karat, String(rate.pricePer10g)])));
  }, [board]);

  const save = async (event) => {
    event.preventDefault();
    setLocalError(null);

    const rates = board.rates.map((rate) => ({
      karat: rate.karat,
      pricePer10g: Number(String(values[rate.karat]).replace(/[₹,\s]/g, "")),
    }));
    const invalid = rates.find((rate) => !Number.isFinite(rate.pricePer10g) || rate.pricePer10g <= 0);
    if (invalid) {
      setLocalError(`Enter a valid positive rate for ${invalid.karat} gold.`);
      return;
    }

    try {
      await mutation.run(platformGovernanceService.updateGoldRates, rates);
      onSaved();
    } catch {
      /* mutation.error carries the provider's message */
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Update Gold Rates"
      description={`Indicative rates in INR per ${board.unit}. The storefront updates immediately on save.`}
    >
      <form onSubmit={save} className="space-y-4">
        {board.rates.map((rate) => (
          <Input
            key={rate.karat}
            label={`${rate.karat} — ${rate.label}`}
            hint={`Current: ₹ ${rate.pricePer10g.toLocaleString("en-IN")} per ${board.unit}`}
            required
            inputMode="numeric"
            size="sm"
            value={values[rate.karat] ?? ""}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, [rate.karat]: event.target.value }))
            }
          />
        ))}

        {(localError || mutation.error) && (
          <p role="alert" className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error">
            {localError ?? mutation.error?.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.busy}>
            {mutation.busy ? "Saving…" : "Publish Rates"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
