import { useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, MapPin } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useAddresses } from "../../../hooks/useAddresses.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

const EMPTY_FORM = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  isDefault: false,
};

export default function AddressesPage() {
  useDocumentTitle("Delivery Addresses — Swarnova");

  const {
    addresses,
    status,
    error,
    retry,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    isBusy,
  } = useAddresses();

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);

  /* List actions are provider calls too — their rejections (lapsed session)
     render inline rather than escaping as unhandled errors. */
  const handleDelete = async (id) => {
    setActionError(null);
    try {
      await deleteAddress(id);
    } catch (caught) {
      setActionError(
        caught?.message ?? "We could not delete this address. Please try again."
      );
    }
  };

  const handleSetDefault = async (id) => {
    setActionError(null);
    try {
      await setDefault(id);
    } catch (caught) {
      setActionError(
        caught?.message ??
          "We could not update your default address. Please try again."
      );
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      name: addr.name ?? "",
      phone: addr.phone ?? "",
      line1: addr.line1 ?? "",
      line2: addr.line2 ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      postalCode: addr.postalCode ?? "",
      country: addr.country ?? "India",
      isDefault: Boolean(addr.isDefault),
    });
    setFormError(null);
    setFormOpen(true);
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormError(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.line1 || !formData.city || !formData.postalCode) {
      setFormError("Please fill out all mandatory address fields.");
      return;
    }

    /* The provider is authoritative — its rejections (validation, lapsed
       session) render on the form rather than escaping as unhandled errors. */
    try {
      if (editingId) {
        await updateAddress({ ...formData, id: editingId });
      } else {
        await addAddress(formData);
      }
    } catch (caught) {
      setFormError(
        caught?.message ?? "We could not save this address. Please try again."
      );
      return;
    }

    handleCancelForm();
  };

  if (status !== "success" && addresses.length === 0) {
    return (
      <AsyncBoundary
        status={status}
        error={error}
        onRetry={retry}
        className="min-h-[280px]"
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border-default pb-5">
        <div>
          <h2 className="font-serif text-h2 font-medium text-text-primary">Delivery Addresses</h2>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Manage your verified shipping locations for insured hand delivery and courier dispatch.
          </p>
        </div>

        {!formOpen && (
          <Button size="sm" onClick={handleOpenAdd} className="self-start sm:self-center">
            <Plus size={14} strokeWidth={1.8} aria-hidden="true" />
            Add New Address
          </Button>
        )}
      </div>

      {actionError && (
        <div
          role="alert"
          className="border border-state-error/30 bg-state-error-soft p-4 text-body-sm text-state-error"
        >
          {actionError}
        </div>
      )}

      {/* Address Form (Add / Edit) */}
      {formOpen && (
        <div className="border border-brand-accent/40 bg-surface-primary p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-border-default pb-4">
            <h3 className="font-serif text-h3 text-text-primary">
              {editingId ? "Edit Delivery Address" : "Add Delivery Address"}
            </h3>
            <button
              type="button"
              onClick={handleCancelForm}
              className="font-sans text-caption uppercase tracking-[0.2em] text-text-muted hover:text-text-primary"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <p role="alert" className="mt-4 text-body-sm text-state-error">
              {formError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Recipient Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Contact Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Address Line 1 (Flat, House no., Building, Company)"
              name="line1"
              value={formData.line1}
              onChange={handleChange}
              required
            />

            <Input
              label="Address Line 2 (Area, Street, Sector, Landmark)"
              name="line2"
              value={formData.line2}
              onChange={handleChange}
            />

            <div className="grid gap-5 sm:grid-cols-3">
              <Input
                label="City / Town"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
              <Input
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
              />
              <Input
                label="Postal Code (PIN)"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Input
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
              />
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2.5 text-body-sm text-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleChange}
                    className="h-4 w-4 rounded-sm border-border-default text-brand-primary accent-brand-primary"
                  />
                  <span>Make this my default shipping address</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-6">
              <Button type="submit" disabled={isBusy}>
                {isBusy ? "Saving..." : editingId ? "Update Address" : "Save Address"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancelForm} disabled={isBusy}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 && !formOpen ? (
        <EmptyState
          title="No Delivery Addresses Saved"
          action={
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus size={14} aria-hidden="true" /> Add First Address
            </Button>
          }
          className="py-16 text-center"
        >
          Add your residential or private address to enable expedited insured dispatch for future jewellery acquisitions.
        </EmptyState>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="flex flex-col justify-between border border-border-default bg-surface-primary p-6 transition-colors duration-200 hover:border-brand-accent/50"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-brand-accent-strong" aria-hidden="true" />
                    <h3 className="font-serif text-h4 font-medium text-text-primary">
                      {addr.name}
                    </h3>
                  </div>
                  {addr.isDefault && (
                    <Badge variant="brand" dot>
                      Default
                    </Badge>
                  )}
                </div>

                <div className="mt-4 space-y-1 font-sans text-body-sm text-text-secondary leading-relaxed">
                  <p>{addr.line1}</p>
                  {addr.line2 && <p>{addr.line2}</p>}
                  <p>
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-text-muted">{addr.country}</p>
                  <p className="pt-2 text-caption text-text-muted">
                    Phone: {addr.phone}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="font-sans text-caption font-medium uppercase tracking-[0.2em] text-brand-primary hover:text-brand-accent-strong flex items-center gap-1"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="font-sans text-caption font-medium uppercase tracking-[0.2em] text-text-muted hover:text-state-error flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>

                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="font-sans text-caption font-medium uppercase tracking-[0.18em] text-brand-accent-strong hover:underline"
                  >
                    Set as Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
