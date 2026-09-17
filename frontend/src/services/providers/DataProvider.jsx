import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import mockProvider from "./mock/mockProvider.js";

/**
 * DATA PROVIDER BOUNDARY
 * -----------------------------------------------------------------------------
 * The single seam between the presentation layer and whatever supplies data.
 * The application renders against the provider interface only; today that
 * interface is fulfilled by the mock provider, later by the API provider:
 *
 *   today :  UI → Hook → Service → Mock Provider → src/mock
 *   future:  UI → Hook → Service → API Provider  → backend
 *
 * To switch data sources, register the API provider below (or pass it as the
 * `provider` prop at the composition root) — no component changes required.
 *
 * Provider interface (all methods async):
 *   getSite()                    getHomepage()      getCategories()
 *   getCollections()             getProducts(query) getProduct(id)
 *   getBranches(query)           getJournalArticles(query)
 *   getActiveCampaign()          getGoldRateBoard() getAiStudio()
 *   getAiAtelier()               generateAiDesign(request)
 *   createAiVariations(id)       refineAiDesign(request)
 *   getTryOnRoom()               getTryOnSource(source)
 *   createTryOn(request)
 *
 * Phase 7 added the customer account contract; Phase 8 adds the Super Admin
 * governance contract (products lifecycle, media library, catalogue, content,
 * organisation, platform settings and audit); Phase 9 adds the shared staff
 * login and the Admin / head-office operations contract (orders, customers,
 * inventory, branches, employees, reports, business overview); Phase 10 adds
 * the Employee / branch operations contract — the counter-side reads and
 * actions, every one of them resolved and scoped from the session actor
 * store-side; Phase 11 adds the customer authentication contract — sign-in,
 * registration, session and password reset against the customer registry,
 * with every account read/write re-scoped to the session customer; Phase 12
 * adds the checkout & commerce contract — canonical delivery/payment
 * surfaces, the validated bag summary and the order-creating boundary, all
 * resolved from the session customer store-side. All are declared optional
 * so an API provider can land the sources independently.
 */
const DataContext = createContext(mockProvider);

export function DataProvider({ provider = mockProvider, children }) {
  return <DataContext.Provider value={provider}>{children}</DataContext.Provider>;
}

DataProvider.propTypes = {
  provider: PropTypes.shape({
    getSite: PropTypes.func.isRequired,
    getHomepage: PropTypes.func.isRequired,
    getCategories: PropTypes.func.isRequired,
    getCollections: PropTypes.func.isRequired,
    getProducts: PropTypes.func.isRequired,
    getProduct: PropTypes.func.isRequired,
    getBranches: PropTypes.func.isRequired,
    getJournalArticles: PropTypes.func.isRequired,
    getActiveCampaign: PropTypes.func.isRequired,
    getGoldRateBoard: PropTypes.func.isRequired,
    getAiStudio: PropTypes.func.isRequired,
    getAiAtelier: PropTypes.func.isRequired,
    generateAiDesign: PropTypes.func.isRequired,
    createAiVariations: PropTypes.func.isRequired,
    refineAiDesign: PropTypes.func.isRequired,
    getTryOnRoom: PropTypes.func.isRequired,
    getTryOnSource: PropTypes.func.isRequired,
    createTryOn: PropTypes.func.isRequired,
    getCustomerProfile: PropTypes.func,
    updateCustomerProfile: PropTypes.func,
    getCustomerAddresses: PropTypes.func,
    addCustomerAddress: PropTypes.func,
    updateCustomerAddress: PropTypes.func,
    deleteCustomerAddress: PropTypes.func,
    setDefaultCustomerAddress: PropTypes.func,
    getOrders: PropTypes.func,
    getOrder: PropTypes.func,
    /* Phase 8 — platform governance contract */
    getPlatformOverview: PropTypes.func,
    getGovernanceProducts: PropTypes.func,
    getGovernanceProduct: PropTypes.func,
    createGovernanceProduct: PropTypes.func,
    updateGovernanceProduct: PropTypes.func,
    transitionGovernanceProduct: PropTypes.func,
    getMediaLibrary: PropTypes.func,
    uploadMediaAsset: PropTypes.func,
    attachMediaToProduct: PropTypes.func,
    deleteMediaAsset: PropTypes.func,
    getGovernanceCategories: PropTypes.func,
    createGovernanceCategory: PropTypes.func,
    updateGovernanceCategory: PropTypes.func,
    getGovernanceCollections: PropTypes.func,
    createGovernanceCollection: PropTypes.func,
    updateGovernanceCollection: PropTypes.func,
    getGovernanceHomepage: PropTypes.func,
    updateHomepageSection: PropTypes.func,
    moveHomepageSection: PropTypes.func,
    getGovernanceCampaigns: PropTypes.func,
    updateCampaignStatus: PropTypes.func,
    getGovernanceBranches: PropTypes.func,
    setBranchStatus: PropTypes.func,
    getGovernanceAdmins: PropTypes.func,
    createGovernanceAdmin: PropTypes.func,
    updateGovernanceAdmin: PropTypes.func,
    getGovernanceEmployees: PropTypes.func,
    updateGovernanceEmployee: PropTypes.func,
    updateGoldRates: PropTypes.func,
    getPlatformSettings: PropTypes.func,
    updatePlatformSettings: PropTypes.func,
    getAuditLogs: PropTypes.func,
    /* Phase 9 — shared staff login & Admin operations contract */
    authenticateStaff: PropTypes.func,
    getAdminOverview: PropTypes.func,
    getAdminOrders: PropTypes.func,
    getAdminOrder: PropTypes.func,
    updateAdminOrderStatus: PropTypes.func,
    getAdminCustomers: PropTypes.func,
    getAdminCustomer: PropTypes.func,
    getAdminInventory: PropTypes.func,
    adjustInventoryStock: PropTypes.func,
    getInventoryMovements: PropTypes.func,
    getBranchOperations: PropTypes.func,
    getAdminReports: PropTypes.func,
    getCapabilityProfiles: PropTypes.func,
    createGovernanceEmployee: PropTypes.func,
    /* Phase 10 — Employee / branch operations contract */
    getEmployeeOverview: PropTypes.func,
    getEmployeeOrders: PropTypes.func,
    getEmployeeOrder: PropTypes.func,
    updateEmployeeOrderStatus: PropTypes.func,
    getEmployeeCustomers: PropTypes.func,
    getEmployeeCustomer: PropTypes.func,
    getEmployeeCatalogue: PropTypes.func,
    getEmployeeProduct: PropTypes.func,
    getEmployeeInventory: PropTypes.func,
    adjustEmployeeInventory: PropTypes.func,
    getEmployeeInventoryMovements: PropTypes.func,
    getEmployeeBranchOperations: PropTypes.func,
    getEmployeeReports: PropTypes.func,
    getEmployeeProfile: PropTypes.func,
    updateEmployeeProfile: PropTypes.func,
    /* Phase 11 — customer authentication contract */
    authenticateCustomer: PropTypes.func,
    registerCustomer: PropTypes.func,
    getCurrentCustomer: PropTypes.func,
    logoutCustomer: PropTypes.func,
    requestCustomerPasswordReset: PropTypes.func,
    resetCustomerPassword: PropTypes.func,
    /* Phase 12 — checkout & commerce contract */
    getDeliveryMethods: PropTypes.func,
    getPaymentMethods: PropTypes.func,
    getCheckoutSummary: PropTypes.func,
    placeOrder: PropTypes.func,
  }),
  children: PropTypes.node.isRequired,
};

export function useDataProvider() {
  return useContext(DataContext);
}

export default DataProvider;
