import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import AdjustStockDialog from "../../../components/console/AdjustStockDialog.jsx";
import StockMovementsDialog from "../../../components/console/StockMovementsDialog.jsx";
import {
  useEmployeeActor,
  useEmployeeInventory,
  useEmployeeInventoryMovements,
} from "../../../hooks/useEmployeeOperations.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { employeeOperationsService } from "../../../services/employeeOperationsService.js";
import { STOCK_FILTER_OPTIONS, STOCK_STATE_META } from "../../../features/admin/operations.js";

/**
 * BRANCH INVENTORY (Phase 10)
 * -----------------------------------------------------------------------------
 * The boutique's own stock: what is on the floor, what is already spoken for,
 * the reorder level and the state that follows from them.
 *
 * Inventory View reads; Inventory Manage additionally corrects a line — always
 * with a written reason, always against this branch only, and always carrying
 * the signed-in colleague's name into the movement log and the audit trail.
 * The branch itself is never chosen here: the provider resolves it from the
 * session, so there is no branch to mistype or tamper with.
 */
export default function EmployeeInventoryPage() {
  useDocumentTitle("Inventory — Swarnova Employee");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState(searchParams.get("stock") ?? "all");
  const { can: canDo } = useCapability();
  const actor = useEmployeeActor();
  const mutation = useGovernanceMutation();
  const [adjusting, setAdjusting] = useState(null); // the stock row being adjusted
  const [movementsFor, setMovementsFor] = useState(null); // the row whose history is open

  /* Dashboard deep-links (?stock=low) refresh the filter. */
  useEffect(() => {
    setStockFilter(searchParams.get("stock") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      stock: stockFilter === "all" ? undefined : stockFilter,
    }),
    [search, stockFilter]
  );

  const { status, data: inventory, error, retry } = useEmployeeInventory(query);
  const canManage = canDo(CAPABILITIES.INVENTORY_MANAGE);

  const adjust = async (adjustment) => {
    try {
      await mutation.run(
        employeeOperationsService.adjustInventory,
        actor,
        adjusting.id,
        adjustment
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
        eyebrow="My Work · Inventory"
        title="Branch Inventory"
        description="Everything on this boutique's floor — available, reserved and reorder levels, with every movement recorded against your name."
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
              Adjust the search or filters — or clear them to see every line
              this boutique holds.
            </EmptyState>
          ) : (
            <Table
              caption="Branch inventory"
              hideCaption
              headers={[
                { label: "Piece" },
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
                            to={`/employee/products/${row.productId}`}
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

/** The movement history behind one stock line — fetched through the branch contract. */
function MovementsDialog({ row, onClose }) {
  const { status, data: movements, error, retry } = useEmployeeInventoryMovements({
    stockId: row.id,
    limit: 20,
  });

  return (
    <StockMovementsDialog
      row={row}
      status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
      movements={movements}
      error={error}
      onRetry={retry}
      onClose={onClose}
    />
  );
}
