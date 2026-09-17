import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ImagePlus, Upload } from "lucide-react";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import Button from "../../../components/ui/Button.jsx";
import Badge from "../../../components/ui/Badge.jsx";
import Dialog from "../../../components/ui/Dialog.jsx";
import Select from "../../../components/ui/Select.jsx";
import EmptyState from "../../../components/ui/EmptyState.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import FilterBar from "../../../components/super-admin/FilterBar.jsx";
import ConfirmDialog from "../../../components/super-admin/ConfirmDialog.jsx";
import { useMediaLibrary } from "../../../hooks/useGovernanceMedia.js";
import { useGovernanceProducts } from "../../../hooks/useGovernanceProducts.js";
import { useGovernanceMutation } from "../../../hooks/useGovernanceMutation.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { mediaGovernanceService } from "../../../services/mediaGovernanceService.js";
import {
  MEDIA_KIND_OPTIONS,
  MEDIA_STATUS_META,
  MEDIA_USAGE_KIND_LABELS,
  MEDIA_USAGE_OPTIONS,
} from "../../../features/super-admin/governance.js";
import { formatDateTime, formatDimensions, formatFileSize } from "../../../utils/format.js";

/**
 * MEDIA GOVERNANCE — the canonical media library.
 *
 * The mental model is four words: Upload → Library → Attach → Use.
 * One grid shows every asset with its computed usage; one dialog carries
 * the detail (metadata, where it is used, and the three actions: attach,
 * upload-more, delete). Assets actively used by products or content cannot
 * be deleted silently — the dialog explains where and offers the safe path.
 */
export default function MediaLibraryPage() {
  useDocumentTitle("Media Library — Swarnova Super Admin");

  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState(searchParams.get("usage") ?? "all");
  const [selected, setSelected] = useState(null); // media item for the detail dialog

  useEffect(() => {
    setUsageFilter(searchParams.get("usage") ?? "all");
  }, [searchParams]);

  const query = useMemo(
    () => ({
      search: search.trim() || undefined,
      kind: kindFilter === "all" ? undefined : kindFilter,
      usage: usageFilter === "all" ? undefined : usageFilter,
    }),
    [search, kindFilter, usageFilter]
  );

  const { status, data: library, error, retry } = useMediaLibrary(query);

  /* Keep the detail dialog in sync after library mutations. */
  const selectedFresh = selected
    ? (library ?? []).find((item) => item.id === selected.id) ?? null
    : null;

  const closeDetail = () => setSelected(null);

  return (
    <>
      <PageHeader
        eyebrow="Media Governance"
        title="Media Library"
        description="One library for every image the platform uses — upload once, reuse across products, homepage, campaigns and branches."
        actions={<UploadAction onUploaded={retry} />}
      />

      <div className="mt-6">
        <FilterBar
          searchLabel="Search media"
          searchPlaceholder="Name or file name…"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              id: "kind",
              label: "Type",
              value: kindFilter,
              onChange: setKindFilter,
              options: MEDIA_KIND_OPTIONS,
            },
            {
              id: "usage",
              label: "Usage",
              value: usageFilter,
              onChange: setUsageFilter,
              options: MEDIA_USAGE_OPTIONS,
            },
          ]}
        />
      </div>

      <div className="mt-6">
        <AsyncBoundary
          status={status === "loading" ? "loading" : status === "error" ? "error" : "success"}
          error={error}
          onRetry={retry}
          errorMessage="The media library could not be loaded."
        >
          {!library || library.length === 0 ? (
            <EmptyState title="No media found">
              Nothing matches these filters. Upload new imagery with the
              Upload Media button, or adjust the filters.
            </EmptyState>
          ) : (
            <ul
              aria-label="Media library grid"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
            >
              {library.map((item) => (
                <MediaCard key={item.id} item={item} onOpen={() => setSelected(item)} />
              ))}
            </ul>
          )}
        </AsyncBoundary>
      </div>

      {selectedFresh ? (
        <MediaDetailDialog
          item={selectedFresh}
          onClose={closeDetail}
          onChanged={retry}
        />
      ) : null}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/* Card                                                                    */
/* ---------------------------------------------------------------------- */

function MediaCard({ item, onOpen }) {
  const meta = MEDIA_STATUS_META[item.status] ?? MEDIA_STATUS_META.unused;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex h-full w-full flex-col border border-border-default bg-surface-primary text-left transition-colors duration-200 hover:border-brand-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`${item.name} — ${meta.label}${item.usageCount > 0 ? `, used in ${item.usageCount} ${item.usageCount === 1 ? "place" : "places"}` : ""}`}
      >
        <span className="block aspect-[4/3] overflow-hidden bg-surface-secondary">
          <img
            src={item.src}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </span>
        <span className="flex flex-1 flex-col gap-1.5 p-4">
          <span className="font-sans text-body-sm font-medium leading-snug text-text-primary group-hover:text-brand-primary">
            {item.name}
          </span>
          <span className="font-sans text-caption text-text-muted">
            {formatDimensions(item.dimensions)} · {formatFileSize(item.size)}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {item.usageCount > 0 ? (
              <span className="font-sans text-caption text-text-muted">
                {item.usageCount} {item.usageCount === 1 ? "place" : "places"}
              </span>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

/* ---------------------------------------------------------------------- */
/* Upload                                                                  */
/* ---------------------------------------------------------------------- */

/** The upload button + hidden file input. Reads the file, then the provider
 *  validates it — the same contract a future `POST /media` will carry. */
function UploadAction({ onUploaded }) {
  const inputRef = useRef(null);
  const mutation = useGovernanceMutation();
  const [notice, setNotice] = useState(null);

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;

    const dimensions = await readDimensions(file).catch(() => ({ width: 0, height: 0 }));
    const dataUrl = await readDataUrl(file).catch(() => null);

    try {
      await mutation.run(
        mediaGovernanceService.upload,
        {
          name: file.name,
          type: file.type,
          size: file.size,
          width: dimensions.width,
          height: dimensions.height,
          dataUrl,
        }
      );
      setNotice({ kind: "ok", text: `“${file.name}” was added to the library.` });
      onUploaded?.();
    } catch {
      /* mutation.error carries the provider's message */
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <Button size="sm" onClick={() => inputRef.current?.click()} disabled={mutation.busy}>
        <Upload size={14} strokeWidth={1.5} aria-hidden="true" />
        {mutation.busy ? "Uploading…" : "Upload Media"}
      </Button>
      {(mutation.error || notice) && !mutation.busy ? (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm border border-border-default bg-surface-primary px-5 py-4 shadow-medium" role="status">
          <p className={`font-sans text-body-sm ${mutation.error ? "text-state-error" : "text-state-success"}`}>
            {mutation.error ? mutation.error.message : notice?.text}
          </p>
          <Button variant="link" className="mt-1" onClick={() => { mutation.clearError(); setNotice(null); }}>
            Dismiss
          </Button>
        </div>
      ) : null}
    </>
  );
}

function readDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("unreadable file"));
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------------- */
/* Detail dialog                                                           */
/* ---------------------------------------------------------------------- */

function MediaDetailDialog({ item, onClose, onChanged }) {
  const meta = MEDIA_STATUS_META[item.status] ?? MEDIA_STATUS_META.unused;
  const products = useGovernanceProducts({});
  const mutation = useGovernanceMutation();

  const [attachProductId, setAttachProductId] = useState("");
  const [attachSlot, setAttachSlot] = useState("primary");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [actionError, setActionError] = useState(null);

  const attach = async (event) => {
    event.preventDefault();
    if (!attachProductId) return;
    setActionError(null);
    try {
      const result = await mutation.run(
        mediaGovernanceService.attachToProduct,
        item.id,
        attachProductId,
        attachSlot
      );
      setActionNotice(
        attachSlot === "primary"
          ? `Set as the primary image for “${result.product.name}”.`
          : `Added to the gallery of “${result.product.name}”.`
      );
      onChanged?.();
    } catch {
      setActionError(mutation.error);
    }
  };

  const remove = async () => {
    try {
      await mutation.run(mediaGovernanceService.remove, item.id);
      setConfirmDelete(false);
      onChanged?.();
      onClose();
    } catch {
      setConfirmDelete(false);
      setActionError(mutation.error);
    }
  };

  return (
    <>
      <Dialog open onClose={onClose} title={item.name} description={`${item.id} · ${item.fileName}`} width="lg">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div>
            <div className="overflow-hidden bg-surface-secondary">
              <img
                src={item.src}
                alt={item.alt ?? item.name}
                className="max-h-[320px] w-full object-cover"
              />
            </div>
            <Badge variant={meta.variant} className="mt-3">
              {meta.label}
            </Badge>
          </div>

          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-6">
              <Meta label="Type" value={item.kind} />
              <Meta label="Format" value={item.format} />
              <Meta label="Dimensions" value={formatDimensions(item.dimensions)} />
              <Meta label="File Size" value={formatFileSize(item.size)} />
              <Meta label="Origin" value={item.origin} />
              <Meta label="Uploaded" value={formatDateTime(item.uploadedAt)} />
              <Meta label="Uploaded By" value={item.uploadedBy ?? "—"} />
            </dl>

            <section aria-label="Media usage">
              <h3 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                Used By
              </h3>
              {item.usage.length === 0 ? (
                <p className="mt-2 font-sans text-body-sm text-text-muted">
                  Unused — this asset is referenced nowhere. It is safe to
                  keep for reuse or remove.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {item.usage.map((usage) => (
                    <li key={`${usage.kind}-${usage.id}`} className="flex items-baseline gap-2 font-sans text-body-sm">
                      <span className="shrink-0 text-label uppercase text-text-muted">
                        {MEDIA_USAGE_KIND_LABELS[usage.kind] ?? usage.kind}
                      </span>
                      {usage.kind === "product" ? (
                        <Link
                          to={`/super-admin/products/${usage.id}`}
                          className="text-brand-primary underline underline-offset-4"
                        >
                          {usage.label} ({usage.id})
                        </Link>
                      ) : (
                        <span className="text-text-primary">{usage.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Attach media to a product">
              <h3 className="font-sans text-label uppercase tracking-[0.22em] text-text-secondary">
                Attach to a Product
              </h3>
              <form className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={attach}>
                <div className="flex-1">
                  <Select size="sm" label="Product" value={attachProductId} onChange={(e) => setAttachProductId(e.target.value)}>
                    <option value="">Choose a product…</option>
                    {(products.data ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.id})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="sm:w-36">
                  <Select size="sm" label="Placement" value={attachSlot} onChange={(e) => setAttachSlot(e.target.value)}>
                    <option value="primary">Primary image</option>
                    <option value="gallery">Gallery</option>
                  </Select>
                </div>
                <Button type="submit" size="sm" variant="outline" disabled={!attachProductId || mutation.busy}>
                  <ImagePlus size={14} strokeWidth={1.5} aria-hidden="true" />
                  Attach
                </Button>
              </form>
            </section>

            {actionNotice ? (
              <p role="status" className="border border-state-success/30 bg-state-success-soft px-4 py-2.5 font-sans text-caption text-state-success">
                {actionNotice}
              </p>
            ) : null}
            {actionError ? (
              <p role="alert" className="border border-state-error/30 bg-state-error-soft px-4 py-2.5 font-sans text-caption text-state-error">
                {actionError.message}
              </p>
            ) : null}

            <div className="flex items-center justify-between gap-4 border-t border-border-subtle pt-4">
              <p className="font-sans text-caption text-text-muted">
                {item.usageCount > 0
                  ? "This media is currently in use — it cannot be removed while anything references it."
                  : "Not referenced anywhere. Removal is safe."}
              </p>
              <Button
                variant={item.usageCount > 0 ? "secondary" : "danger"}
                size="sm"
                disabled={item.usageCount > 0 || mutation.busy}
                onClick={() => setConfirmDelete(true)}
              >
                Delete Media
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        title={`Delete “${item.name}”?`}
        body="The asset is removed from the library. This cannot be undone — but no product or content uses it, so nothing on the platform changes."
        confirmLabel="Delete Media"
        confirmVariant="danger"
        busy={mutation.busy}
      />
    </>
  );
}

function Meta({ label, value }) {
  return (
    <div className="border-b border-border-subtle py-2">
      <dt className="font-sans text-label uppercase tracking-[0.16em] text-text-muted">{label}</dt>
      <dd className="mt-0.5 font-sans text-caption text-text-primary">{value}</dd>
    </div>
  );
}
