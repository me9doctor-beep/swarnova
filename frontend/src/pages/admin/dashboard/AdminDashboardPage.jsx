import PageHeader from "../../../components/layout/PageHeader.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";

/**
 * PHASE 1 PLACEHOLDER — proves the Admin route, role boundary, shell and page
 * foundation only. Real Admin workspaces arrive in later phases.
 */
export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[ROLES.ADMIN]}
        title="Admin Workspace"
        description="This shell is the boundary every Admin module will render inside. Catalogue, inventory, orders, customers, campaigns and gold-rate workspaces are added in their own phases."
      />
      <EmptyState className="mt-6" title="No Admin module is implemented yet">
        The layout, role boundary, navigation and page header are live, so every
        module can drop straight in without rebuilding chrome.
      </EmptyState>
    </>
  );
}
