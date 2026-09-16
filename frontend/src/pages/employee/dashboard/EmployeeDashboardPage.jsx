import {
  ROLE_LABELS,
  ROLES,
} from "../../../features/authentication/roles.js";

/**
 * PHASE 0 PLACEHOLDER — proves the Employee route, role boundary, layout and
 * navigation shell only. Real counter workflows arrive in later phases.
 */
export default function EmployeeDashboardPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow eyebrow-light">{ROLE_LABELS[ROLES.EMPLOYEE]}</p>
      <h1 className="mt-4 font-serif text-[30px] leading-tight text-ink">
        Counter Operations
      </h1>
      <p className="mt-4 text-[14.5px] leading-relaxed text-ash">
        Billing, customer lookup and stock enquiry will be composed inside this
        shell, optimised for speed at the counter.
      </p>
      <div className="mt-8 border border-dashed border-line bg-paper px-6 py-8 text-[13px] leading-relaxed text-mist">
        No Employee functionality is implemented in Phase 0. The layout, role
        boundary and route are live so later phases can drop straight in.
      </div>
    </div>
  );
}
