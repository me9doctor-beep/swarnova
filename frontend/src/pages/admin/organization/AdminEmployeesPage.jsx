import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import EmployeeFormDialog from "../../../components/admin/EmployeeFormDialog.jsx";
import {
  useAdminEmployees,
  useCapabilityProfiles,
} from "../../../hooks/useAdminOperations.js";
import { useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useAuth } from "../../../features/authentication/useAuth.js";
import { actorLabel } from "../../../features/authentication/roles.js";
import { organizationGovernanceService } from "../../../services/organizationGovernanceService.js";
import { EMPLOYEE_STATUS_META } from "../../../features/admin/operations.js";
import { describeCapabilities } from "../../../features/authentication/capabilities.js";

/**
 * STAFF MANAGEMENT (Phase 9) — the Admin's employee directory.
 *
 * One list, one form. Admins create EMPLOYEE accounts — never Admins, never
 * Super Admins (the provider refuses; the UI never offers them) — and shape
 * each account with a reusable capability profile. Capability grants are
 * bounded by the Admin's own authority, enforced again by the provider.
 */
export default function AdminEmployeesPage() {
  useDocumentTitle("Employees — Swarnova Admin");

  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role, permissions } = useAuth();
  const { status, data: employees, error, retry } = useAdminEmployees();
  const profilesAsync = useCapabilityProfiles();
  const branchesAsync = useGovernanceBranches();
  const mutation = useGovernanceMutation();

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState(null); // employee | "new" | null
  const [confirm, setConfirm] = useState(null); // { employee, target }
  const [created, setCreated] = useState(null); // created employee + password

  /* The dashboard's quick action deep-links here with ?new=1. */
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing("new");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const profiles = profilesAsync.data ?? [];
  const branches = branchesAsync.data ?? [];

  const visible = useMemo(() => {
    let list = employees ?? [];
    if (branchFilter !== "all") list = list.filter((item) => item.branchId === branchFilter);
    if (statusFilter !== "all") list = list.filter((item) => item.status === statusFilter);
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          String(item.email ?? "").toLowerCase().includes(term) ||
          String(item.role ?? "").toLowerCase().includes(term)
      );
    }
    return list;
  }, [employees, branchFilter, statusFilter, search]);

  const submitEmployee = async (data) => {
    try {
      if (editing === "new") {
        const result = await mutation.run(
          organizationGovernanceService.createEmployee,
          data,
          { role, permissions, label: actorLabel(user, role) }
        );
        setEditing(null);
        setCreated(result);
        retry();
      } else {
        await mutation.run(
          organizationGovernanceService.updateEmployee,
          editing.id,
          data,
          { role, permissions, label: actorLabel(user, role) }
        );
        setEditing(null);
        retry();
      }
    } catch {
      /* The dialog stays open with the provider's message. */
    }
  };

  const toggleStatus = async (employee, target) => {
    try {
      await mutation.run(
        organizationGovernanceService.updateEmployee,
        employee.id,
        { status: target },
        actorLabel(user, role)
      );
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
        title="Employees"
        description="Boutique staff accounts — created with a capability profile, assigned to a branch, signed in through the shared staff login. Admins create employees only; administrator accounts stay with the Super Admin."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            New Employee
          </Button>
        }
      />

      <div className="mt-6 space-y-5">
        <FilterBar
          searchLabel="Search employees"
          searchPlaceholder="Name, email or role…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "branch",
              label: "Branch",
              value: branchFilter,
              onChange: setBranchFilter,
              options: [
                { value: "all", label: "All branches" },
                ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
              ],
            },
            {
              id: "status",
              label: "Status",
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: "all", label: "Any status" },
                { value: "active", label: "Active" },
                { value: "disabled", label: "Disabled" },
              ],
            },
          ]}
        />

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Employees could not be loaded."
        >
          {visible.length === 0 ? (
            <EmptyState title="No employees match">
              Adjust the search or filters — or clear them to see the whole
              team.
            </EmptyState>
          ) : (
            <Table
              caption="Employee accounts"
              hideCaption
              headers={[
                { label: "Employee" },
                { label: "Branch" },
                { label: "Role" },
                { label: "Capability Profile" },
                { label: "Status" },
                { label: "Actions", align: "right" },
              ]}
            >
              {visible.map((employee) => {
                const meta =
                  EMPLOYEE_STATUS_META[employee.status] ?? EMPLOYEE_STATUS_META.active;
                return (
                  <Table.Row key={employee.id}>
                    <Table.Cell>
                      <button
                        type="button"
                        onClick={() => setEditing(employee)}
                        className="text-left"
                      >
                        <span className="block font-sans text-body-sm font-medium text-text-primary transition-colors duration-200 hover:text-brand-primary">
                          {employee.name}
                        </span>
                        <span className="block font-sans text-caption text-text-muted">
                          {employee.email}
                        </span>
                      </button>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">
                      {employee.branchName ?? "—"}
                    </Table.Cell>
                    <Table.Cell>{employee.role}</Table.Cell>
                    <Table.Cell className="text-text-secondary">
                      {employee.profileName ?? "—"}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(employee)}
                        >
                          {employee.status === "active" ? "Edit" : "View"}
                        </Button>
                        {employee.status === "active" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={mutation.busy}
                            onClick={() => setConfirm({ employee, target: "disabled" })}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mutation.busy}
                            onClick={() => setConfirm({ employee, target: "active" })}
                          >
                            Enable
                          </Button>
                        )}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>
      </div>

      {/* ----- Create / edit --------------------------------------------- */}
      {editing ? (
        <EmployeeFormDialog
          employee={editing === "new" ? null : editing}
          profiles={profiles}
          actorPermissions={permissions}
          branches={branches}
          busy={mutation.busy}
          error={mutation.error}
          onClose={() => setEditing(null)}
          onSubmit={submitEmployee}
        />
      ) : null}

      {/* ----- Disable / enable ------------------------------------------ */}
      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => toggleStatus(confirm.employee, confirm.target)}
        title={
          confirm?.target === "disabled"
            ? `Disable ${confirm?.employee.name}?`
            : `Enable ${confirm?.employee.name}?`
        }
        body={
          confirm?.target === "disabled"
            ? "Their account stays with all its capabilities, but they can no longer sign in. Enable the account again at any time."
            : "Their account is restored and they can sign in through the shared staff login again."
        }
        confirmLabel={confirm?.target === "disabled" ? "Disable Account" : "Enable Account"}
        confirmVariant={confirm?.target === "disabled" ? "danger" : "primary"}
        busy={mutation.busy}
        error={mutation.error}
      />

      {/* ----- One-time credentials handover ------------------------------ */}
      {created ? (
        <Dialog
          open
          onClose={() => setCreated(null)}
          title="Employee Account Created"
          description={`${created.name} · ${created.id}`}
        >
          <p className="font-sans text-body-sm text-text-secondary">
            The account is active and assigned to its branch with the chosen
            capability profile. Hand these credentials over once — the
            employee signs in through the shared staff login.
          </p>
          <dl className="mt-4 space-y-2 border border-border-subtle bg-surface-secondary px-4 py-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-sans text-caption text-text-muted">Email</dt>
              <dd className="font-sans text-body-sm text-text-primary">{created.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-sans text-caption text-text-muted">Temporary password</dt>
              <dd>
                <code className="font-sans text-body-sm text-text-primary">
                  {created.temporaryPassword}
                </code>
              </dd>
            </div>
          </dl>
          {created.capabilities ? (
            <p className="mt-3 font-sans text-caption text-text-muted">
              Capabilities:{" "}
              {describeCapabilities(created.capabilities)
                .map((row) => `${row.label} — ${row.levelLabel}`)
                .join(" · ") || "none granted"}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end">
            <Button size="sm" onClick={() => setCreated(null)}>
              Done
            </Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
