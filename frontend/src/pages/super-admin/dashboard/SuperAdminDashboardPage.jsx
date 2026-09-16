import {
  ROLE_LABELS,
  ROLES,
} from "../../../features/authentication/roles.js";

/**
 * PHASE 0 PLACEHOLDER — proves the Super Admin route, role boundary, layout and
 * navigation shell only. Real command-centre modules arrive in later phases.
 */
export default function SuperAdminDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow eyebrow-light">{ROLE_LABELS[ROLES.SUPER_ADMIN]}</p>
      <h1 className="mt-4 font-serif text-[30px] leading-tight text-ink">
        Command Centre
      </h1>
      <p className="mt-4 text-[14.5px] leading-relaxed text-ash">
        Platform-level control — users, roles, branches, pricing policy and
        cross-branch analytics — will be composed inside this shell.
      </p>
      <div className="mt-8 border border-dashed border-line bg-paper px-6 py-8 text-[13px] leading-relaxed text-mist">
        No Super Admin functionality is implemented in Phase 0. The layout, role
        boundary and route are live so later phases can drop straight in.
      </div>
    </div>
  );
}
