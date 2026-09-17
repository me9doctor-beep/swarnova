import { useState } from "react";
import { Mail, Phone, Store } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import {
  useEmployeeActor,
  useEmployeeProfile,
} from "../../../hooks/useEmployeeOperations.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { employeeOperationsService } from "../../../services/employeeOperationsService.js";
import { EMPLOYEE_STATUS_META } from "../../../features/admin/operations.js";

/**
 * MY PROFILE (Phase 10)
 * -----------------------------------------------------------------------------
 * The employee's own record, read plainly: who they are, which boutique they
 * belong to, the capability profile they were hired into and the capabilities
 * that profile grants them.
 *
 * Only the phone number is self-service. Branch, role, capability profile and
 * account status describe the employee's authority, so they are head-office
 * decisions — shown read-only here and refused by the provider if a request
 * tries to include them.
 */
export default function EmployeeProfilePage() {
  useDocumentTitle("My Profile — Swarnova Employee");

  const actor = useEmployeeActor();
  const { status, data: profile, error, retry } = useEmployeeProfile();
  const mutation = useGovernanceMutation();
  const [editing, setEditing] = useState(false);

  const savePhone = async (patch) => {
    try {
      await mutation.run(employeeOperationsService.updateProfile, actor, patch);
      setEditing(false);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Your record at Swarnova — boutique, role, capability profile and how to reach you."
        actions={
          profile ? (
            <Badge variant={profile.status === "active" ? "success" : "neutral"} dot>
              {EMPLOYEE_STATUS_META[profile.status]?.label ?? profile.status}
            </Badge>
          ) : null
        }
      />

      <AsyncBoundary
        status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
        error={error}
        onRetry={retry}
        errorMessage="Your profile could not be loaded."
        className="mt-6 py-16"
      >
        {profile ? (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ----- Identity --------------------------------------------- */}
            <section
              aria-label="My details"
              className="space-y-5 border border-border-default bg-surface-primary p-panel"
            >
              <h2 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                My Details
              </h2>
              <div>
                <p className="font-serif text-h4 text-text-primary">{profile.name}</p>
                <p className="mt-1 font-sans text-caption text-text-muted">
                  {profile.id} · {profile.title}
                </p>
              </div>
              <ul className="space-y-3 border-t border-border-subtle pt-4">
                <li className="flex items-center gap-2.5 font-sans text-body-sm text-text-secondary">
                  <Mail size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                  {profile.email}
                </li>
                <li className="flex items-center gap-2.5 font-sans text-body-sm text-text-secondary">
                  <Phone size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                  {profile.phone}
                </li>
                <li className="flex items-center gap-2.5 font-sans text-body-sm text-text-secondary">
                  <Store size={14} strokeWidth={1.5} aria-hidden="true" className="shrink-0 text-brand-accent-strong" />
                  {profile.branch.name} · {profile.branch.city}
                </li>
              </ul>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Update Phone
              </Button>
            </section>

            {/* ----- Capability profile ------------------------------------ */}
            <section aria-label="My capability profile" className="space-y-4 lg:col-span-2">
              <h2 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary">
                My Capability Profile
              </h2>
              <div className="border border-border-default bg-surface-primary p-panel">
                <p className="font-sans text-body-sm font-medium text-text-primary">
                  {profile.profile?.name ?? "No profile assigned"}
                </p>
                {profile.profile?.description ? (
                  <p className="mt-2 font-sans text-body-sm text-text-secondary">
                    {profile.profile.description}
                  </p>
                ) : null}
                <p className="mt-3 font-sans text-caption text-text-muted">
                  Set by head office. Speak to your manager if your work needs a
                  different profile.
                </p>
              </div>

              <Table
                caption="Capabilities granted to this account"
                hideCaption
                headers={[{ label: "Capability" }, { label: "Access" }, { label: "Covers" }]}
              >
                {profile.capabilities.map((row) => (
                  <Table.Row key={row.key}>
                    <Table.Cell>
                      <span className="font-sans text-body-sm font-medium text-text-primary">
                        {row.label}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={row.level === "manage" ? "brand" : "neutral"}>
                        {row.levelLabel}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell className="text-caption text-text-muted">
                      {row.level === "manage"
                        ? "View and operate"
                        : "View only"}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table>
            </section>
          </div>
        ) : null}
      </AsyncBoundary>

      {editing && profile ? (
        <UpdatePhoneDialog
          profile={profile}
          onClose={() => setEditing(false)}
          onSave={savePhone}
          busy={mutation.busy}
          error={mutation.error}
        />
      ) : null}
    </>
  );
}

/** The one self-service field — a phone number, validated like any other. */
function UpdatePhoneDialog({ profile, onClose, onSave, busy, error }) {
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [localError, setLocalError] = useState(null);

  const submit = (event) => {
    event.preventDefault();
    setLocalError(null);

    if (!/^[+\d][\d\s-]{7,}$/.test(phone.trim())) {
      setLocalError("Enter a valid phone number.");
      return;
    }
    onSave({ phone: phone.trim() });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Update Phone"
      description="This is the only detail you can change yourself. Your boutique, role and capabilities are managed by head office."
      width="sm"
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Phone number"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+91 94371 00000"
        />

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
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
