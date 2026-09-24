/** Typed intake operations. No customer ID claim is accepted from presentation. */
async function call(provider, method, ...args) {
  if (typeof provider[method] !== "function") {
    const error = new Error(
      "Requests are currently unavailable. Please try again later.",
    );
    error.code = "UNAVAILABLE";
    throw error;
  }
  return provider[method](...args);
}
export const intakeService = {
  options: (provider, kind) => call(provider, "getIntakeOptions", kind),
  create: (provider, kind, payload) =>
    call(provider, "createIntakeRequest", kind, payload),
  list: (provider, kind) => call(provider, "getIntakeRequests", kind),
  get: (provider, kind, id) => call(provider, "getIntakeRequest", kind, id),
  operations: (provider, actor, kind, query) =>
    call(provider, "getOperationalIntakeRequests", actor, kind, query),
};
