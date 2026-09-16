import { ROLE_LABELS, ROLES } from "../../../features/authentication/roles.js";

/**
 * PHASE 0 PLACEHOLDER — proves the Admin route, role boundary, layout and
 * navigation shell only. Real Admin workspaces arrive in later phases.
 */
export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow eyebrow-light">{ROLE_LABELS[ROLES.ADMIN]}</p>
      <h1 className="mt-4 font-serif text-[30px] leading-tight text-ink">
        Admin Workspace
      </h1>
      <p className="mt-4 text-[14.5px] leading-relaxed text-ash">
        This shell is the boundary every Admin module will render inside.
        Catalogue, inventory, orders, customers, campaigns and gold-rate
        workspaces are added in their own phases.
      </p>
      <div className="mt-8 border border-dashed border-line bg-paper px-6 py-8 text-[13px] leading-relaxed text-mist">
        No Admin functionality is implemented in Phase 0. The layout, role
        boundary and route are live so later phases can drop straight in.
      </div>
    </div>
  );
}
