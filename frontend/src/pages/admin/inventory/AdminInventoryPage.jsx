import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Textarea from "../../../components/ui/Textarea.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import {
  useAdminInventory,
  useInventoryMovements,
} from "../../../hooks/useAdminOperations.js";
import { useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useAuth } from "../../../features/authentication/useAuth.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { actorLabel } from "../../../features/authentication/roles.js";
import { adminOperationsService } from "../../../services/adminOperationsService.js";
import {
  MOVEMENT_TYPE_META,
  STOCK_FILTER_OPTIONS,
  STOCK_STATE_META,
} from "../../../features/admin/operations.js";
import { formatDateTime } from "../../../utils/format.js";

/**
 * INVENTORY OPERATIONS (Phase 9) — branch stock for the business.
 *
 * One table: piece × branch, with available, reserved and reorder level,
 * the derived stock state, and the two operational tools head office
 * needs — an adjustment (always reasoned, always logged) and the
 * movement history behind every line. No warehouse system, by design.
 */
export default function AdminInventoryPage() {
  useDocumentTitle("Inventory — Swarnova Admin");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stock") ?? "all");
  const [branchFilter, setBranchFilter] = useState(searchParams.get("branch") ?? "all");
  const { user, role } = useAuth();
  const { can: canDo } = useCapability();
  const mutation = useGovernanceMutation();
  const [adjusting, setAdjusting] = useState(null); // stock row being adjusted
  const [movementsFor, setMovementsFor] = useState(null); // stock row showing history

  /* Dashboard deep-links (?stock=low, ?branch=BR-001) refresh the filters. */
  useEffect(() => {
    setStockFilter(searchParams.get("stock") ?? "all");
    setBranchFilter(searchParams.get("branch") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      stock: stockFilter === "all" ? undefined : stockFilter,
      branchId: branchFilter === "all" ? undefined : branchFilter,
    }),
    [search, stockFilter, branchFilter]
  );

  const { status, data: inventory, error, retry } = useAdminInventory(query);
  const branches = useGovernanceBranches();

  const canManage = canDo(CAPABILITIES.INVENTORY_MANAGE);

  const branchOptions = [
    { value: "all", label: "All branches" },
    ...(branches.data ?? []).map((branch) => ({
      value: branch.id,
      label: branch.name,
    })),
  ];

  const adjust = async (adjustment) => {
    try {
      await mutation.run(
        adminOperationsService.adjustInventory,
        adjusting.id,
        adjustment,
        actorLabel(user, role)
      );
      setAdjusting(null);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Business · Inventory"
        title="Inventory"
        description="Physical stock across the boutique network — available, reserved and reorder levels per piece per branch, with every adjustment logged."
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search inventory"
          searchPlaceholder="Product name or SKU…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "stock",
              label: "Stock state",
              value: stockFilter,
              onChange: setStockFilter,
              options: STOCK_FILTER_OPTIONS,
            },
            {
              id: "branch",
              label: "Branch",
              value: branchFilter,
              onChange: setBranchFilter,
              options: branchOptions,
            },
          ]}
        />

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Inventory could not be loaded."
        >
          {!inventory || inventory.length === 0 ? (
            <EmptyState title="No stock lines match">
              Adjust the search or filters — or clear them to see every
              branch stock line.
            </EmptyState>
          ) : (
            <Table
              caption="Branch inventory"
              hideCaption
              headers={[
                { label: "Product" },
                { label: "Branch" },
                { label: "Available", align: "right" },
                { label: "Reserved", align: "right" },
                { label: "Reorder", align: "right" },
                { label: "State" },
                { label: "Actions", align: "right" },
              ]}
            >
              {inventory.map((row) => {
                const meta = STOCK_STATE_META[row.state] ?? STOCK_STATE_META.ok;
                return (
                  <Table.Row key={row.id} highlight={row.state !== "ok"}>
                    <Table.Cell>
                      <span className="flex items-center gap-3">
                        {row.productImage?.src ? (
                          <img
                            src={row.productImage.src}
                            alt=""
                            loading="lazy"
                            className="h-11 w-11 shrink-0 border border-border-subtle object-cover"
                          />
                        ) : null}
                        <span>
                          <Link
                            to={`/admin/products/${row.productId}`}
                            className="block font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary"
                          >
                            {row.productName}
                          </Link>
                          <span className="block font-sans text-caption text-text-muted">
                            {row.sku}
                          </span>
                        </span>
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">
                      {row.branchName}
                    </Table.Cell>
                    <Table.Cell align="right">{row.available}</Table.Cell>
                    <Table.Cell align="right">{row.reserved}</Table.Cell>
                    <Table.Cell align="right">{row.reorderLevel}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        {canManage ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mutation.busy}
                            onClick={() => setAdjusting(row)}
                          >
                            Adjust
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setMovementsFor(row)}
                        >
                          History
                        </Button>
                      </span>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>
      </div>

      {adjusting ? (
        <AdjustStockDialog
          row={adjusting}
          onClose={() => setAdjusting(null)}
          onAdjust={adjust}
          busy={mutation.busy}
          error={mutation.error}
        />
      ) : null}

      {movementsFor ? (
        <MovementsDialog row={movementsFor} onClose={() => setMovementsFor(null)} />
      ) : null}
    </>
  );
}

/** One stock adjustment — direction, whole pieces, a written reason. */
function AdjustStockDialog({ row, onClose, onAdjust, busy, error }) {
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

/** The movement history behind one stock line. */
function MovementsDialog({ row, onClose }) {
  const { status, data: movements, error, retry } = useInventoryMovements({
    stockId: row.id,
    limit: 20,
  });

  return (
    <Dialog
      open
      onClose={onClose}
      title="Stock Movement History"
      description={`${row.productName} · ${row.branchName}`}
      width="lg"
    >
      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="Movements could not be loaded."
        className="py-8"
      >
        {!movements || movements.length === 0 ? (
          <EmptyState title="No movements recorded">
            Adjustments, receipts and sales for this line will appear here.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border-subtle border border-border-default">
            {movements.map((movement) => {
              const meta = MOVEMENT_TYPE_META[movement.type] ?? MOVEMENT_TYPE_META.adjustment;
              return (
                <li key={movement.id} className="px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <span className="font-sans text-body-sm font-medium text-text-primary">
                      {movement.delta > 0 ? "+" : ""}
                      {movement.delta} {Math.abs(movement.delta) === 1 ? "piece" : "pieces"}
                    </span>
                    <span className="font-sans text-caption text-text-muted">
                      {formatDateTime(movement.at)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-sans text-caption text-text-secondary">
                    {movement.by}
                    {movement.note ? ` — ${movement.note}` : ""}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </AsyncBoundary>
    </Dialog>
  );
}
