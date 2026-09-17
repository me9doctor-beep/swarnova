import { useMemo, useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import { useAuditLogs } from "../../../hooks/useGovernancePlatform.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { auditActionLabel, auditActionVariant } from "../../../features/super-admin/governance.js";
import { formatDateTime } from "../../../utils/format.js";

/**
 * AUDIT TRAIL — who did what, where, and when.
 *
 * Every governance action the platform records: product lifecycle moves,
 * media uploads and attachments, gold-rate updates, campaign switches,
 * branch and account changes. A plain, filterable table — the platform's
 * memory, not a monitoring system.
 */
export default function AuditLogsPage() {
  useDocumentTitle("Audit Logs — Swarnova Super Admin");

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      action: actionFilter === "all" ? undefined : actionFilter,
      actor: actorFilter === "all" ? undefined : actorFilter,
    }),
    [search, actionFilter, actorFilter]
  );

  const { status, data: logs, error, retry } = useAuditLogs(query);

  /* Filter options are derived from the trail itself, so they can never
     offer a filter with no possible results. */
  const allLogs = useAuditLogs({});
  const actionOptions = useMemo(() => {
    const actions = [...new Set((allLogs.data ?? []).map((entry) => entry.action))].sort();
    return [{ value: "all", label: "All actions" }, ...actions.map((a) => ({ value: a, label: auditActionLabel(a) }))];
  }, [allLogs.data]);
  const actorOptions = useMemo(() => {
    const actors = [...new Set((allLogs.data ?? []).map((entry) => entry.actor))].sort();
    return [{ value: "all", label: "All actors" }, ...actors.map((a) => ({ value: a, label: a }))];
  }, [allLogs.data]);

  return (
    <>
      <PageHeader
        eyebrow="Platform Governance"
        title="Audit Logs"
        description="Every governance action, in order — product reviews, media changes, rate updates, account and content changes."
      />

      <div className="mt-6">
        <FilterBar
          searchLabel="Search the audit trail"
          searchPlaceholder="Product, detail or id…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "action",
              label: "Action",
              value: actionFilter,
              onChange: setActionFilter,
              options: actionOptions,
            },
            {
              id: "actor",
              label: "Actor",
              value: actorFilter,
              onChange: setActorFilter,
              options: actorOptions,
            },
          ]}
        />
      </div>

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="The audit trail could not be loaded."
        >
          {!logs || logs.length === 0 ? (
            <EmptyState title="No audit activity matches">
              Nothing in the trail matches these filters. Governance actions
              appear here the moment they happen.
            </EmptyState>
          ) : (
            <Table
              caption={`Audit trail — ${logs.length} ${logs.length === 1 ? "entry" : "entries"}`}
              hideCaption
              headers={[
                { label: "When" },
                { label: "Action" },
                { label: "Actor" },
                { label: "Entity" },
                { label: "Detail" },
              ]}
            >
              {logs.map((entry) => (
                <Table.Row key={entry.id}>
                  <Table.Cell className="whitespace-nowrap text-caption text-text-muted">
                    {formatDateTime(entry.at)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant={auditActionVariant(entry.action)}>
                      {auditActionLabel(entry.action)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-text-secondary">{entry.actor}</Table.Cell>
                  <Table.Cell>
                    <span className="block font-sans text-body-sm text-text-primary">
                      {entry.entityLabel ?? "—"}
                    </span>
                    <span className="block font-sans text-caption text-text-muted">{entry.entityId}</span>
                  </Table.Cell>
                  <Table.Cell className="max-w-md text-text-secondary">{entry.detail}</Table.Cell>
                </Table.Row>
              ))}
            </Table>
          )}
        </AsyncBoundary>
      </div>
    </>
  );
}
