import { useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * CHECKBOX — the native-checkbox primitive in the Field vocabulary.
 *
 * Built on a real `<input type="checkbox">` so keyboard behaviour and form
 * semantics come from the platform. The visual box is decorative; the
 * accessible name is the visible label.
 */
export default function Checkbox({
  id,
  label,
  description,
  checked = false,
  disabled = false,
  className,
  ...rest
}) {
  const generated = useId();
  const fieldId = id ?? `checkbox-${generated.replace(/:/g, "")}`;

  return (
    <label
      htmlFor={fieldId}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-sm border border-border-default bg-surface-primary px-4 py-3 transition-colors duration-200 hover:border-brand-accent/45",
        checked && "border-brand-accent/55 bg-surface-muted/40",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      <input
        id={fieldId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded-sm border-border-default accent-[var(--color-brand-primary)] focus-visible:outline-2 focus-visible:outline-offset-2"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block font-sans text-body-sm font-medium text-text-primary">{label}</span>
        {description ? (
          <span className="mt-0.5 block font-sans text-caption text-text-muted">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

Checkbox.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node.isRequired,
  description: PropTypes.node,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};
