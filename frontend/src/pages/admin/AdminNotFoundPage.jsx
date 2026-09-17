import PageHeader from "../../components/layout/PageHeader.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Button from "../../components/ui/Button.jsx";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";

/**
 * ADMIN NOT FOUND (Phase 13.5)
 * ----------------------------------------------------------------------------
 * Console fallback for unmatched URLs within the `/admin/*` hierarchy.
 * Renders inside the Admin shell, keeping navigation, topbar and breadcrumbs
 * intact rather than ejecting the administrator to the customer storefront.
 */
export default function AdminNotFoundPage() {
  useDocumentTitle("Not Found — Swarnova Admin");

  return (
    <>
      <PageHeader
        eyebrow="Business Operations"
        title="Not Found"
        description="That address is not part of the Admin workspace."
      />
      <EmptyState
        className="mt-6"
        title="No screen at this address"
        action={
          <Button size="sm" to="/admin">
            Back to Overview
          </Button>
        }
      >
        Check the link you followed, or use the navigation to reach the operational surface you need.
      </EmptyState>
    </>
  );
}
