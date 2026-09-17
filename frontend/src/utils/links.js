/**
 * LINK RESOLUTION — the single rule for how an `href` written in canonical
 * content is rendered into the DOM.
 *
 * A root-relative path belongs to this SPA and must be navigated by the
 * router: the production artefact is one `index.html` (see
 * `vite-plugin-singlefile`), so a plain anchor would hand the browser a URL no
 * static host can answer, and would reload the document, the session state and
 * the scroll position for a link that never left the app.
 *
 * Everything else stays native and on purpose:
 *   `#section`  an in-page jump — the browser knows the target, the router does not
 *   `/x#anchor` a route (internal) whose hash the destination page reads
 *   `mailto:`   an OS hand-off
 *   `https://`  a genuine departure from the site, opened in a new tab
 */

/** A path this application owns and can navigate to without reloading. */
export function isInternalPath(href) {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}

/** A link that leaves the site for another host. */
export function isExternalUrl(href) {
  return typeof href === "string" && /^https?:\/\//.test(href);
}

/** Attributes a departing link needs so the new tab cannot reach back here. */
export const externalLinkProps = { target: "_blank", rel: "noopener noreferrer" };
