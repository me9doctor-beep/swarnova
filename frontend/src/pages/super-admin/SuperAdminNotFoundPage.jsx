import PageHeader from "../../components/layout/PageHeader.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Button from "../../components/ui/Button.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

/**
 * SUPER ADMIN NOT FOUND (Phase 13.5)
 * ----------------------------------------------------------------------------
 * Console fallback for unmatched URLs within the `/super-admin/*` hierarchy.
 * Renders inside the Super Admin shell with global governance chrome and
 * breadcrumbs intact rather than ejecting the user to the storefront.
 */
export default function SuperAdminNotFoundPage() {
  useDocumentTitle("Not Found — Swarnova Super Admin");

  return (
    <>
      <PageHeader
        eyebrow="Platform Governance"
        title="Not Found"
        description="That address is not part of the Super Admin workspace."
      />
      <EmptyState
        className="mt-6"
        title="No screen at this address"
        action={
          <Button size="sm" to="/super-admin">
            Back to Command Centre
          </Button>
        }
      >
        Check the link you followed, or use the governance navigation to reach the module you need.
      </EmptyState>
    </>
  );
}
