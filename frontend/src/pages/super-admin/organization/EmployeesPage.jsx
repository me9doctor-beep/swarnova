import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import EmployeeFormDialog from "../../../components/admin/EmployeeFormDialog.jsx";
import { useGovernanceEmployees, useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import { useCapabilityProfiles } from "../../../hooks/useAdminOperations.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useAuth } from "../../../features/authentication/useAuth.js";
import { organizationGovernanceService } from "../../../services/organizationGovernanceService.js";
import { ACCOUNT_STATUS_META } from "../../../features/super-admin/governance.js";

/**
 * EMPLOYEE GOVERNANCE — platform-level visibility over boutique staff.
 *
 * Oversight plus the ONE creation path that belongs to the platform owner:
 * since Phase 14.3 the Super Admin creates employees for ANY active branch,
 * and the branch is required. Day-to-day team management stays with each
 * branch's Admin.
 */
export default function EmployeesPage() {
  useDocumentTitle("Employees — Swarnova Super Admin");

  const { status, data: employees, error, retry } = useGovernanceEmployees();
  const mutation = useGovernanceMutation();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  const toggle = async (employee) => {
    try {
      await mutation.run(
        organizationGovernanceService.updateEmployee,
        employee.id,
        { status: employee.status === "active" ? "disabled" : "active" }
      );
      retry();
    } catch {
      /* mutation.error shown below */
    }
  };

  const createEmployee = async (data) => {
    try {
      const result = await mutation.run(organizationGovernanceService.createEmployee, data);
      setCreating(false);
      setCreated(result);
      retry();
    } catch {
      /* The dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Employees"
        description="Platform-wide visibility over boutique staff. Create an employee for any active branch — the branch assignment is required; day-to-day team management stays with each branch's Admin."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            New Employee
          </Button>
        }
      />

      <div className="mt-6">
        {mutation.error ? (
          <p role="alert" className="mb-4 border border-state-error/30 bg-state-error-soft px-5 py-3 font-sans text-body-sm text-state-error">
            {mutation.error.message}
          </p>
        ) : null}

        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Employees could not be loaded."
        >
          {!employees || employees.length === 0 ? (
            <EmptyState title="No employees found">
              No boutique employees are registered with the platform.
            </EmptyState>
          ) : (
            <Table
              caption="Platform employees"
              hideCaption
              headers={[
                { label: "Employee" },
                { label: "Branch" },
                { label: "Role" },
                { label: "Status" },
                { label: "Actions", align: "right" },
              ]}
            >
              {employees.map((employee) => {
                const meta = ACCOUNT_STATUS_META[employee.status] ?? ACCOUNT_STATUS_META.active;
                return (
                  <Table.Row key={employee.id}>
                    <Table.Cell>
                      <span className="block font-sans text-body-sm font-medium text-text-primary">{employee.name}</span>
                      <span className="block font-sans text-caption text-text-muted">{employee.id}</span>
                    </Table.Cell>
                    <Table.Cell className="text-text-secondary">{employee.branchName ?? "—"}</Table.Cell>
                    <Table.Cell>{employee.role}</Table.Cell>
                    <Table.Cell>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <Button
                        variant={employee.status === "active" ? "secondary" : "outline"}
                        size="sm"
                        disabled={mutation.busy}
                        onClick={() => toggle(employee)}
                      >
                        {employee.status === "active" ? "Mark Inactive" : "Mark Active"}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>
      </div>

      {creating ? (
        <SuperAdminEmployeeDialog
          busy={mutation.busy}
          error={mutation.error}
          onClose={() => setCreating(false)}
          onSubmit={createEmployee}
        />
      ) : null}

      {/* The invite handover — the temporary password travels once. */}
      <Dialog
        open={Boolean(created)}
        onClose={() => setCreated(null)}
        title="Employee created"
        description={`${created?.name} joins ${created?.branchName ?? "their branch"}.`}
      >
        <div className="space-y-4">
          <p className="font-sans text-body-sm text-text-secondary">
            Share this temporary password with them for their first sign-in at
            the shared staff login. It is shown once.
          </p>
          <p className="border border-border-subtle bg-surface-secondary px-4 py-3 font-mono text-body-sm text-text-primary">
            {created?.temporaryPassword}
          </p>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreated(null)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Create dialog — the shared staff form with a REQUIRED branch            */
/* ---------------------------------------------------------------------- */

function SuperAdminEmployeeDialog({ busy, error, onClose, onSubmit }) {
  const { permissions } = useAuth();
  const profilesAsync = useCapabilityProfiles();
  const branchesAsync = useGovernanceBranches();

  return (
    <EmployeeFormDialog
      profiles={profilesAsync.data ?? []}
      actorPermissions={permissions ?? []}
      branches={branchesAsync.data ?? []}
      busy={busy}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
