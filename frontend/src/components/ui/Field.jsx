import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * FIELD — label + control + hint/error shell shared by every form primitive
 * (Input, Select, and the textarea/checkbox primitives of later phases).
 *
 * It owns the label, the message slot and the ids those two reference; the
 * control owns its own markup, so nothing here knows about a specific input
 * type. Labels are real `<label>` elements — never placeholders standing in
 * for a label.
 */
export default function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  hintId,
  errorId,
  className,
  children,
}) {
  return (
    <div className={cn("flex w-full flex-col gap-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="font-sans text-label uppercase text-text-secondary">
          {label}
          {required ? (
            <span className="ml-1 text-state-error" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}

      {children}

      {error ? (
        <p id={errorId} className="font-sans text-caption text-state-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="font-sans text-caption text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

Field.propTypes = {
  label: PropTypes.node,
  /** Id of the control this label belongs to. */
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  hint: PropTypes.node,
  error: PropTypes.node,
  hintId: PropTypes.string,
  errorId: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
};
