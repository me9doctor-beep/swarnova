import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Store } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useBranchOperations } from "../../../hooks/useAdminOperations.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { formatter } from "../../../components/ui/Price.jsx";

/**
 * BRANCH COORDINATION (Phase 9) — the business relationship with the
 * boutique network.
 *
 * What head office needs per branch: where it is, who runs it, who works
 * there, what stock it holds and what orders are open against it.
 * Platform governance of branches (enabling/disabling) stays with the
 * Super Admin — nothing here duplicates it.
 */
export default function AdminBranchesPage() {
  useDocumentTitle("Branches — Swarnova Admin");

  const { status, data: branches, error, retry } = useBranchOperations();

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Branches"
        description="The boutique network, coordinated from head office — teams, stock and open orders per branch. Platform-level branch governance stays with the Super Admin."
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Branches could not be loaded."
        >
          {!branches || branches.length === 0 ? (
            <EmptyState title="No branches yet">
              The boutique network has no branches registered.
            </EmptyState>
          ) : (
            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Branches">
              {branches.map((branch) => (
                <li
                  key={branch.id}
                  className="flex flex-col border border-border-default bg-surface-primary"
                >
                  {branch.image?.src ? (
                    <img
                      src={branch.image.src}
                      alt={branch.image.alt ?? branch.name}
                      className="aspect-[16/7] w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <Store size={17} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                        <div>
                          <h2 className="font-serif text-h4 text-text-primary">{branch.name}</h2>
                          <p className="font-sans text-caption text-text-muted">
                            {branch.flagship ? "Flagship boutique" : "Boutique"}
                            {branch.managerName ? ` · Managed by ${branch.managerName}` : ""}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={branch.status === "active" ? "success" : "neutral"}
                        dot
                      >
                        {branch.status === "active" ? "Active" : "Disabled"}
                      </Badge>
                    </div>

                    <ul className="space-y-2">
                      <li className="flex items-start gap-2.5 font-sans text-caption text-text-secondary">
                        <MapPin size={13} strokeWidth={1.5} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-accent-strong" />
                        {branch.address}
                      </li>
                      <li className="flex items-center gap-2.5 font-sans text-caption text-text-secondary">
                        <Phone size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                        {branch.phone}
                      </li>
                      <li className="flex items-center gap-2.5 font-sans text-caption text-text-secondary">
                        <Mail size={13} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                        {branch.email}
                      </li>
                    </ul>

                    <dl className="grid grid-cols-3 gap-3 border-t border-border-subtle pt-4">
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">Team</dt>
                        <dd className="mt-1 font-sans text-body-sm font-medium text-text-primary">
                          {branch.activeEmployeeCount} active
                          <span className="block font-sans text-caption font-normal text-text-muted">
                            of {branch.employeeCount} employed
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">Stock</dt>
                        <dd className="mt-1 font-sans text-body-sm font-medium text-text-primary">
                          {branch.inventory.units} units
                          <span className="block font-sans text-caption font-normal text-text-muted">
                            {branch.inventory.lowCount > 0
                              ? `${branch.inventory.lowCount} need restock`
                              : "all healthy"}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="font-sans text-label uppercase text-text-muted">
                          Open Orders
                        </dt>
                        <dd className="mt-1 font-sans text-body-sm font-medium text-text-primary">
                          {branch.openOrders.count}
                          <span className="block font-sans text-caption font-normal text-text-muted">
                            {formatter.format(branch.openOrders.value)}
                          </span>
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-auto flex flex-wrap gap-3 border-t border-border-subtle pt-4">
                      <Link
                        to={`/admin/inventory?branch=${branch.id}`}
                        className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                      >
                        View Inventory
                      </Link>
                      <Link
                        to={`/admin/orders?branch=${branch.id}`}
                        className="font-sans text-label uppercase tracking-[0.18em] text-brand-primary transition-colors duration-200 hover:text-brand-accent-strong"
                      >
                        View Orders
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </div>
    </>
  );
}
