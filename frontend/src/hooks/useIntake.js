import { useRef, useState } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { intakeService } from "../services/intakeService.js";
import { useAsync } from "./useAsync.js";
import { useCustomerAuth } from "../features/customer-auth/useCustomerAuth.js";

export function useIntake(kind, { mode = "list", id, actor, branchId } = {}) {
  const provider = useDataProvider();
  const pending = useRef(false);
  const { customer } = useCustomerAuth();
  const [submission, setSubmission] = useState({
    status: "idle",
    error: null,
    record: null,
  });
  const key = JSON.stringify([
    kind,
    mode,
    id,
    customer?.id,
    actor?.id,
    actor?.role,
    branchId,
  ]);
  const resource = useAsync(async () => {
    const data = await (() => {
      if (mode === "options") return intakeService.options(provider, kind);
      if (mode === "detail") return intakeService.get(provider, kind, id);
      if (mode === "operations")
        return intakeService.operations(provider, actor, kind, { branchId });
      return intakeService.list(provider, kind);
    })();
    return { key, data };
  }, [
    provider,
    kind,
    mode,
    id,
    customer?.id,
    actor?.id,
    actor?.role,
    branchId,
  ]);
  async function submit(payload) {
    if (pending.current) return;
    pending.current = true;
    setSubmission({ key, status: "loading", error: null, record: null });
    try {
      const record = await intakeService.create(provider, kind, payload);
      setSubmission({ key, status: "success", error: null, record });
    } catch (error) {
      setSubmission({ key, status: "error", error, record: null });
    } finally {
      pending.current = false;
    }
  }
  const current = resource.data?.key === key;
  // A route change can reuse this hook before useAsync starts its next effect.
  // Never render the previous owner, kind or list/detail shape during that frame.
  const currentSubmission =
    submission.key === key
      ? submission
      : { status: "idle", error: null, record: null };
  return {
    ...resource,
    status:
      resource.status === "success" && !current ? "loading" : resource.status,
    data: current ? resource.data.data : undefined,
    submission: currentSubmission,
    submit,
  };
}
