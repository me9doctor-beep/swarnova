import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * CHECKOUT OPTION — the one accessible radio-card for address, delivery and
 * payment selection. A real `<input type="radio">` inside the label, so
 * keyboard navigation, screen-reader grouping and mobile behaviour come
 * from the platform; the frame only answers with the selected treatment.
 * Static interaction language — colour only, no animation.
 */
export default function CheckoutOption({
  name,
  value,
  checked = false,
  onChange,
  disabled = false,
  title,
  description,
  meta,
  trailing,
  children,
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer gap-4 border p-5 transition-colors duration-200",
        checked
          ? "border-brand-primary bg-surface-muted/40"
          : "border-border-default bg-surface-primary hover:border-brand-accent/50",
        disabled && "cursor-not-allowed opacity-60"
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-1 h-4 w-4 shrink-0 accent-brand-primary"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="font-serif text-h4 font-medium text-text-primary">{title}</span>
          {trailing}
        </span>
        {description && (
          <span className="mt-1 block font-sans text-body-sm leading-relaxed text-text-secondary">
            {description}
          </span>
        )}
        {meta && (
          <span className="mt-1.5 block font-sans text-caption text-text-muted">{meta}</span>
        )}
        {children}
      </span>
    </label>
  );
}

CheckoutOption.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  title: PropTypes.node.isRequired,
  description: PropTypes.node,
  meta: PropTypes.node,
  trailing: PropTypes.node,
  children: PropTypes.node,
};
