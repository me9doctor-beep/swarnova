/**
 * ORGANISATION GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * Platform-wide organisation control: the boutique branch network, the
 * administrator directory and platform-level visibility over employees.
 * Operational employee management (rosters, counters) deliberately stays in
 * the Admin/Employee domains — governance only sees and controls status.
 *
 * Phase 14.3 — the provider resolves the authenticated actor from its own
 * staff session for every call, so no method here carries actor identity or
 * authority from the browser. An Admin's employee creation derives the
 * branch from the Admin's own assignment provider-side; the Super Admin
 * names the branch.
 *
 * Flow: UI → useGovernanceBranches / useGovernanceAdmins / useGovernanceEmployees
 *       → organizationGovernanceService → DataProvider → Mock Provider → store.
 */
export const organizationGovernanceService = {
  getBranches(provider) {
    return provider.getGovernanceBranches();
  },
  setBranchStatus(provider, id, status) {
    return provider.setBranchStatus(id, status);
  },
  getAdmins(provider) {
    return provider.getGovernanceAdmins();
  },
  createAdmin(provider, data) {
    return provider.createGovernanceAdmin(data);
  },
  updateAdmin(provider, id, data) {
    return provider.updateGovernanceAdmin(id, data);
  },
  getEmployees(provider) {
    return provider.getGovernanceEmployees();
  },
  updateEmployee(provider, id, data) {
    return provider.updateGovernanceEmployee(id, data);
  },
  /**
   * Admin employee creation — the only staff-creation path open to Admins.
   * The provider enforces the hierarchy and derives the branch from the
   * authenticated Admin's own assignment; the Super Admin must name one.
   */
  createEmployee(provider, data) {
    return provider.createGovernanceEmployee(data);
  },
  getCapabilityProfiles(provider) {
    return provider.getCapabilityProfiles();
  },
};

export default organizationGovernanceService;
