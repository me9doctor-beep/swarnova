import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Plus } from "lucide-react";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import CheckoutOption from "./CheckoutOption.jsx";
import { useAddresses } from "../../hooks/useAddresses.js";

/**
 * CHECKOUT ADDRESS PICKER (Phase 12)
 * -----------------------------------------------------------------------------
 * Delivery-address selection for checkout — a consumer of the EXISTING
 * customer address system (`useAddresses` → `customerService` → provider),
 * never a second CRUD. The customer picks one saved address for this order
 * or adds one inline through the same provider call the account page uses;
 * ownership is re-resolved store-side, so only the customer's own book is
 * ever reachable here.
 */

const EMPTY_FORM = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

function validateAddressForm(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Enter the recipient name.";
  if (!form.phone.trim()) errors.phone = "Enter a contact number for this address.";
  else if (!/^[+\d][\d\s\-()+]{6,17}$/.test(form.phone.trim())) {
    errors.phone = "Enter a valid contact number.";
  }
  if (!form.line1.trim()) errors.line1 = "Enter the street address.";
  if (!form.city.trim()) errors.city = "Enter the city.";
  if (!form.state.trim()) errors.state = "Enter the state.";
  if (!form.postalCode.trim()) errors.postalCode = "Enter the postal code (PIN).";
  else if (!/^\d{5,6}$/.test(form.postalCode.trim())) {
    errors.postalCode = "Enter a valid postal code (PIN).";
  }
  return errors;
}

export default function CheckoutAddressPicker({ selectedId, onSelect }) {
  const { addresses, status, error, retry, addAddress, isBusy } = useAddresses();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  /* Seat the customer on an address once their book arrives — the default,
     or the first address in their own book. Only the empty seat is filled:
     an explicit selection (including one made by adding an address) stands,
     and checkout exposes no way to orphan a selection afterwards. */
  useEffect(() => {
    if (status !== "success" || addresses.length === 0) return;
    if (selectedId) return;
    onSelect(addresses.find((item) => item.isDefault)?.id ?? addresses[0].id);
  }, [status, addresses, selectedId, onSelect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const handleOpenForm = () => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
    setFormOpen(true);
  };

  const handleCancelForm = () => {
    setFormOpen(false);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateAddressForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Please complete the highlighted fields.");
      return;
    }
    setFormError(null);
    try {
      /* The provider is authoritative — its validation, not this form's. */
      const added = await addAddress(form);
      setFormOpen(false);
      setForm(EMPTY_FORM);
      if (added?.id) onSelect(added.id);
    } catch (caught) {
      setFormError(
        caught?.message ?? "We could not save this address. Please try again."
      );
    }
  };

  if (status !== "success" && addresses.length === 0) {
    return <AsyncBoundary status={status} error={error} onRetry={retry} className="min-h-[160px]" />;
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 ? (
        <p className="font-sans text-body-sm text-text-secondary">
          Add a delivery address to continue — your pieces travel insured from the boutique to your door.
        </p>
      ) : (
        <div role="radiogroup" aria-label="Saved delivery addresses" className="space-y-3">
          {addresses.map((address) => (
            <CheckoutOption
              key={address.id}
              name="checkout-address"
              value={address.id}
              checked={selectedId === address.id}
              onChange={() => onSelect(address.id)}
              title={address.name}
              description={[address.line1, address.line2].filter(Boolean).join(", ")}
              meta={`${address.city}, ${address.state} ${address.postalCode} · ${address.phone}${
                address.isDefault ? " · Default" : ""
              }`}
            />
          ))}
        </div>
      )}

      {formOpen ? (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 border border-brand-accent/40 bg-surface-muted/30 p-5 sm:p-6"
          aria-label="Add a new delivery address"
        >
          {formError && (
            <p role="alert" className="font-sans text-body-sm text-state-error">
              {formError}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Recipient Full Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={fieldErrors.name}
              required
            />
            <Input
              label="Contact Phone Number"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={fieldErrors.phone}
              inputMode="tel"
              required
            />
          </div>

          <Input
            label="Address Line 1 (Flat, House no., Building)"
            name="line1"
            value={form.line1}
            onChange={handleChange}
            error={fieldErrors.line1}
            required
          />

          <Input
            label="Address Line 2 (Area, Street, Landmark)"
            name="line2"
            value={form.line2}
            onChange={handleChange}
          />

          <div className="grid gap-5 sm:grid-cols-3">
            <Input
              label="City / Town"
              name="city"
              value={form.city}
              onChange={handleChange}
              error={fieldErrors.city}
              required
            />
            <Input
              label="State"
              name="state"
              value={form.state}
              onChange={handleChange}
              error={fieldErrors.state}
              required
            />
            <Input
              label="Postal Code (PIN)"
              name="postalCode"
              value={form.postalCode}
              onChange={handleChange}
              error={fieldErrors.postalCode}
              inputMode="numeric"
              required
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-5">
            <Button type="submit" size="sm" disabled={isBusy}>
              {isBusy ? "Saving…" : "Save Address"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={handleCancelForm} disabled={isBusy}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={handleOpenForm}>
          <Plus size={14} strokeWidth={1.8} aria-hidden="true" />
          Add New Address
        </Button>
      )}
    </div>
  );
}

CheckoutAddressPicker.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};
