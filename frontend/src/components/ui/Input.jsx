import { useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";
import Field from "./Field.jsx";

/**
 * INPUT — the single text field for Customer, Admin, Super Admin and Employee
 * forms. States: default, focus, error, disabled, read-only.
 *
 * Sizes are functional, not decorative: `sm` is the console's dense control
 * (tables, filters, toolbars), `md` is the storefront/employee control with a
 * thumb-friendly 44px target. Both keep 16px type on phones, because iOS Safari
 * zooms the whole page when a smaller field takes focus.
 */
const base =
  "w-full rounded-sm border bg-surface-primary font-sans text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:border-brand-accent disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted";

const sizes = {
  sm: "h-9 px-3 text-body-lg sm:text-body-sm",
  md: "h-11 px-3.5 text-body-lg sm:text-body",
};

export default function Input({
  id,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  size = "md",
  className,
  ...rest
}) {
  const generated = useId();
  const fieldId = id ?? `input-${generated.replace(/:/g, "")}`;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;

  return (
    <Field
      label={label}
      htmlFor={fieldId}
      required={required}
      hint={hint}
      error={error}
      hintId={hintId}
      errorId={errorId}
    >
      <input
        id={fieldId}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          base,
          sizes[size],
          error ? "border-state-error" : "border-border-default",
          readOnly && "bg-surface-secondary text-text-secondary",
          className
        )}
        {...rest}
      />
    </Field>
  );
}

Input.propTypes = {
  /** Optional — a stable id is generated when omitted. */
  id: PropTypes.string,
  label: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
};
