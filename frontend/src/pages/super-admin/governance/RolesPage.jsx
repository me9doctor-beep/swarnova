import { ShieldCheck } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import { useGovernanceAdmins, useGovernanceEmployees } from "../../../hooks/useGovernanceOrganization.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from "../../../features/authentication/permissions.js";
import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";

/**
 * ROLES & PERMISSIONS — the platform's permission surface, read plainly.
 *
 * One card per experience role with the exact claims a session of that role
 * carries. The map lives in `features/authentication/permissions.js` — this
 * screen renders it, it never redefines it. Frontend permissions are a UX
 * boundary only; the backend remains the authorization authority.
 */
export default function RolesPage() {
  useDocumentTitle("Roles & Permissions — Swarnova Super Admin");

  const admins = useGovernanceAdmins();
  const employees = useGovernanceEmployees();

  const peopleCount = {
    [ROLES.SUPER_ADMIN]: "You",
    [ROLES.ADMIN]: `${(admins.data ?? []).filter((a) => a.status === "active").length} active accounts`,
    [ROLES.EMPLOYEE]: `${(employees.data ?? []).filter((e) => e.status === "active").length} active accounts`,
    [ROLES.CUSTOMER]: "Every storefront visitor",
  };

  const displayOrder = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.CUSTOMER];

  return (
    <>
      <PageHeader
        eyebrow="Platform Governance"
        title="Roles & Permissions"
        description="What each experience role is allowed to do. Permission keys follow the contract the backend will issue — frontend checks are navigation cues, never security."
      />

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {displayOrder.map((role) => {
          const claims = ROLE_PERMISSIONS[role] ?? [];
          return (
            <section
              key={role}
              aria-label={`${ROLE_LABELS[role]} role`}
              className="flex flex-col border border-border-default bg-surface-primary p-panel"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-10 w-10 items-center justify-center border border-border-default bg-surface-secondary text-brand-accent-strong">
                  <ShieldCheck size={19} strokeWidth={1.4} aria-hidden="true" />
                </span>
                <Badge variant={role === ROLES.SUPER_ADMIN ? "brand" : "neutral"}>
                  {peopleCount[role]}
                </Badge>
              </div>

              <h2 className="mt-4 font-serif text-h3 text-text-primary">{ROLE_LABELS[role]}</h2>
              <p className="mt-2 font-sans text-body-sm text-text-secondary">{ROLE_DESCRIPTIONS[role]}</p>

              <h3 className="mt-5 font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                Permission Claims
              </h3>
              {claims.includes("*") ? (
                <p className="mt-3 border border-brand-accent/35 bg-surface-muted px-4 py-3 font-sans text-body-sm text-text-primary">
                  <span className="font-medium">“*” — full platform access.</span>{" "}
                  Every permission in the catalogue, granted by the platform root role.
                </p>
              ) : claims.length === 0 ? (
                <p className="mt-3 font-sans text-body-sm text-text-muted">
                  No console permissions. The customer experience needs no claims.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {claims.map((claim) => (
                    <li key={claim}>
                      <code className="inline-block border border-border-default bg-surface-secondary px-2.5 py-1 font-sans text-caption text-text-primary">
                        {claim}
                      </code>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
