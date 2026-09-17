import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { X } from "lucide-react";
import IconButton from "./IconButton.jsx";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock.js";
import { cn } from "../../utils/cn.js";

/**
 * DIALOG — the single overlay primitive for confirmations and compact forms.
 *
 * Built like the console drawer: static (no motion library), closed by
 * Escape, the backdrop button or the X. The panel is labelled by its title
 * and holds scroll-lock for however long it is open. Focus stays where the
 * opener can reasonably expect it: the panel itself receives focus on open
 * and the caller decides what happens after close.
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  width = "md",
  labelledBy,
  children,
}) {
  const panelRef = useRef(null);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return undefined;
    panelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const titleId = labelledBy ?? "dialog-title";
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[86vh] w-full flex-col border border-border-default bg-surface-primary shadow-medium focus:outline-none",
          widths[width] ?? widths.md
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-border-default px-panel py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-sans text-nav font-medium uppercase tracking-[0.24em] text-text-primary">
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 font-sans text-caption normal-case tracking-normal text-text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close dialog" variant="outline" size="sm" onClick={onClose}>
            <X size={14} strokeWidth={1.5} aria-hidden="true" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-panel py-5">{children}</div>
      </div>
    </div>
  );
}

Dialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  width: PropTypes.oneOf(["sm", "md", "lg"]),
  labelledBy: PropTypes.string,
  children: PropTypes.node,
};
