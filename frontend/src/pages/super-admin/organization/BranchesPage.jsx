import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { organizationGovernanceService } from "../../../services/organizationGovernanceService.js";
import { ACCOUNT_STATUS_META } from "../../../features/super-admin/governance.js";

/**
 * BRANCH GOVERNANCE — platform-wide visibility over the boutique network.
 *
 * One row per boutique: name, location, status, the administrator running
 * it and how many employees the platform sees there. Disable hides a branch
 * from the storefront; nothing is deleted.
 *
 * The branch name opens the drill-down — the platform's global view narrowed
 * to one boutique's orders, stock, team and activity, with the way back on the
 * page itself. Oversight only: nothing here edits the branch's own operations.
 */
export default function BranchesPage() {
  useDocumentTitle("Branches — Swarnova Super Admin");

  const { status, data: branches, error, retry } = useGovernanceBranches();
  const mutation = useGovernanceMutation();
  const [confirm, setConfirm] = useState(null); // { branch, target }

  const changeStatus = async (branch, target) => {
    try {
      await mutation.run(organizationGovernanceService.setBranchStatus, branch.id, target);
      setConfirm(null);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Branches"
        description="The physical boutique network. Status changes take effect on the storefront immediately."
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Branches could not be loaded."
        >
          {!branches || branches.length === 0 ? (
            <EmptyState title="No branches found">
              The platform has no boutique branches registered.
            </EmptyState>
          ) : (
            <Table
              caption="Boutique branches"
              hideCaption
              headers={[
                { label: "Branch" },
                { label: "Location" },
                { label: "Administrator" },
                { label: "Employees", align: "center" },
                { label: "Status" },
                { label: "Actions", align: "right" },
              ]}
            >
              {branches.map((branch) => {
                const meta = ACCOUNT_STATUS_META[branch.status] ?? ACCOUNT_STATUS_META.active;
                return (
                  <Table.Row key={branch.id}>
                    <Table.Cell>
                      <span className="flex items-center gap-3">
                        <span className="h-11 w-16 shrink-0 overflow-hidden bg-surface-secondary">
                          {branch.image?.src ? (
                            <img src={branch.image.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <Link
                            to={`/super-admin/branches/${branch.id}`}
                            className="block font-sans text-body-sm font-medium text-text-primary underline-offset-4 transition-colors duration-200 hover:text-brand-primary hover:underline"
                          >
                            {branch.name}
                          </Link>
                          <span className="block font-sans text-caption text-text-muted">
                            {branch.id}
                            {branch.flagship ? " · Flagship" : ""}
                          </span>
                        </span>
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-caption text-text-secondary">
                      {branch.city}, {branch.state}
                    </Table.Cell>
                    <Table.Cell>
                      {branch.adminName ? (
                        <span className="font-sans text-body-sm text-text-primary">{branch.adminName}</span>
                      ) : (
                        <span className="font-sans text-caption text-state-warning">No active admin</span>
                      )}
                    </Table.Cell>
                    <Table.Cell align="center">{branch.employeeCount}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Link
                        to={`/super-admin/branches/${branch.id}`}
                        className="mr-3 inline-flex items-center font-sans text-label uppercase tracking-[0.18em] text-text-secondary underline-offset-4 transition-colors duration-200 hover:text-brand-primary hover:underline"
                      >
                        Inspect
                      </Link>
                      {branch.status === "active" ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setConfirm({ branch, target: "disabled" })}
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirm({ branch, target: "active" })}
                        >
                          Enable
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => changeStatus(confirm.branch, confirm.target)}
        title={
          confirm?.target === "disabled"
            ? `Disable ${confirm.branch.name}?`
            : `Enable ${confirm?.branch.name}?`
        }
        body={
          confirm?.target === "disabled"
            ? "The boutique is hidden from the storefront (stores, visits and contact surfaces) until it is re-enabled. Its people, history and administrator stay attached."
            : "The boutique appears on the storefront again."
        }
        confirmLabel={confirm?.target === "disabled" ? "Disable Branch" : "Enable Branch"}
        confirmVariant={confirm?.target === "disabled" ? "danger" : "primary"}
        busy={mutation.busy}
        error={mutation.error}
      />
    </>
  );
}
