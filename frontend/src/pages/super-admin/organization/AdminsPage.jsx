import { useState } from "react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import Table from "../../../components/ui/Table.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useGovernanceAdmins, useGovernanceBranches } from "../../../hooks/useGovernanceOrganization.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { organizationGovernanceService } from "../../../services/organizationGovernanceService.js";
import { ACCOUNT_STATUS_META } from "../../../features/super-admin/governance.js";

/**
 * ADMIN MANAGEMENT — the platform's administrator directory.
 *
 * Since Phase 14.3 every administrator runs exactly ONE boutique: a branch
 * assignment is a required identity attribute, and the Super Admin is the
 * only global authority. The Super Admin creates branch administrators,
 * reassigns their branch and enables / disables access. Authentication
 * itself belongs to the backend, later.
 */
export default function AdminsPage() {
  useDocumentTitle("Admins — Swarnova Super Admin");

  const { status, data: admins, error, retry } = useGovernanceAdmins();
  const mutation = useGovernanceMutation();
  const [editing, setEditing] = useState(null); // admin | "new" | null
  const [confirm, setConfirm] = useState(null); // { admin, target }

  const changeStatus = async (admin, target) => {
    try {
      await mutation.run(organizationGovernanceService.updateAdmin, admin.id, { status: target });
      setConfirm(null);
      retry();
    } catch {
      /* Dialog stays open with the provider's message. */
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Admins"
        description="The administrators who run the platform day to day — who they are, what they manage, and whether their access is active."
        actions={
          <Button size="sm" onClick={() => setEditing("new")}>
            New Admin
          </Button>
        }
      />

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="Administrators could not be loaded."
        >
          {!admins || admins.length === 0 ? (
            <EmptyState title="No administrators yet">Create the first administrator account for the platform.</EmptyState>
          ) : (
            <Table
              caption="Platform administrators"
              hideCaption
              headers={[
                { label: "Admin" },
                { label: "Branch" },
                { label: "Role" },
                { label: "Status" },
                { label: "Actions", align: "right" },
              ]}
            >
              {admins.map((admin) => {
                const meta = ACCOUNT_STATUS_META[admin.status] ?? ACCOUNT_STATUS_META.active;
                return (
                  <Table.Row key={admin.id}>
                    <Table.Cell>
                      <span className="block font-sans text-body-sm font-medium text-text-primary">{admin.name}</span>
                      <span className="block font-sans text-caption text-text-muted">{admin.email}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="block font-sans text-body-sm text-text-primary">
                        {admin.branchName ?? "Branch"}
                      </span>
                      <span className="block font-sans text-caption text-text-muted">{admin.title}</span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant="brand">{admin.branchName ? "Branch Admin" : "Admin"}</Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge variant={meta.variant} dot>
                        {meta.label}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="right">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(admin)}>
                          Edit
                        </Button>
                        {admin.status === "active" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setConfirm({ admin, target: "disabled" })}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirm({ admin, target: "active" })}
                          >
                            Enable
                          </Button>
                        )}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table>
          )}
        </AsyncBoundary>
      </div>

      {editing ? (
        <AdminDialog
          admin={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            retry();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={() => changeStatus(confirm.admin, confirm.target)}
        title={
          confirm?.target === "disabled"
            ? `Disable ${confirm.admin.name}?`
            : `Enable ${confirm?.admin.name}?`
        }
        body={
          confirm?.target === "disabled"
            ? "They can no longer sign in to their console. Their record, branch and history stay intact."
            : "Their console access is restored with the same branch as before."
        }
        confirmLabel={confirm?.target === "disabled" ? "Disable Admin" : "Enable Admin"}
        confirmVariant={confirm?.target === "disabled" ? "danger" : "primary"}
        busy={mutation.busy}
        error={mutation.error}
      />
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Create / edit dialog                                                    */
/* ---------------------------------------------------------------------- */

function AdminDialog({ admin, onClose, onSaved }) {
  const isNew = !admin;
  const branches = useGovernanceBranches();
  const mutation = useGovernanceMutation();

  /* Assignment is offered for ACTIVE branches only — a disabled boutique
     cannot receive staff (the provider enforces the same rule). */
  const assignableBranches = (branches.data ?? []).filter(
    (branch) => branch.status !== "disabled"
  );

  const [form, setForm] = useState({
    name: admin?.name ?? "",
    email: admin?.email ?? "",
    branchId: admin?.branchId ?? "",
  });
  const [localError, setLocalError] = useState(null);

  const save = async (event) => {
    event.preventDefault();
    setLocalError(null);

    if (isNew && !form.name.trim()) {
      setLocalError("An administrator name is required.");
      return;
    }
    if (isNew && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setLocalError("Enter a valid email address.");
      return;
    }
    /* Phase 14.3 — the branch is REQUIRED. There is no head-office
       administrator: organization-wide authority is the Super Admin's. */
    if (!form.branchId) {
      setLocalError("Choose the branch this administrator manages.");
      return;
    }

    try {
      if (isNew) {
        await mutation.run(organizationGovernanceService.createAdmin, {
          name: form.name,
          email: form.email,
          branchId: form.branchId,
        });
      } else {
        await mutation.run(organizationGovernanceService.updateAdmin, admin.id, {
          branchId: form.branchId,
        });
      }
      onSaved();
    } catch {
      /* mutation.error carries the provider's message */
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isNew ? "New Admin" : `Edit — ${admin.name}`}
      description={
        isNew
          ? "An administrator runs catalogue, inventory and orders for ONE boutique — the branch is required and defines their entire authority."
          : `${admin.email} · branch reassignment and status are the levers here.`
      }
    >
      <form onSubmit={save} className="space-y-4">
        {isNew ? (
          <>
            <Input
              label="Name"
              required
              size="sm"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              label="Email"
              required
              type="email"
              size="sm"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              hint="Used to sign in at the shared staff login."
            />
          </>
        ) : null}

        <Select
          label="Branch"
          required
          size="sm"
          value={form.branchId}
          onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))}
          hint="The one boutique this administrator runs. Their operational scope is exactly this branch."
        >
          <option value="">Choose a branch…</option>
          {assignableBranches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </Select>

        {(localError || mutation.error) && (
          <p role="alert" className="border border-state-error/30 bg-state-error-soft px-4 py-3 font-sans text-caption text-state-error">
            {localError ?? mutation.error?.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={mutation.busy}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={mutation.busy}>
            {mutation.busy ? "Saving…" : isNew ? "Create Admin" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
