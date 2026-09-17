/**
 * STAFF AUTHENTICATION SERVICE (Phase 9)
 * -----------------------------------------------------------------------------
 * The ONE staff sign-in boundary shared by Super Admin, Admin and Employee.
 * Credentials go in; the provider resolves which account they belong to and
 * returns a session shaped exactly like the future backend's response:
 *
 *   { user: { id, name, email, branchId }, role, permissions }
 *
 * The caller never chooses a role — the account decides it, and the login
 * flow redirects by `session.role`. Failures reject with administrator-
 * readable messages (unknown email, wrong password, disabled account), the
 * mock's stand-in for 401 responses.
 *
 * Flow: StaffLoginPage → useStaffLogin → staffAuthService → DataProvider →
 *       Mock Provider (store). Frontend role handling is UX only; real
 * authorization is enforced server-side.
 */
export const staffAuthService = {
  /** Resolve credentials to a staff session. Rejects when they do not match. */
  authenticate(provider, credentials) {
    return provider.authenticateStaff(credentials);
  },
};

export default staffAuthService;
