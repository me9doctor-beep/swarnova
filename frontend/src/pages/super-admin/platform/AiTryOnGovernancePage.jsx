import { ScanFace, WandSparkles } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Checkbox from "../../../components/ui/Checkbox.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { usePlatformOverview, usePlatformSettings } from "../../../hooks/useGovernancePlatform.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { platformGovernanceService } from "../../../services/platformGovernanceService.js";

/**
 * AI & TRY-ON GOVERNANCE — high-level platform visibility over the two
 * intelligent features.
 *
 * What this is: feature availability, activity summaries and the storefront
 * links. What it is not: model management — there is no training, no model
 * selection, no inference configuration and no API keys here, by design.
 */
export default function AiTryOnGovernancePage() {
  useDocumentTitle("AI & Try-On — Swarnova Super Admin");

  const overview = usePlatformOverview();
  const settings = usePlatformSettings();
  const mutation = useGovernanceMutation();

  const toggle = async (feature, enabled) => {
    try {
      await mutation.run(platformGovernanceService.updateSettings, {
        features: { [feature]: { enabled } },
      });
      settings.retry();
      overview.retry();
    } catch {
      /* mutation.error shown below */
    }
  };

  const snapshot = overview.data;
  const current = settings.data;

  return (
    <>
      <PageHeader
        eyebrow="Platform Governance"
        title="AI Studio & Virtual Try-On"
        description="Platform-level visibility over the intelligent features — availability and activity. Model infrastructure is governed at the service level, never from this console."
      />

      <AsyncBoundary
        status={
          overview.status === "loading" || settings.status === "loading"
            ? "loading"
            : overview.status === "error" || settings.status === "error"
              ? "error"
              : "success"
        }
        error={overview.error ?? settings.error}
        onRetry={() => {
          overview.retry();
          settings.retry();
        }}
        errorMessage="The feature governance view could not be loaded."
      >
        {mutation.error ? (
          <p role="alert" className="mt-6 border border-state-error/30 bg-state-error-soft px-5 py-3 font-sans text-body-sm text-state-error">
            {mutation.error.message}
          </p>
        ) : null}

        {snapshot && current ? (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FeaturePanel
              icon={WandSparkles}
              name="AI Jewellery Studio"
              storeHref="/ai-studio"
              storeLabel="Open AI Studio"
              enabled={current.features.aiStudio.enabled}
              busy={mutation.busy}
              onToggle={(enabled) => toggle("aiStudio", enabled)}
              stats={[
                { label: "Concept Library", value: snapshot.aiStudio.designLibrary },
                { label: "Where it Serves", value: "Homepage · /ai-studio" },
              ]}
              description="Customers describe a piece in everyday words and the atelier renders a photorealistic 22K gold concept for refinement."
            />
            <FeaturePanel
              icon={ScanFace}
              name="Virtual Try-On"
              storeHref="/virtual-try-on"
              storeLabel="Open the Fitting Room"
              enabled={current.features.virtualTryOn.enabled}
              busy={mutation.busy}
              onToggle={(enabled) => toggle("virtualTryOn", enabled)}
              stats={[
                { label: "Try-On Ready Pieces", value: snapshot.virtualTryOn.eligiblePieces },
                { label: "Sample Portraits", value: snapshot.virtualTryOn.samplePortraits },
              ]}
              description="The digital fitting room dresses a customer's portrait in published, try-on-eligible pieces with true-to-life placement."
            />
          </div>
        ) : null}
      </AsyncBoundary>

      <p className="mt-8 max-w-2xl border border-border-default bg-surface-primary px-5 py-4 font-sans text-caption text-text-muted">
        These switches control feature availability across the platform.
        Model configuration, inference infrastructure and provider credentials
        are deliberately outside the scope of platform governance.
      </p>
    </>
  );
}

function FeaturePanel({
  icon: Icon,
  name,
  description,
  storeHref,
  storeLabel,
  enabled,
  busy,
  onToggle,
  stats,
}) {
  return (
    <section aria-label={name} className="flex flex-col border border-border-default bg-surface-primary p-panel">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center border border-border-default bg-surface-secondary text-brand-accent-strong">
          <Icon size={19} strokeWidth={1.4} aria-hidden="true" />
        </span>
        <Badge variant={enabled ? "success" : "neutral"} dot>
          {enabled ? "Enabled" : "Disabled"}
        </Badge>
      </div>

      <h2 className="mt-4 font-serif text-h3 text-text-primary">{name}</h2>
      <p className="mt-2 font-sans text-body-sm text-text-secondary">{description}</p>

      <dl className="mt-5 space-y-0">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-2">
            <dt className="font-sans text-label uppercase tracking-[0.16em] text-text-muted">{stat.label}</dt>
            <dd className="font-sans text-body-sm text-text-primary">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <Checkbox
          label={`Available to customers`}
          description={
            enabled
              ? "The feature is live on the storefront right now."
              : "The feature is hidden from the storefront until re-enabled."
          }
          checked={enabled}
          disabled={busy}
          onChange={(event) => onToggle(event.target.checked)}
        />
      </div>

      <div className="mt-5 border-t border-border-subtle pt-4">
        <Button variant="ghost" size="sm" href={storeHref}>
          {storeLabel}
        </Button>
      </div>
    </section>
  );
}
