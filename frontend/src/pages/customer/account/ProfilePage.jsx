import { useState, useEffect } from "react";
import { Check, Edit3, User, Sparkles } from "lucide-react";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import { useCustomerProfile } from "../../../hooks/useCustomerProfile.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";

const METAL_OPTIONS = [
  "22K Yellow Gold",
  "18K Rose Gold",
  "18K White Gold",
  "Platinum & 18K Gold",
];

const RING_SIZES = [
  "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"
];

const STYLE_OPTIONS = [
  "Heritage Temple & Contemporary Polki",
  "Minimalist Everyday Fine Jewellery",
  "Regal Bridal & Grand Statement",
  "Modern Geometric & Solitaire",
];

export default function ProfilePage() {
  useDocumentTitle("Client Profile — Swarnova");

  const { profile, status, error, retry, updateProfile, isUpdating } = useCustomerProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    preferredMetal: "22K Yellow Gold",
    ringSize: "14",
    favouriteStyle: "Heritage Temple & Contemporary Polki",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        dateOfBirth: profile.dateOfBirth ?? "",
        preferredMetal: profile.preferences?.preferredMetal ?? "22K Yellow Gold",
        ringSize: profile.preferences?.ringSize ?? "14",
        favouriteStyle:
          profile.preferences?.favouriteStyle ?? "Heritage Temple & Contemporary Polki",
      });
    }
  }, [profile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = () => {
    setSaveSuccess(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        dateOfBirth: profile.dateOfBirth ?? "",
        preferredMetal: profile.preferences?.preferredMetal ?? "22K Yellow Gold",
        ringSize: profile.preferences?.ringSize ?? "14",
        favouriteStyle:
          profile.preferences?.favouriteStyle ?? "Heritage Temple & Contemporary Polki",
      });
    }
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    /* The provider is authoritative — its rejections (validation, lapsed
       session) render inline rather than escaping as unhandled errors. */
    try {
      await updateProfile({
        name: form.name,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        preferences: {
          preferredMetal: form.preferredMetal,
          ringSize: form.ringSize,
          favouriteStyle: form.favouriteStyle,
        },
      });
    } catch (caught) {
      setSaveError(
        caught?.message ?? "We could not save your profile. Please try again."
      );
      return;
    }
    setIsEditing(false);
    setSaveSuccess(true);
  };

  if (status !== "success" && !profile) {
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
          <h2 className="font-serif text-h2 font-medium text-text-primary">Client Profile</h2>
          <p className="mt-1 font-serif text-body text-text-secondary">
            Manage your personal credentials, contact details, and sizing preferences.
          </p>
        </div>

        {!isEditing && (
          <Button variant="outline" size="sm" onClick={handleStartEdit} className="self-start sm:self-center">
            <Edit3 size={13} strokeWidth={1.5} aria-hidden="true" />
            Edit Profile
          </Button>
        )}
      </div>

      {saveSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 border border-state-success/30 bg-state-success-soft p-4 text-body-sm text-state-success"
        >
          <Check size={16} strokeWidth={2} aria-hidden="true" />
          <span>Your client profile and preferences have been updated successfully.</span>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="border border-state-error/30 bg-state-error-soft p-4 text-body-sm text-state-error"
        >
          {saveError}
        </div>
      )}

      {/* Main card */}
      <div className="border border-border-default bg-surface-primary p-6 sm:p-8">
        {isEditing ? (
          /* Form mode */
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-5">
              <h3 className="font-sans text-label uppercase tracking-[0.24em] text-brand-accent-strong">
                Personal Credentials
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  id="profile-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email Address"
                  id="profile-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label="Phone Number"
                  id="profile-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Date of Birth"
                  id="profile-dob"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="border-t border-border-default pt-6 space-y-5">
              <h3 className="font-sans text-label uppercase tracking-[0.24em] text-brand-accent-strong">
                Jewellery & Sizing Preferences
              </h3>
              <div className="grid gap-5 sm:grid-cols-3">
                <Select
                  label="Preferred Metal"
                  id="profile-metal"
                  name="preferredMetal"
                  value={form.preferredMetal}
                  onChange={handleChange}
                >
                  {METAL_OPTIONS.map((metal) => (
                    <option key={metal} value={metal}>
                      {metal}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Ring Size"
                  id="profile-ring-size"
                  name="ringSize"
                  value={form.ringSize}
                  onChange={handleChange}
                >
                  {RING_SIZES.map((size) => (
                    <option key={size} value={size}>
                      Size {size} (Standard Indian)
                    </option>
                  ))}
                </Select>

                <Select
                  label="Aesthetic Preference"
                  id="profile-style"
                  name="favouriteStyle"
                  value={form.favouriteStyle}
                  onChange={handleChange}
                >
                  {STYLE_OPTIONS.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-6">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isUpdating}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          /* View mode */
          <div className="space-y-8">
            <div>
              <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary pb-3 border-b border-border-default">
                Personal Credentials
              </h3>
              <dl className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Full Name
                  </dt>
                  <dd className="mt-1 font-serif text-h4 text-text-primary">
                    {profile?.name}
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Email Address
                  </dt>
                  <dd className="mt-1 font-sans text-body text-text-primary">
                    {profile?.email}
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Phone Number
                  </dt>
                  <dd className="mt-1 font-sans text-body text-text-primary">
                    {profile?.phone}
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Date of Birth
                  </dt>
                  <dd className="mt-1 font-sans text-body text-text-primary">
                    {profile?.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : "Not specified"}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="font-sans text-label uppercase tracking-[0.24em] text-text-secondary pb-3 border-b border-border-default">
                Jewellery & Sizing Preferences
              </h3>
              <dl className="mt-4 grid gap-6 sm:grid-cols-3">
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Preferred Metal
                  </dt>
                  <dd className="mt-1 font-serif text-body text-brand-accent-strong">
                    {profile?.preferences?.preferredMetal}
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Ring Size
                  </dt>
                  <dd className="mt-1 font-serif text-body text-text-primary">
                    Size {profile?.preferences?.ringSize} (IN)
                  </dd>
                </div>
                <div>
                  <dt className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Aesthetic Direction
                  </dt>
                  <dd className="mt-1 font-serif text-body text-text-primary">
                    {profile?.preferences?.favouriteStyle}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border-t border-border-default pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-sans text-caption uppercase tracking-[0.18em] text-text-muted">
                    Membership Status
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="brand" dot>
                      {profile?.tier ?? "Swarnova Privé"}
                    </Badge>
                    <span className="font-sans text-caption text-text-muted">
                      Member since {profile?.memberSince ?? "2024"}
                    </span>
                  </div>
                </div>
                <p className="font-serif text-caption italic text-text-muted">
                  Bespoke concierge consultations complimentary for Privé patrons.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
