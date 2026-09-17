import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useGovernanceCampaigns } from "../../../hooks/useGovernanceContent.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useAuth } from "../../../features/authentication/useAuth.js";
import { useCapability } from "../../../features/authentication/useCapability.js";
import { CAPABILITIES } from "../../../features/authentication/capabilities.js";
import { actorLabel } from "../../../features/authentication/roles.js";
import { contentGovernanceService } from "../../../services/contentGovernanceService.js";
import { CAMPAIGN_STATUS_META } from "../../../features/super-admin/governance.js";
import { formatDate } from "../../../utils/format.js";

/**
 * CAMPAIGN OPERATIONS (Phase 9) — the business view of homepage campaigns.
 *
 * A compact table rather than the Super Admin's governance cards: which
 * campaign is live, when it runs, and the one operational switch — set
 * live / pause. At most one campaign is ever live.
 */
export default function AdminCampaignsPage() {
  useDocumentTitle("Campaigns — Swarnova Admin");

  const { user, role } = useAuth();
  const { can: canDo } = useCapability();
  const { status, data: campaigns, error, retry } = useGovernanceCampaigns();
  const mutation = useGovernanceMutation();
  const [confirm, setConfirm] = useState(null); // { campaign, target }

  const canManage = canDo(CAPABILITIES.CONTENT_MANAGE);

  const changeStatus = async (campaign, target) => {
    try {
      await mutation.run(
        contentGovernanceService.updateCampaignStatus,
        campaign.id,
        target,
        actorLabel(user, role)
      );
      setConfirm(null);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Content"
        title="Campaigns"
        description="Promotional placements on the storefront homepage. One campaign live at a time — setting one live or pausing it is the whole of the operation."
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
              Campaigns are promotional placements on the storefront
              homepage. None exist yet.
            </EmptyState>
          ) : (
            <Table
              caption="Storefront campaigns"
              hideCaption
              headers={[
                { label: "Campaign" },
                { label: "Active Window" },
                { label: "Status" },
                { label: "Placement" },
                { label: "Actions", align: "right" },
              ]}
            >
              {campaigns.map((campaign) => {
                const meta =
                  CAMPAIGN_STATUS_META[campaign.status] ?? CAMPAIGN_STATUS_META.paused;
                return (
                  <Table.Row key={campaign.id}>
                    <Table.Cell>
                      <span className="block font-sans text-body-sm font-medium text-text-primary">
                        {campaign.title}
                      </span>
                      <span className="block font-sans text-caption text-text-muted">
                        {campaign.eyebrow}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-caption text-text-secondary">
                      {formatDate(campaign.activeWindow?.start)} –{" "}
                      {formatDate(campaign.activeWindow?.end)}
                    </Table.Cell>
                    <Table.Cell>
                      <span className="inline-flex items-center gap-2">
                        <Badge variant={meta.variant} dot>
                          {meta.label}
                        </Badge>
                        {campaign.isLive ? (
                          <Badge variant="brand">Live on Homepage</Badge>
                        ) : null}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-caption text-text-secondary">
                      Homepage · Campaign section
                    </Table.Cell>
                    <Table.Cell align="right">
                      {canManage ? (
                        campaign.status === "active" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={mutation.busy}
                            onClick={() => setConfirm({ campaign, target: "paused" })}
                          >
                            Pause
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={mutation.busy}
                            onClick={() => setConfirm({ campaign, target: "active" })}
                          >
                            Set Live
                          </Button>
                        )
                      ) : (
                        <span className="font-sans text-caption text-text-muted">
                          View only
                        </span>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
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
