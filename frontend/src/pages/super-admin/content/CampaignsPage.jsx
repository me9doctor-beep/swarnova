import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useGovernanceCampaigns } from "../../../hooks/useGovernanceContent.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { contentGovernanceService } from "../../../services/contentGovernanceService.js";
import { CAMPAIGN_STATUS_META } from "../../../features/super-admin/governance.js";
import { formatDate } from "../../../utils/format.js";

/**
 * MARKETING GOVERNANCE — campaigns and their homepage placement.
 *
 * At most one campaign is live at a time (the homepage renders exactly one
 * active campaign within its window). Setting a campaign live pauses the
 * visual gap until its window opens; pausing removes it from the homepage.
 * No automation, no scheduling engine — an explicit switch.
 */
export default function CampaignsPage() {
  useDocumentTitle("Campaigns — Swarnova Super Admin");

  const { status, data: campaigns, error, retry } = useGovernanceCampaigns();
  const mutation = useGovernanceMutation();
  const [confirm, setConfirm] = useState(null); // { campaign, target }

  const changeStatus = async (campaign, target) => {
    try {
      await mutation.run(contentGovernanceService.updateCampaignStatus, campaign.id, target);
      setConfirm(null);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Marketing Governance"
        title="Campaigns"
        description="Promotional placements on the storefront homepage. One campaign live at a time — always a deliberate choice."
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Campaigns could not be loaded."
        >
          {!campaigns || campaigns.length === 0 ? (
            <EmptyState title="No campaigns yet">
              Campaigns are promotional placements that appear in the
              homepage's campaign section. None exist yet.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Campaigns">
              {campaigns.map((campaign) => {
                const meta = CAMPAIGN_STATUS_META[campaign.status] ?? CAMPAIGN_STATUS_META.paused;
                return (
                  <li key={campaign.id} className="flex flex-col border border-border-default bg-surface-primary">
                    <div className="relative overflow-hidden bg-surface-secondary">
                      <img
                        src={campaign.image?.src}
                        alt={campaign.image?.alt ?? campaign.title}
                        className="aspect-[16/9] w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute left-4 top-4 flex gap-2">
                        <Badge variant={meta.variant} dot>
                          {meta.label}
                        </Badge>
                        {campaign.isLive ? <Badge variant="brand">Live on Homepage</Badge> : null}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div>
                        <p className="font-sans text-label uppercase tracking-[0.22em] text-brand-accent-strong">
                          {campaign.eyebrow}
                        </p>
                        <h2 className="mt-2 font-serif text-h3 text-text-primary">{campaign.title}</h2>
                      </div>
                      <p className="font-sans text-body-sm text-text-secondary">{campaign.body}</p>
                      <dl className="mt-auto space-y-0 border-t border-border-subtle pt-3">
                        <div className="flex items-baseline justify-between gap-4 py-1.5">
                          <dt className="font-sans text-label uppercase text-text-muted">Active Window</dt>
                          <dd className="font-sans text-caption text-text-primary">
                            {formatDate(campaign.activeWindow?.start)} – {formatDate(campaign.activeWindow?.end)}
                          </dd>
                        </div>
                        <div className="flex items-baseline justify-between gap-4 py-1.5">
                          <dt className="font-sans text-label uppercase text-text-muted">Placement</dt>
                          <dd className="font-sans text-caption text-text-primary">Homepage · Campaign section</dd>
                        </div>
                      </dl>
                      <div className="flex justify-end border-t border-border-subtle pt-4">
                        {campaign.status === "active" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirm({ campaign, target: "paused" })}
                          >
                            Pause Campaign
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirm({ campaign, target: "active" })}
                          >
                            Set Live
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </AsyncBoundary>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => changeStatus(confirm.campaign, confirm.target)}
        title={
          confirm?.target === "active"
            ? `Set “${confirm.campaign.title}” live?`
            : `Pause “${confirm?.campaign.title}”?`
        }
        body={
          confirm?.target === "active"
            ? "The campaign appears in the homepage campaign section for every customer, within its active window."
            : "The campaign disappears from the homepage immediately. Its settings are kept — set it live again any time."
        }
        confirmLabel={confirm?.target === "active" ? "Set Live" : "Pause Campaign"}
        confirmVariant={confirm?.target === "active" ? "primary" : "secondary"}
        busy={mutation.busy}
        error={mutation.error}
      />
    </>
  );
}
