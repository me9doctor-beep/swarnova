import { Outlet, Link } from "react-router-dom";
import Container from "../../../components/ui/Container.jsx";
import Eyebrow from "../../../components/ui/Eyebrow.jsx";
import AccountNavigation from "../../../components/account/AccountNavigation.jsx";
import { useCustomerProfile } from "../../../hooks/useCustomerProfile.js";
import { Mail, Phone, ShieldCheck } from "lucide-react";

/**
 * CUSTOMER ACCOUNT LAYOUT — the luxury salon experience at `/account/*`.
 *
 * Designed as an editorial digital jewellery house rather than an admin dashboard:
 * - Spacious masthead with official "SWARNOVA by MediXO" brand attribution
 * - Desktop: Refined side navigation beside the active view
 * - Mobile: Thumb-friendly horizontal navigation bar
 * - Personal Concierge support block
 */
export default function AccountLayout() {
  const { profile } = useCustomerProfile();

  const customerName = profile?.name ?? "Valued Client";
  const tier = profile?.tier ?? "Swarnova Privé";

  return (
    <div className="bg-surface-secondary/40 pb-20 pt-[132px] sm:pb-28 sm:pt-[152px] lg:pt-[168px]">
      <Container>
        {/* Salon Masthead */}
        <div className="border-b border-border-default pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Eyebrow tone="gold" className="tracking-[0.3em]">
                  SWARNOVA by MediXO
                </Eyebrow>
                <span className="text-border-default">·</span>
                <span className="font-sans text-label uppercase tracking-[0.2em] text-text-muted">
                  Client Salon
                </span>
              </div>
              <h1 className="mt-2 font-serif text-h2 font-medium text-text-primary sm:text-h1">
                My Swarnova
              </h1>
              <p className="mt-1 font-serif text-body italic text-text-secondary">
                Welcome, {customerName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 border border-brand-accent/35 bg-surface-primary px-3 py-1 font-sans text-label uppercase tracking-[0.2em] text-brand-accent-strong">
                <ShieldCheck size={14} className="text-brand-accent" aria-hidden="true" />
                {tier}
              </span>
              <span className="font-sans text-caption text-text-muted">
                Demo Account Mode
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="py-6 lg:hidden">
          <AccountNavigation />
        </div>

        {/* Main Workspace: Desktop 2-column layout */}
        <div className="mt-8 grid items-start gap-10 lg:mt-12 lg:grid-cols-[240px_1fr] lg:gap-12 xl:grid-cols-[260px_1fr] xl:gap-16">
          {/* Side Navigation Rail */}
          <aside className="hidden space-y-8 lg:block">
            <div className="border border-border-default bg-surface-primary p-4">
              <p className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-text-muted pb-3 mb-2 border-b border-border-default">
                Atelier Navigation
              </p>
              <AccountNavigation />
            </div>

            {/* Atelier Concierge Box */}
            <div className="border border-border-default bg-surface-primary p-5">
              <p className="font-sans text-label uppercase tracking-[0.24em] text-brand-accent-strong">
                Private Concierge
              </p>
              <p className="mt-2 font-serif text-body-sm leading-relaxed text-text-secondary">
                For bespoke commissions, private viewing appointments, or styling consultations:
              </p>
              <div className="mt-4 space-y-2 border-t border-border-default pt-3 text-caption text-text-secondary">
                <p className="flex items-center gap-2">
                  <Phone size={12} className="text-brand-accent-strong" aria-hidden="true" />
                  <a href="tel:+916742001234" className="hover:text-brand-primary">
                    +91 674 200 1234
                  </a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail size={12} className="text-brand-accent-strong" aria-hidden="true" />
                  <a href="mailto:care@swarnova.in" className="hover:text-brand-primary">
                    care@swarnova.in
                  </a>
                </p>
              </div>
            </div>
          </aside>

          {/* Active Screen Area */}
          <section className="min-w-0" aria-label="Customer account section">
            <Outlet />
          </section>
        </div>
      </Container>
    </div>
  );
}
