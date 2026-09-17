import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Button from "../../../components/ui/Button.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useGovernanceHomepage } from "../../../hooks/useGovernanceContent.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useAuth } from "../../../features/authentication/useAuth.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { actorLabel } from "../../../features/authentication/roles.js";
import { contentGovernanceService } from "../../../services/contentGovernanceService.js";

/**
 * HOMEPAGE CONTENT OPERATIONS (Phase 9) — the storefront homepage from
 * the business side.
 *
 * Head office sees every section in storefront order and controls what is
 * visible. Section composition and reordering stay with the Super Admin
 * content governance screen — this is day-to-day visibility, not structure.
 */
export default function AdminHomepagePage() {
  useDocumentTitle("Homepage — Swarnova Admin");

  const { user, role } = useAuth();
  const { can: canDo } = useCapability();
  const { status, data: homepage, error, retry } = useGovernanceHomepage();
  const mutation = useGovernanceMutation();
  const [confirmDisable, setConfirmDisable] = useState(null);

  const canManage = canDo(CAPABILITIES.CONTENT_MANAGE);

  const setEnabled = async (section, enabled) => {
    try {
      await mutation.run(
        contentGovernanceService.updateSection,
        section.id,
        { enabled },
        actorLabel(user, role)
      );
      retry();
    } catch {
      /* mutation.error shown below */
    }
  };

  const sections = homepage?.sections ?? [];
  const visibleCount = sections.filter((section) => section.enabled !== false).length;

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Homepage"
        description="The storefront homepage, section by section. Show or hide sections as the business needs — composition and ordering stay with platform content governance."
        actions={
          <Button variant="secondary" size="sm" href="/">
            Preview Storefront
          </Button>
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="The homepage structure could not be loaded."
        className="mt-6"
      >
        {mutation.error ? (
          <p
            role="alert"
            className="mt-6 border border-state-error/30 bg-state-error-soft px-5 py-3 font-sans text-body-sm text-state-error"
          >
            {mutation.error.message}
          </p>
        ) : null}

        {!homepage || sections.length === 0 ? (
          <EmptyState title="No homepage sections" className="mt-6">
            The homepage content model holds no sections.
          </EmptyState>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="font-sans text-caption text-text-muted">
              {visibleCount} of {sections.length} sections visible on the
              storefront homepage.
            </p>
            <ol
              className="divide-y divide-border-subtle border border-border-default bg-surface-primary"
              aria-label="Homepage sections in storefront order"
            >
              {sections.map((section) => (
                <li key={section.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-7 shrink-0 text-center font-serif text-h4 text-text-muted">
                    {section.position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-sans text-body-sm font-medium text-text-primary">
                      {section.typeLabel}
                    </span>
                    {section.content?.eyebrow || section.content?.title?.lines ? (
                      <span className="block truncate font-sans text-caption text-text-muted">
                        {section.content.eyebrow ??
                          section.content.title.lines.map((line) => line.text).join(" ")}
                      </span>
                    ) : null}
                  </span>
                  <Badge
                    variant={section.enabled !== false ? "success" : "neutral"}
                    dot
                    className="shrink-0"
                  >
                    {section.enabled !== false ? "Visible" : "Hidden"}
                  </Badge>
                  {canManage ? (
                    <Button
                      variant={section.enabled !== false ? "secondary" : "outline"}
                      size="sm"
                      className="shrink-0"
                      disabled={mutation.busy}
                      onClick={() =>
                        section.enabled !== false
                          ? setConfirmDisable(section)
                          : setEnabled(section, true)
                      }
                    >
                      {section.enabled !== false ? "Hide" : "Show"}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={Boolean(confirmDisable)}
        onClose={() => setConfirmDisable(null)}
        onConfirm={async () => {
          await setEnabled(confirmDisable, false);
          setConfirmDisable(null);
        }}
        title={confirmDisable ? `Hide “${confirmDisable.typeLabel}”?` : ""}
        body="The section is hidden from the customer homepage immediately. Nothing is deleted — showing it again restores it in place."
        confirmLabel="Hide Section"
        confirmVariant="primary"
        busy={mutation.busy}
        error={mutation.error}
      />
    </>
  );
}
