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
 *   getCollections()             getProducts(query) getBranches(query)
 *   getJournalArticles(query)    getActiveCampaign() getGoldRateBoard()
 *   getAiStudio()
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
    getBranches: PropTypes.func.isRequired,
    getJournalArticles: PropTypes.func.isRequired,
    getActiveCampaign: PropTypes.func.isRequired,
    getGoldRateBoard: PropTypes.func.isRequired,
    getAiStudio: PropTypes.func.isRequired,
  }),
  children: PropTypes.node.isRequired,
};

export function useDataProvider() {
  return useContext(DataContext);
}

export default DataProvider;
