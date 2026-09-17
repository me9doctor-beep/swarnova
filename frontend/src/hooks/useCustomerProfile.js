import { useCallback, useState } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { customerService } from "../services/customerService.js";
import { useAsync } from "./useAsync.js";

/**
 * Customer profile hook.
 * Fetches profile from provider and supports mock editing with quiet feedback.
 */
export function useCustomerProfile() {
  const provider = useDataProvider();
  const task = useCallback(() => customerService.getProfile(provider), [provider]);
  const asyncState = useAsync(task, [provider]);
  const [updating, setUpdating] = useState(false);

  const updateProfile = useCallback(
    async (nextData) => {
      setUpdating(true);
      try {
        const updated = await customerService.updateProfile(provider, nextData);
        asyncState.retry();
        return updated;
      } finally {
        setUpdating(false);
      }
    },
    [provider, asyncState]
  );

  return {
    ...asyncState,
    profile: asyncState.data,
    updateProfile,
    isUpdating: updating,
  };
}

export default useCustomerProfile;
