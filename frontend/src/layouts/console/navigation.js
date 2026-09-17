import { can } from "../../features/authentication/permissions.js";

/**
 * NAVIGATION VISIBILITY (Phase 9)
 * -----------------------------------------------------------------------------
 * A console's navigation is data (see `config.js`); this is the one rule that
 * turns that data into what a session may actually see. An item declaring a
 * `capability` only survives when the session holds it, and a group left with
 * no items disappears entirely — so an account never sees a door it cannot
 * open, and no experience ever renders another experience's modules.
 *
 * It lives outside the console component (a pure function over config +
 * permissions) so the rule can be tested and reasoned about on its own.
 */
export function filterNavigation(navigation, permissions) {
  return navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.capability || can(permissions, item.capability)),
    }))
    .filter((group) => group.items.length > 0);
}

export default filterNavigation;
