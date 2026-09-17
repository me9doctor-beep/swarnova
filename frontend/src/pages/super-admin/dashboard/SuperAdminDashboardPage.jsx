import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeIndianRupee,
  Images,
  Megaphone,
  Package,
  ScanFace,
  Store,
  Users,
  WandSparkles,
} from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import StatCard from "../../../components/super-admin/StatCard.jsx";
import { usePlatformOverview } from "../../../hooks/useGovernancePlatform.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";
import { auditActionLabel, auditActionVariant } from "../../../features/super-admin/governance.js";
import { formatDateTime, formatDate } from "../../../utils/format.js";

/**
 * COMMAND CENTRE — the Super Admin's platform overview.
 *
 * Everything on this screen is computed by the provider from canonical
 * state (`getPlatformOverview`) — nothing is a chart, a counter animation
 * or marketing telemetry. It answers, at a glance:
 *
 *   Is the platform healthy?  → status strip
 *   What needs my attention?  → pending governance actions
 *   What exists right now?    → platform summaries
 *   What happened recently?   → recent governance activity
 */
export default function SuperAdminDashboardPage() {
  useDocumentTitle("Command Centre — Swarnova Super Admin");
  const { status, data: overview, error, retry } = usePlatformOverview();

  return (
    <>
      <PageHeader
        eyebrow={ROLE_LABELS[ROLES.SUPER_ADMIN]}
        title="Platform Command Centre"
        description="One command centre for one jewellery platform — catalogue, media, content, organisation and settings, all governed from here."
        actions={
          <Button size="sm" href="/super-admin/products?status=submitted">
            Review Queue
          </Button>
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="The platform overview could not be loaded."
      >
        {overview ? (
          <div className="mt-8 space-y-10">
            {/* ----- Platform status strip ------------------------------- */}
            <section aria-label="Platform status">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <li className="flex items-center justify-between gap-3 border border-border-default bg-surface-primary px-5 py-4">
                  <span className="font-sans text-body-sm text-text-secondary">Storefront</span>
                  <Badge variant={overview.storefront.status === "online" ? "success" : "error"} dot>
                    {overview.storefront.status === "online" ? "Online" : "Offline"}
                  </Badge>
                </li>
                <li className="flex items-center justify-between gap-3 border border-border-default bg-surface-primary px-5 py-4">
                  <span className="font-sans text-body-sm text-text-secondary">AI Jewellery Studio</span>
                  <Badge variant={overview.aiStudio.enabled ? "success" : "neutral"} dot>
                    {overview.aiStudio.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </li>
                <li className="flex items-center justify-between gap-3 border border-border-default bg-surface-primary px-5 py-4">
                  <span className="font-sans text-body-sm text-text-secondary">Virtual Try-On</span>
                  <Badge variant={overview.virtualTryOn.enabled ? "success" : "neutral"} dot>
                    {overview.virtualTryOn.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </li>
                <li className="flex items-center justify-between gap-3 border border-border-default bg-surface-primary px-5 py-4">
                  <span className="font-sans text-body-sm text-text-secondary">Gold Rate Updated</span>
                  <span className="font-sans text-body-sm font-medium text-text-primary">
                    {formatDate(overview.goldRate.updatedAt)}
                  </span>
                </li>
              </ul>
            </section>

            {/* ----- Platform summaries ---------------------------------- */}
            <section aria-label="Platform summaries" className="space-y-4">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                Platform Summaries
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Published Products"
                  value={overview.products.published}
                  icon={Package}
                  detail={`${overview.products.total} total · ${overview.products.drafts} draft${overview.products.drafts === 1 ? "" : "s"}`}
                />
                <StatCard
                  label="Awaiting Review"
                  value={overview.products.inReview}
                  icon={Package}
                  tone={overview.products.inReview > 0 ? "attention" : "default"}
                  detail={
                    overview.products.approved > 0
                      ? `${overview.products.approved} approved, ready to publish`
                      : "Nothing approved and waiting to publish"
                  }
                />
                <StatCard
                  label="Media Assets"
                  value={overview.media.total}
                  icon={Images}
                  tone={overview.media.unused > 0 ? "attention" : "default"}
                  detail={`${overview.media.inUse} in use · ${overview.media.unused} unused`}
                />
                <StatCard
                  label="Active Branches"
                  value={`${overview.branches.active} / ${overview.branches.total}`}
                  icon={Store}
                  tone={overview.branches.disabled > 0 ? "attention" : "default"}
                  detail={
                    overview.branches.disabled > 0
                      ? `${overview.branches.disabled} disabled`
                      : "All boutiques trading"
                  }
                />
                <StatCard
                  label="Administrator Accounts"
                  value={overview.people.activeAdmins}
                  icon={Users}
                  detail={`${overview.people.employees} boutique employees visible to the platform`}
                />
                <StatCard
                  label="Live Campaign"
                  value={overview.campaigns.live > 0 ? "Yes" : "No"}
                  icon={Megaphone}
                  tone={overview.campaigns.live > 0 ? "good" : "attention"}
                  detail={overview.campaigns.liveTitle ?? "No campaign is live on the homepage"}
                />
                <StatCard
                  label="AI Studio Library"
                  value={overview.aiStudio.designLibrary}
                  icon={WandSparkles}
                  detail="Curated concepts the atelier renders from"
                />
                <StatCard
                  label="Try-On Ready Pieces"
                  value={overview.virtualTryOn.eligiblePieces}
                  icon={ScanFace}
                  detail={`${overview.virtualTryOn.samplePortraits} sample portraits in the fitting room`}
                />
              </div>
            </section>

            {/* ----- Attention + activity --------------------------------- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section aria-label="Pending governance actions" className="space-y-4">
                <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                  Needs Your Attention
                </h2>
                {overview.products.inReview === 0 &&
                overview.products.approved === 0 &&
                overview.media.unused === 0 ? (
                  <EmptyState title="Nothing is waiting on you">
                    No products await review, nothing is ready to publish and
                    every media asset is in use. The platform is tidy.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                    {overview.products.inReview > 0 ? (
                      <AttentionRow
                        to="/super-admin/products?status=submitted"
                        label={`${overview.products.inReview} product${overview.products.inReview === 1 ? "" : "s"} waiting in the review queue`}
                        action="Review"
                      />
                    ) : null}
                    {overview.products.approved > 0 ? (
                      <AttentionRow
                        to="/super-admin/products?status=approved"
                        label={`${overview.products.approved} approved product${overview.products.approved === 1 ? "" : "s"} ready to publish`}
                        action="Publish"
                      />
                    ) : null}
                    {overview.products.rejected > 0 ? (
                      <AttentionRow
                        to="/super-admin/products?status=rejected"
                        label={`${overview.products.rejected} rejected product${overview.products.rejected === 1 ? "" : "s"} awaiting revision by an admin`}
                        action="View"
                      />
                    ) : null}
                    {overview.media.unused > 0 ? (
                      <AttentionRow
                        to="/super-admin/media?usage=unused"
                        label={`${overview.media.unused} unused media asset${overview.media.unused === 1 ? "" : "s"} in the library`}
                        action="Tidy Up"
                      />
                    ) : null}
                  </ul>
                )}
              </section>

              <section aria-label="Recent governance activity" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                    Recent Governance Activity
                  </h2>
                  <Link
                    to="/super-admin/audit-logs"
                    className="inline-flex items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                  >
                    Audit Log
                    <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
                  </Link>
                </div>
                <ul className="divide-y divide-border-subtle border border-border-default bg-surface-primary">
                  {overview.recentActivity.map((entry) => (
                    <li key={entry.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Badge variant={auditActionVariant(entry.action)}>
                          {auditActionLabel(entry.action)}
                        </Badge>
                        <span className="font-sans text-body-sm font-medium text-text-primary">
                          {entry.entityLabel ?? entry.entityId}
                        </span>
                        <span className="font-sans text-caption text-text-muted">
                          {formatDateTime(entry.at)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-sans text-caption text-text-secondary">
                        {entry.actor} — {entry.detail}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* ----- Quick actions ---------------------------------------- */}
            <section aria-label="Quick actions" className="border-t border-border-default pt-8">
              <h2 className="sr-only">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" size="sm" href="/super-admin/products/new">
                  New Product Draft
                </Button>
                <Button variant="secondary" size="sm" href="/super-admin/media">
                  Upload Media
                </Button>
                <Button variant="ghost" size="sm" href="/super-admin/gold-rate">
                  <BadgeIndianRupee size={14} strokeWidth={1.5} aria-hidden="true" />
                  Update Gold Rate
                </Button>
                <Button variant="ghost" size="sm" href="/">
                  View Storefront
                </Button>
              </div>
            </section>
          </div>
        ) : null}
      </AsyncBoundary>
    </>
  );
}

function AttentionRow({ to, label, action }) {
  return (
    <li>
      <Link
        to={to}
        className="flex items-center justify-between gap-4 px-5 py-4 transition-colors duration-200 hover:bg-surface-secondary"
      >
        <span className="font-sans text-body-sm text-text-primary">{label}</span>
        <span className="inline-flex shrink-0 items-center gap-1.5 font-sans text-label uppercase tracking-[0.18em] text-brand-primary">
          {action}
          <ArrowRight size={12} strokeWidth={1.5} aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
