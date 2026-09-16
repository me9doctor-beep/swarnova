import { useId } from "react";
import PropTypes from "prop-types";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn.js";
import Field from "./Field.jsx";

/**
 * SELECT — the single dropdown for filter bars, tables and forms.
 *
 * Built on the native `<select>`: keyboard behaviour, screen-reader support and
 * mobile pickers come from the platform, so no third-party listbox is needed.
 * Options are passed as children, exactly like the element it wraps:
 *
 *   <Select label="Branch" value={branch} onChange={…}>
 *     <option value="all">All branches</option>
 *   </Select>
 */
const base =
  "w-full appearance-none rounded-sm border bg-surface-primary font-sans text-text-primary transition-colors duration-200 focus:border-brand-accent disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted";

const sizes = {
  sm: "h-9 pl-3 pr-8 text-body-lg sm:text-body-sm",
  md: "h-11 pl-3.5 pr-9 text-body-lg sm:text-body",
};

export default function Select({
  id,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  size = "md",
  className,
  children,
  ...rest
}) {
  const generated = useId();
  const fieldId = id ?? `select-${generated.replace(/:/g, "")}`;
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
      <div className="relative">
        <select
          id={fieldId}
          required={required}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            base,
            sizes[size],
            error ? "border-state-error" : "border-border-default",
            className
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
    </Field>
  );
}

Select.propTypes = {
  id: PropTypes.string,
  label: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(["sm", "md"]),
  className: PropTypes.string,
  children: PropTypes.node,
};
