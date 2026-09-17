/**
 * ORGANISATION GOVERNANCE SERVICE (Phase 8)
 * -----------------------------------------------------------------------------
 * Platform-wide organisation control: the boutique branch network, the
 * administrator directory and platform-level visibility over employees.
 * Operational employee management (rosters, counters) deliberately stays in
 * the Admin/Employee domains — governance only sees and controls status.
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
};

export default organizationGovernanceService;
