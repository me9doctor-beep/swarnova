import PageHeader from "../../../components/layout/PageHeader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";

/**
 * PHASE 1 PLACEHOLDER — proves the Super Admin route, role boundary, shell and
 * page foundation only. Real command-centre modules arrive in later phases.
 */
export default function SuperAdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[ROLES.SUPER_ADMIN]}
        title="Command Centre"
        description="Platform-level control — users, roles, branches, pricing policy and cross-branch analytics — is composed inside this shell."
      />
      <EmptyState className="mt-6" title="No platform module is implemented yet">
        The shell, role boundary and navigation are live, so each platform
        module can drop straight in without rebuilding chrome.
      </EmptyState>
    </>
  );
}
