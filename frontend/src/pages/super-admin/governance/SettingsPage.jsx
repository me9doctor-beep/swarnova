import { useEffect, useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Checkbox from "../../../components/ui/Checkbox.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { usePlatformSettings } from "../../../hooks/useGovernancePlatform.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { platformGovernanceService } from "../../../services/platformGovernanceService.js";

/**
 * PLATFORM SETTINGS — the small set of switches a Super Admin owns.
 *
 * Storefront availability, feature availability (AI Studio / Virtual
 * Try-On), default currency and the support contact. Infrastructure
 * configuration — databases, keys, secrets, endpoints — never appears here:
 * that is an engineering surface, not a governance one.
 */
export default function SettingsPage() {
  useDocumentTitle("Settings — Swarnova Super Admin");

  const { status, data: settings, error, retry } = usePlatformSettings();
  const mutation = useGovernanceMutation();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === "success" && settings && !form) {
      setForm({
        storefrontStatus: settings.storefront.status,
        aiStudio: settings.features.aiStudio.enabled,
        virtualTryOn: settings.features.virtualTryOn.enabled,
        defaultCurrency: settings.commerce.defaultCurrency,
        supportEmail: settings.commerce.supportEmail,
      });
    }
  }, [status, settings, form]);

  const save = async (event) => {
    event.preventDefault();
    setSaved(false);
    try {
      await mutation.run(platformGovernanceService.updateSettings, {
        storefront: { status: form.storefrontStatus },
        features: {
          aiStudio: { enabled: form.aiStudio },
          virtualTryOn: { enabled: form.virtualTryOn },
        },
        commerce: {
          defaultCurrency: form.defaultCurrency,
          supportEmail: form.supportEmail,
        },
      });
      setSaved(true);
      retry();
    } catch {
      /* mutation.error shown below */
    }
  };

  const dirty =
    settings &&
    form &&
    (form.storefrontStatus !== settings.storefront.status ||
      form.aiStudio !== settings.features.aiStudio.enabled ||
      form.virtualTryOn !== settings.features.virtualTryOn.enabled ||
      form.supportEmail !== settings.commerce.supportEmail ||
      form.defaultCurrency !== settings.commerce.defaultCurrency);

  return (
    <>
      <PageHeader
        eyebrow="Platform Governance"
        title="Platform Settings"
        description="The platform's operating switches. Everything here is reversible and recorded in the audit trail."
      />

      <div className="mt-6 max-w-3xl">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Platform settings could not be loaded."
        >
          {form ? (
            <form onSubmit={save} className="space-y-6">
              {saved ? (
                <p role="status" className="border border-state-success/30 bg-state-success-soft px-5 py-3 font-sans text-body-sm text-state-success">
                  Settings saved. Changes take effect across the platform immediately.
                </p>
              ) : null}
              {mutation.error ? (
                <p role="alert" className="border border-state-error/30 bg-state-error-soft px-5 py-3 font-sans text-body-sm text-state-error">
                  {mutation.error.message}
                </p>
              ) : null}

              <section aria-label="Storefront availability" className="space-y-4 border border-border-default bg-surface-primary p-panel">
                <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                  Storefront Availability
                </h2>
                <Select
                  label="Storefront Status"
                  size="sm"
                  value={form.storefrontStatus}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, storefrontStatus: event.target.value }))
                  }
                  hint={
                    form.storefrontStatus === "offline"
                      ? "Recorded for the platform. A customer maintenance notice is not enforced in this release — browse and shop remain available."
                      : "Customers can browse and shop normally."
                  }
                >
                  <option value="online">Online — trading normally</option>
                  <option value="offline">Offline — maintenance</option>
                </Select>
              </section>

              <section aria-label="Feature availability" className="space-y-4 border border-border-default bg-surface-primary p-panel">
                <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                  Feature Availability
                </h2>
                <div className="space-y-2">
                  <Checkbox
                    label="AI Jewellery Studio"
                    description="The homepage AI feature and the /ai-studio atelier."
                    checked={form.aiStudio}
                    onChange={(event) => setForm((prev) => ({ ...prev, aiStudio: event.target.checked }))}
                  />
                  <Checkbox
                    label="Virtual Try-On"
                    description="The homepage feature and the /virtual-try-on fitting room."
                    checked={form.virtualTryOn}
                    onChange={(event) => setForm((prev) => ({ ...prev, virtualTryOn: event.target.checked }))}
                  />
                </div>
              </section>

              <section aria-label="Commerce preferences" className="space-y-4 border border-border-default bg-surface-primary p-panel">
                <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                  Commerce Preferences
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Default Currency"
                    size="sm"
                    value={form.defaultCurrency}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, defaultCurrency: event.target.value }))
                    }
                  >
                    <option value="INR">INR — Indian Rupee</option>
                  </Select>
                  <Input
                    label="Support Email"
                    type="email"
                    size="sm"
                    value={form.supportEmail}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, supportEmail: event.target.value }))
                    }
                  />
                </div>
              </section>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={mutation.busy}
                  onClick={() => {
                    setForm(null);
                    retry();
                  }}
                >
                  Reset
                </Button>
                <Button type="submit" size="sm" disabled={mutation.busy || !dirty}>
                  {mutation.busy ? "Saving…" : "Save Settings"}
                </Button>
              </div>
            </form>
          ) : null}
        </AsyncBoundary>
      </div>
    </>
  );
}
