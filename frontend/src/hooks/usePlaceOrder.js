import { useCallback, useRef, useState } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { checkoutService } from "../services/checkoutService.js";

/**
 * PLACE ORDER HOOK (Phase 12)
 * -----------------------------------------------------------------------------
 * Drives the ONE order-creating domain operation through the commerce
 * boundary, with the duplicate-submission guard the checkout contract asks
 * for: a submission while a previous one is still in flight is ignored —
 * the Place Order control disables too, and the provider's idempotency
 * ledger is the second line of defence.
 *
 * Status mirrors the checkout states the page renders:
 *   idle → processing → success | error
 * A failure (declined payment, stock change, provider outage) leaves the
 * bag untouched, so the customer can simply try again — with the SAME
 * idempotency key, exactly as the contract requires.
 */
export function usePlaceOrder() {
  const provider = useDataProvider();
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const inFlight = useRef(false);

  const placeOrder = useCallback(
    async (payload) => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setStatus("processing");
      setError(null);
      try {
        const response = await checkoutService.placeOrder(provider, payload);
        setResult(response);
        setStatus("success");
        return response;
      } catch (caught) {
        setError(caught ?? new Error("We could not place your order. Please try again."));
        setStatus("error");
        return null;
      } finally {
        inFlight.current = false;
      }
    },
    [provider]
  );

  const dismissError = useCallback(() => {
    setError(null);
    setStatus((previous) => (previous === "error" ? "idle" : previous));
  }, []);

  return {
    placeOrder,
    status,
    error,
    result,
    isProcessing: status === "processing",
    dismissError,
  };
}

export default usePlaceOrder;
