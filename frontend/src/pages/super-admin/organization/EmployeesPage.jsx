import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import { useGovernanceEmployees } from "../../../hooks/useGovernanceOrganization.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { organizationGovernanceService } from "../../../services/organizationGovernanceService.js";
import { ACCOUNT_STATUS_META } from "../../../features/super-admin/governance.js";

/**
 * EMPLOYEE GOVERNANCE — platform-level visibility over boutique staff.
 *
 * Deliberately read-mostly: who works where, in which role, and whether
 * they are active. Operational employee management (hiring, rosters,
 * counter actions) belongs to the Admin and Employee domains — this screen
 * is oversight, not operations.
 */
export default function EmployeesPage() {
  useDocumentTitle("Employees — Swarnova Super Admin");

  const { status, data: employees, error, retry } = useGovernanceEmployees();
  const mutation = useGovernanceMutation();

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

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Employees"
        description="Platform-wide visibility over boutique staff. Day-to-day team management stays with each branch's Admin — this is oversight."
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
    </>
  );
}
