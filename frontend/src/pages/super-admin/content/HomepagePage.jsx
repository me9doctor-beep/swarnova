import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import IconButton from "../../../components/ui/IconButton.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Button from "../../../components/ui/Button.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useGovernanceHomepage } from "../../../hooks/useGovernanceContent.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { contentGovernanceService } from "../../../services/contentGovernanceService.js";

/**
 * HOMEPAGE CONTENT GOVERNANCE — structured control over the EXISTING
 * storefront homepage.
 *
 * Every section of the one homepage appears here in storefront order with
 * two simple controls: show/hide, and move up/down. The homepage itself is
 * never redesigned or duplicated — this screen governs its structure only.
 */
export default function HomepagePage() {
  useDocumentTitle("Homepage Content — Swarnova Super Admin");

  const { status, data: homepage, error, retry } = useGovernanceHomepage();
  const mutation = useGovernanceMutation();
  const [confirmDisable, setConfirmDisable] = useState(null); // section awaiting confirmation

  const apply = async (invoke, ...args) => {
    try {
      await mutation.run(invoke, ...args);
      retry();
    } catch {
      /* mutation.error shown below */
    }
  };

  const move = (section, direction) =>
    apply(contentGovernanceService.moveSection, section.id, direction);

  const setEnabled = (section, enabled) =>
    apply(contentGovernanceService.updateSection, section.id, { enabled });

  const sections = homepage?.sections ?? [];
  const visibleCount = sections.filter((section) => section.enabled !== false).length;

  return (
    <>
      <PageHeader
        eyebrow="Content Governance"
        title="Homepage"
        description="The storefront homepage, section by section. Control what is visible and in which order — the design itself stays exactly as the house built it."
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
          <p role="alert" className="mt-6 border border-state-error/30 bg-state-error-soft px-5 py-3 font-sans text-body-sm text-state-error">
            {mutation.error.message}
          </p>
        ) : null}

        {!homepage || sections.length === 0 ? (
          <EmptyState title="No homepage sections" className="mt-6">
            The homepage content model holds no sections to govern.
          </EmptyState>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="font-sans text-caption text-text-muted">
              {visibleCount} of {sections.length} sections visible on the
              storefront homepage.
            </p>
            <ol className="divide-y divide-border-subtle border border-border-default bg-surface-primary" aria-label="Homepage sections in storefront order">
              {sections.map((section) => (
                <li key={section.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-7 shrink-0 text-center font-serif text-h4 text-text-muted">
                    {section.position}
                  </span>
                  <span className="flex shrink-0 flex-col gap-1">
                    <IconButton
                      label={`Move ${section.typeLabel} up`}
                      variant="outline"
                      size="sm"
                      disabled={mutation.busy || section.position === 1}
                      onClick={() => move(section, "up")}
                    >
                      <ArrowUp size={13} strokeWidth={1.5} aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      label={`Move ${section.typeLabel} down`}
                      variant="outline"
                      size="sm"
                      disabled={mutation.busy || section.position === section.totalSections}
                      onClick={() => move(section, "down")}
                    >
                      <ArrowDown size={13} strokeWidth={1.5} aria-hidden="true" />
                    </IconButton>
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
                  <Badge variant={section.enabled !== false ? "success" : "neutral"} dot className="shrink-0">
                    {section.enabled !== false ? "Visible" : "Hidden"}
                  </Badge>
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
