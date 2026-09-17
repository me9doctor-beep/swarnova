import PropTypes from "prop-types";
import { cn } from "../../utils/cn.js";

/**
 * AUTH ALERT — the form-level notice for authentication outcomes.
 * Failures announce via `role="alert"`; confirmations via `role="status"`.
 * Copy always arrives pre-translated (`translateCustomerAuthError`) so no
 * technical detail ever reaches the storefront.
 */
export default function AuthAlert({ tone = "error", children, className }) {
  if (!children) return null;
  const isError = tone === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={cn(
        "border px-4 py-3 font-sans text-body-sm leading-relaxed",
        isError
          ? "border-state-error/30 bg-state-error-soft text-state-error"
          : "border-state-success/30 bg-state-success-soft text-state-success",
        className
      )}
    >
      {children}
    </p>
  );
}

AuthAlert.propTypes = {
  tone: PropTypes.oneOf(["error", "success"]),
  children: PropTypes.node,
  className: PropTypes.string,
};
