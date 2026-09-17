import PageHeader from "../../components/layout/PageHeader.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Button from "../../components/ui/Button.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

/**
 * EMPLOYEE NOT FOUND — the console's own fallback for an address that is not
 * part of the employee workspace. It renders inside the shell, so a mistyped
 * or stale link leaves the colleague in their console with a way back rather
 * than on a storefront page (or a silent redirect somewhere unrelated).
 */
export default function EmployeeNotFoundPage() {
  useDocumentTitle("Not Found — Swarnova Employee");

  return (
    <>
      <PageHeader
        eyebrow="My Work"
        title="Not Found"
        description="That address is not part of your workspace."
      />
      <EmptyState
        className="mt-6"
        title="No screen at this address"
        action={
          <Button size="sm" to="/employee">
            Back to Dashboard
          </Button>
        }
      >
        Check the link you followed, or use the navigation to reach the work
        you were looking for.
      </EmptyState>
    </>
  );
}
