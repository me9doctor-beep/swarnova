import { useCallback, useState } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { customerService } from "../services/customerService.js";
import { useAsync } from "./useAsync.js";

/**
 * Customer addresses hook.
 * Exposes mock CRUD interactions: get, add, update, delete, setDefault.
 */
export function useAddresses() {
  const provider = useDataProvider();
  const task = useCallback(() => customerService.getAddresses(provider), [provider]);
  const asyncState = useAsync(task, [provider]);
  const [busy, setBusy] = useState(false);

  const addAddress = useCallback(
    async (address) => {
      setBusy(true);
      try {
        const added = await customerService.addAddress(provider, address);
        asyncState.retry();
        return added;
      } finally {
        setBusy(false);
      }
    },
    [provider, asyncState]
  );

  const updateAddress = useCallback(
    async (address) => {
      setBusy(true);
      try {
        const updated = await customerService.updateAddress(provider, address);
        asyncState.retry();
        return updated;
      } finally {
        setBusy(false);
      }
    },
    [provider, asyncState]
  );

  const deleteAddress = useCallback(
    async (id) => {
      setBusy(true);
      try {
        await customerService.deleteAddress(provider, id);
        asyncState.retry();
      } finally {
        setBusy(false);
      }
    },
    [provider, asyncState]
  );

  const setDefault = useCallback(
    async (id) => {
      setBusy(true);
      try {
        await customerService.setDefaultAddress(provider, id);
        asyncState.retry();
      } finally {
        setBusy(false);
      }
    },
    [provider, asyncState]
  );

  return {
    ...asyncState,
    addresses: asyncState.data ?? [],
    addAddress,
    updateAddress,
    deleteAddress,
    setDefault,
    isBusy: busy,
  };
}

export default useAddresses;
