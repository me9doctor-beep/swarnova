/**
 * Editorial services — journal articles.
 */
export const editorialService = {
  getJournalArticles(provider, query) {
    return provider.getJournalArticles(query);
  },
};

export default editorialService;
