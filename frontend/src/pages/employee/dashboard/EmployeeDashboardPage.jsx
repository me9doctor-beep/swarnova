import PageHeader from "../../../components/layout/PageHeader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";

/**
 * PHASE 1 PLACEHOLDER — proves the Employee route, role boundary, shell and
 * page foundation only. Real counter workflows arrive in later phases.
 */
export default function EmployeeDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[ROLES.EMPLOYEE]}
        title="Counter Operations"
        description="Billing, customer lookup and stock enquiry are composed inside this shell, optimised for speed at the counter."
      />
      <EmptyState className="mt-6" title="No counter workflow is implemented yet">
        The shell, role boundary and navigation are live, so each workflow can
        drop straight in without rebuilding chrome.
      </EmptyState>
    </>
  );
}
