import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "../ui/Dialog.jsx";
import Input from "../ui/Input.jsx";
import Select from "../ui/Select.jsx";
import Button from "../ui/Button.jsx";
import {
  CAPABILITY_GROUPS,
  CAPABILITY_LEVELS,
  CAPABILITY_LEVEL_LABELS,
  describeCapabilities,
} from "../../features/authentication/capabilities.js";

/**
 * THE ONE STAFF FORM (Phase 9) — create or edit an employee account.
 *
 * Simple by design: name, email, phone, branch, role title, a capability
 * profile, and — only where genuinely necessary — individual capability
 * adjustments. No wizard, no permission matrix.
 *
 * The capability rows are bounded by the creator's own authority: a level
 * the signed-in account does not hold is never offered, so the UI cannot
 * even ask for a grant the backend would refuse.
 */
export default function EmployeeFormDialog({
  employee,
  profiles,
  actorPermissions,
  branches,
  fixedBranch = null,
  busy,
  error,
  onClose,
  onSubmit,
}) {
  const isNew = !employee;

  /* Phase 14.3 — when the creator's branch DERIVES the employee's branch
     (an Admin creating an employee), the dialog shows the branch as a fixed
     fact instead of a selector: there is nothing to choose, and nothing the
     browser could choose otherwise — the provider derives the assignment
     from the authenticated Admin's own record regardless. */
  const branchSelectable = !fixedBranch;

  /* The actor's own level per capability group — the ceiling for grants. */
  const actorLevels = useMemo(() => {
    const levels = {};
    const wildcard = (actorPermissions ?? []).includes("*");
    for (const group of CAPABILITY_GROUPS) {
      if (wildcard) levels[group.key] = CAPABILITY_LEVELS.MANAGE;
      else if ((actorPermissions ?? []).includes(`${group.key}.manage`))
        levels[group.key] = CAPABILITY_LEVELS.MANAGE;
      else if ((actorPermissions ?? []).includes(`${group.key}.view`))
        levels[group.key] = CAPABILITY_LEVELS.VIEW;
      else levels[group.key] = CAPABILITY_LEVELS.NONE;
    }
    return levels;
  }, [actorPermissions]);

  const grantableGroups = CAPABILITY_GROUPS.filter(
    (group) => actorLevels[group.key] !== CAPABILITY_LEVELS.NONE
  );

  const [form, setForm] = useState(() => ({
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    role: employee?.role ?? "",
    branchId: employee?.branchId ?? "",
    profileId: employee?.profileId ?? "",
    status: employee?.status ?? "active",
    capabilities: { ...(employee?.capabilities ?? {}) },
  }));
  const [localError, setLocalError] = useState(null);

  /* Choosing a profile re-bases the individual adjustments on it. */
  const chooseProfile = (profileId) => {
    const profile = profiles.find((item) => item.id === profileId);
    setForm((prev) => ({
      ...prev,
      profileId,
      capabilities: { ...(profile?.capabilities ?? {}) },
    }));
  };

  const setLevel = (groupKey, level) => {
    setForm((prev) => ({
      ...prev,
      capabilities: { ...prev.capabilities, [groupKey]: level },
    }));
  };

  const summary = describeCapabilities(form.capabilities);

  const submit = (event) => {
    event.preventDefault();
    setLocalError(null);

    if (!form.name.trim()) return setLocalError("The employee's name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      return setLocalError("A valid email address is required.");
    if (!form.phone.trim()) return setLocalError("A phone number is required.");
    if (!form.role.trim())
      return setLocalError("A role title is required — for example, Sales Consultant.");
    if (branchSelectable && !form.branchId)
      return setLocalError("Choose the branch this employee belongs to.");
    if (!form.profileId)
      return setLocalError("Choose the capability profile this employee is hired into.");

    onSubmit({
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      /* A derived branch is NOT sent: the provider assigns the authenticated
         Admin's own branch, and a browser claim never overrides it. */
      ...(branchSelectable ? { branchId: form.branchId } : {}),
      profileId: form.profileId,
      /* New accounts always start active; status changes afterwards are a
         deliberate part of the same record. */
      ...(isNew ? {} : { status: form.status }),
      capabilities: form.capabilities,
    });
  };

  return (
    <Dialog
      open
      onClose={busy ? () => {} : onClose}
      title={isNew ? "New Employee" : `Edit — ${employee.name}`}
      description={
        isNew
          ? "The employee receives an account, a branch and a capability profile, and signs in through the shared staff login."
          : `${employee.id} · account and capability changes take effect at their next sign-in`
      }
      width="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            required
            size="sm"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Role title"
            required
            size="sm"
            value={form.role}
            onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
            hint="For example, Sales Consultant or Boutique Manager."
          />
          <Input
            label="Email address"
            required
            type="email"
            size="sm"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            hint="Used to sign in at the shared staff login."
          />
          <Input
            label="Phone"
            required
            type="tel"
            size="sm"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
          {branchSelectable ? (
            <Select
              label="Branch"
              required
              size="sm"
              value={form.branchId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, branchId: event.target.value }))
              }
            >
              <option value="">Choose a branch…</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </Select>
          ) : (
            <div>
              <span className="mb-1.5 block font-sans text-caption text-text-secondary">
                Branch
              </span>
              <p className="flex h-8 items-center border border-border-subtle bg-surface-secondary px-2.5 font-sans text-body-sm text-text-primary">
                {fixedBranch?.name ?? "—"}
              </p>
              <p className="mt-1 font-sans text-caption text-text-muted">
                Derived from your own branch assignment — it cannot be changed.
              </p>
            </div>
          )}
          <Select
            label="Capability Profile"
            required
            size="sm"
            value={form.profileId}
            onChange={(event) => chooseProfile(event.target.value)}
          >
            <option value="">Choose a profile…</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </Select>
          {!isNew ? (
            <Select
              label="Status"
              size="sm"
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
              hint="Disabled accounts keep their capabilities but cannot sign in."
            >
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </Select>
          ) : null}
        </div>

        {form.profileId ? (
          <p className="border border-border-subtle bg-surface-secondary px-4 py-3 font-sans text-caption text-text-secondary">
            {profiles.find((item) => item.id === form.profileId)?.description}
          </p>
        ) : null}

        {/* Individual capability adjustments — bounded by the creator's own
            authority, hidden entirely for groups they cannot grant. */}
        {grantableGroups.length > 0 ? (
          <fieldset>
            <legend className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
              Capabilities
            </legend>
            <p className="mt-1.5 font-sans text-caption text-text-muted">
              Set by the profile — adjust individually only where genuinely
              needed. You can only grant levels you hold yourself.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {grantableGroups.map((group) => {
                const options = [CAPABILITY_LEVELS.NONE, ...group.levels].filter(
                  (level) =>
                    level === CAPABILITY_LEVELS.NONE ||
                    group.levels.indexOf(level) <= group.levels.indexOf(actorLevels[group.key]) ||
                    actorLevels[group.key] === CAPABILITY_LEVELS.MANAGE
                );
                const value = form.capabilities[group.key] ?? CAPABILITY_LEVELS.NONE;
                return (
                  <div key={group.key} className="flex items-center justify-between gap-3 border border-border-subtle px-3.5 py-2.5">
                    <label
                      htmlFor={`capability-${group.key}`}
                      className="font-sans text-body-sm text-text-primary"
                    >
                      {group.label}
                    </label>
                    <select
                      id={`capability-${group.key}`}
                      value={value}
                      onChange={(event) => setLevel(group.key, event.target.value)}
                      className="h-8 rounded-sm border border-border-default bg-surface-primary px-2 font-sans text-body-sm text-text-primary focus:border-brand-accent"
                    >
                      {options.map((level) => (
                        <option key={level} value={level}>
                          {CAPABILITY_LEVEL_LABELS[level]}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 font-sans text-caption text-text-muted">
              {summary.length > 0
                ? `Grants: ${summary.map((row) => `${row.label} — ${row.levelLabel}`).join(" · ")}`
                : "No capabilities granted yet — the account could sign in but see nothing."}
            </p>
          </fieldset>
        ) : null}

        {(localError || error) && (
          <p
            role="alert"
            className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error"
          >
            {localError ?? error?.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? "Saving…" : isNew ? "Create Employee" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

EmployeeFormDialog.propTypes = {
  /** Omitted for create; the employee record for edit. */
  employee: PropTypes.object,
  profiles: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
  ).isRequired,
  /** The signed-in account's claim list — bounds what can be granted. */
  actorPermissions: PropTypes.arrayOf(PropTypes.string).isRequired,
  branches: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })
  ).isRequired,
  /**
   * When the creator's own branch assigns the employee (an Admin's direct
   * report), the dialog renders the branch as a fixed fact and sends no
   * branchId — the provider derives it from the authenticated Admin.
   */
  fixedBranch: PropTypes.shape({ id: PropTypes.string, name: PropTypes.string }),
  busy: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  onClose: PropTypes.func.isRequired,
  /** Receives the form payload; must reject (throw) on failure. */
  onSubmit: PropTypes.func.isRequired,
};
