import { useId } from "react";
import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";
import Field from "./Field.jsx";

/**
 * TEXTAREA — the multi-line sibling of Input, built on the same Field shell.
 * Same states (default, focus, error, disabled, read-only) and the same
 * phone-safe 16px type; `rows` stays a prop so each form chooses its own
 * depth. The first form to need it is the AI studio's prompt.
 */
const base =
  "w-full rounded-sm border bg-surface-primary font-sans text-text-primary placeholder:text-text-muted transition-colors duration-200 focus:border-brand-accent disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-muted";

export default function Textarea({
  id,
  label,
  hint,
  error,
  required = false,
  disabled = false,
  readOnly = false,
  rows = 4,
  className,
  ...rest
}) {
  const generated = useId();
  const fieldId = id ?? `textarea-${generated.replace(/:/g, "")}`;
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
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          base,
          "resize-y px-3.5 py-3 text-body-lg leading-relaxed sm:text-body",
          error ? "border-state-error" : "border-border-default",
          readOnly && "bg-surface-secondary text-text-secondary",
          className
        )}
        {...rest}
      />
    </Field>
  );
}

Textarea.propTypes = {
  /** Optional — a stable id is generated when omitted. */
  id: PropTypes.string,
  label: PropTypes.node,
  hint: PropTypes.node,
  error: PropTypes.node,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  rows: PropTypes.number,
  className: PropTypes.string,
};
