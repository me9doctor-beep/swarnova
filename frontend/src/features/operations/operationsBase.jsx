import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import { useAuth } from "../authentication/useAuth.js";
import { ROLES } from "../authentication/roles.js";

/**
 * OPERATIONS BASE — which console is hosting the shared operational screens.
 *
 * Admin and Super Admin read the same order, customer, inventory and report
 * contracts. The pages stay one implementation; only the route prefix changes,
 * so a Super Admin link never drops into the Admin shell and no second store
 * is created.
 *
 * Default `/admin` keeps the existing Admin routes correct without a provider.
 */
const OperationsBaseContext = createContext("/admin");

export function OperationsBaseProvider({ base = "/admin", children }) {
  return <OperationsBaseContext.Provider value={base}>{children}</OperationsBaseContext.Provider>;
}

OperationsBaseProvider.propTypes = {
  base: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export function useOperationsBase() {
  return useContext(OperationsBaseContext);
}

/** Document-title suffix for a reused operational screen. */
export function useOperationsFrame() {
  const base = useOperationsBase();
  const { role } = useAuth();
  const consoleName = role === ROLES.SUPER_ADMIN ? "Super Admin" : "Admin";
  return { base, consoleName, role };
}

/**
 * Super Admin branch selection is a view. The same pages, the same book.
 * Naming a boutique must not read as a loss of organization-wide authority.
 */
export function OperationsViewNote({ narrowed = false }) {
  const { role } = useOperationsFrame();
  if (role !== ROLES.SUPER_ADMIN) return null;

  return (
    <p className="font-sans text-caption leading-relaxed text-text-muted">
      {narrowed
        ? "Viewing one boutique. This account stays organization-wide — choose All branches to return to the full book."
        : "Organization-wide. Choosing a boutique narrows this view only. It does not reduce authority."}
    </p>
  );
}

OperationsViewNote.propTypes = {
  narrowed: PropTypes.bool,
};
