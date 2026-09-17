import { useCallback, useEffect, useState } from "react";
import { useCustomerAuth } from "../features/customer-auth/useCustomerAuth.js";

/**
 * OWNER-SCOPED CLIENT STATE (Phase 11)
 * ----------------------------------------------------------------------------
 * The wishlist, bag, saved designs and saved try-ons are still client-side
 * collections — but they are no longer one anonymous pile. Every collection
 * is partitioned by owner:
 *
 *   guest        → the signed-out visitor's collection
 *   <customerId> → that customer's collection
 *
 * Partitions persist per owner (local development storage; the future
 * backend persists them server-side against the authenticated customer), so
 * Customer A never sees Customer B's collection on a shared browser, and a
 * refresh keeps the signed-in customer's collection intact.
 *
 * The ONLY cross-owner rule is the guest adoption: when a guest with a
 * non-empty collection signs into an account whose collection is empty, the
 * guest collection moves into the account once — the bag the visitor packed
 * follows them in. No merge behaviour beyond that exists, because the source
 * of truth specifies none; a future backend can reconcile server-side.
 */

export const GUEST_OWNER_ID = "guest";

/** The partition key for the current visitor — their customer id, or guest. */
export function ownerIdFor(customer) {
  return customer?.id ?? GUEST_OWNER_ID;
}

/** Storage key for one owner's partition of one domain collection. */
export function ownerStorageKey(domain, ownerId) {
  return `swarnova.${domain}.${ownerId ?? GUEST_OWNER_ID}`;
}

export function loadOwnerState(domain, ownerId, fallback) {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(ownerStorageKey(domain, ownerId));
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveOwnerState(domain, ownerId, state) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      ownerStorageKey(domain, ownerId),
      JSON.stringify(state ?? null)
    );
  } catch {
    /* Storage full / private browsing — the in-memory collection still holds. */
  }
}

export function clearOwnerState(domain, ownerId) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(ownerStorageKey(domain, ownerId));
  } catch {
    /* Nothing to clear. */
  }
}

/**
 * Pure owner-swap rule: which value the new partition shows when the visitor
 * signs in, out or switches accounts. A guest collection moves into a fresh
 * account once (`moved: true`); every other swap simply loads the new
 * owner's stored partition.
 */
export function resolveOwnerValue({
  previousOwnerId,
  previousValue,
  storedValue,
  isEmpty,
}) {
  const empty = typeof isEmpty === "function" ? isEmpty : (value) => !value;
  if (
    previousOwnerId === GUEST_OWNER_ID &&
    empty(storedValue) &&
    !empty(previousValue)
  ) {
    return { value: previousValue, moved: true };
  }
  return { value: storedValue, moved: false };
}

/**
 * Collection state partitioned by owner. Behaves like `useState` for the
 * current owner: signing in, out or across accounts swaps the visible
 * partition (with the one-time guest adoption), and every change persists
 * to the current owner's partition.
 *
 *   const [items, setItems] = useOwnerScopedState("cart", {
 *     initial: [],
 *     serialize: (live) => live,
 *     deserialize: (stored) => stored,
 *     isEmpty: (live) => live.length === 0,
 *   });
 */
export function useOwnerScopedState(
  domain,
  { initial, serialize, deserialize, isEmpty }
) {
  const { customer } = useCustomerAuth();
  const ownerId = ownerIdFor(customer);

  const [state, setState] = useState(() => ({
    ownerId,
    value: deserialize(loadOwnerState(domain, ownerId, serialize(initial))),
  }));

  /* Owner changed mid-visit (sign-in / sign-out / account switch): swap the
     visible partition during render — the endorsed derived-state pattern —
     so no frame ever shows the previous owner's collection. */
  if (state.ownerId !== ownerId) {
    const stored = deserialize(
      loadOwnerState(domain, ownerId, serialize(initial))
    );
    const { value, moved } = resolveOwnerValue({
      previousOwnerId: state.ownerId,
      previousValue: state.value,
      storedValue: stored,
      isEmpty,
    });
    if (moved) clearOwnerState(domain, GUEST_OWNER_ID);
    setState({ ownerId, value });
  }

  useEffect(() => {
    saveOwnerState(domain, state.ownerId, serialize(state.value));
  }, [domain, state.ownerId, state.value, serialize]);

  /* Stable across renders — functional updates never close over state — so
     consumer callbacks memoised on it keep the stability they had before. */
  const setValue = useCallback(
    (updater) =>
      setState((previous) => ({
        ...previous,
        value:
          typeof updater === "function" ? updater(previous.value) : updater,
      })),
    []
  );

  return [state.value, setValue];
}

export default useOwnerScopedState;
