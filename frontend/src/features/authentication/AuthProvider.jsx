import { createContext, useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { ROLE_LIST } from "./roles.js";

/**
 * AUTHENTICATION FOUNDATION
 * -----------------------------------------------------------------------------
 * Phase 0 deliberately stops at the abstraction: no login screen, no tokens, no
 * storage, no network. The session is held in React state and shaped exactly
 * like the payload the backend will eventually return:
 *
 *   { user: { id, name, email }, role: "admin", permissions: ["product.view", …] }
 *
 * Later phases hydrate it from a real endpoint (login → session bootstrap),
 * either by passing `initialSession` at the composition root or by calling
 * `signIn(session)` after a successful API call.
 */
const EMPTY_SESSION = { user: null, role: null, permissions: [] };

export const AuthContext = createContext({
  ...EMPTY_SESSION,
  isAuthenticated: false,
  signIn: () => {},
  signOut: () => {},
});

export function AuthProvider({ initialSession = null, children }) {
  const [session, setSession] = useState(initialSession);

  const signIn = useCallback((next) => setSession(next ?? EMPTY_SESSION), []);
  const signOut = useCallback(() => setSession(null), []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      role: session?.role ?? null,
      permissions: session?.permissions ?? [],
      isAuthenticated: Boolean(session?.user),
      signIn,
      signOut,
    }),
    [session, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  /** A session object shaped like the future backend response, or null. */
  initialSession: PropTypes.shape({
    user: PropTypes.object,
    role: PropTypes.oneOf(ROLE_LIST),
    permissions: PropTypes.arrayOf(PropTypes.string),
  }),
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
