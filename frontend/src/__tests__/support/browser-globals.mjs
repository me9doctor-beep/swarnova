/**
 * TEST HARNESS — the smallest browser surface a bundled module expects.
 *
 * `app/router.jsx` builds its router at module scope (`createBrowserRouter`),
 * which reads `window`/`document` the moment it is imported. Node has neither,
 * so a test that imports the real router installs these first. They are inert
 * by design: nothing in a static render touches them beyond the router's own
 * construction, and no test should grow to depend on richer DOM behaviour —
 * that is what `renderToStaticMarkup` is for.
 *
 * `localStorage` IS functional (a Map behind the same API), because the
 * owner-partitioned client state must round-trip for real in tests.
 */

const entries = new Map();
const history = {
  state: null,
  index: 0,
  length: 1,
  replaceState() {},
  pushState() {},
  go() {},
  back() {},
  forward() {},
};
const location = {
  pathname: "/",
  search: "",
  hash: "",
  key: "default",
  state: null,
  origin: "",
  href: "http://localhost/",
};

const win = {
  location,
  history,
  addEventListener() {},
  removeEventListener() {},
  scrollTo() {},
};

globalThis.window ??= win;
globalThis.document ??= {
  defaultView: win,
  addEventListener() {},
  removeEventListener() {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  body: {},
  documentElement: {},
};
globalThis.localStorage ??= {
  getItem: (key) => (entries.has(key) ? entries.get(key) : null),
  setItem: (key, value) => entries.set(key, String(value)),
  removeItem: (key) => entries.delete(key),
  clear: () => entries.clear(),
  key: (index) => [...entries.keys()][index] ?? null,
  get length() {
    return entries.size;
  },
};

/** The map behind the fake — tests that inspect storage do so through this. */
export const storedEntries = entries;
export const clearStorage = () => entries.clear();
