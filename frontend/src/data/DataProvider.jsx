import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import mockProvider from "./mockProvider.js";

/**
 * The data provider is the only seam between the presentation layer and the
 * data source. It currently injects the mock provider; swap it for an
 * `apiProvider` (same method signatures) when the backend is ready.
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
