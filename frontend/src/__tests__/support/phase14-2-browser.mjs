import assert from "node:assert/strict";
// Optional browser checks; tooling lives outside project dependencies.
// Start Vite, then provide PLAYWRIGHT_MODULE, AXE_SCRIPT and (if needed)
// CHROMIUM_EXECUTABLE. BASE_URL defaults to the local frontend dev server.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
  args: ["--no-sandbox"],
  headless: true,
});
const baseURL = process.env.BASE_URL ?? "http://localhost:5173";
const page = await browser.newPage();
const errors = [];
const failedRequests = [];
page.on("requestfailed", (r) => {
  failedRequests.push(r.url());
  console.log("NETWORK", r.url(), r.failure()?.errorText);
});
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
async function nav(path) {
  await page.evaluate((path) => {
    history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
}
async function responsive(label) {
  for (const width of [375, 640, 768, 1024, 1280, 1536]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false, `${label} overflow at ${width}`);
  }
  console.log("RESPONSIVE", label, "6 widths passed");
  await page.addScriptTag({ path: process.env.AXE_SCRIPT });
  const result = await page.evaluate(
    async () =>
      await axe.run(document.querySelector("[data-intake-content]"), {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
      }),
  );
  assert.deepEqual(result.violations, [], label + " accessibility");
  console.log("AXE", label, "no WCAG A/AA violations in new content");
}
for (const path of [
  "/appointments?type=FITTING",
  "/account/service-requests/new",
]) {
  await page.goto(baseURL + path);
  await page.waitForURL("**/login?**");
  assert.equal(new URL(page.url()).searchParams.get("returnTo"), path);
}
await page.goto(baseURL + "/custom-jewellery?productId=JWL-001");
await page.waitForURL("**/login?**");
await page.getByLabel("Email or phone number").fill("aadya.sharma@swarnova.in");
await page.locator("input[type=password]").fill("Swarnova@123");
await page.locator("button[type=submit]").first().click();
await page.getByLabel("Jewellery type").waitFor();
assert.equal(await page.locator("[name=productId]").inputValue(), "JWL-001");
await responsive("custom form");
await page.getByLabel("Jewellery type").fill("Anniversary ring");
await page
  .getByLabel("Your vision and requirements")
  .fill("A quiet gold ring with a small ruby.");
await page.getByRole("button", { name: "Submit request", exact: true }).click();
await page
  .getByRole("heading", { name: "Your request has been recorded" })
  .waitFor();
await page.getByRole("link", { name: "View request", exact: true }).click();
await page.getByRole("heading", { name: "REQ-000001", exact: true }).waitFor();
assert.match(await page.locator("main").innerText(), /SUBMITTED/);
await responsive("custom detail");
await nav("/account/custom-requests");
await page.getByRole("link", { name: "REQ-000001", exact: true }).waitFor();
await nav("/appointments?type=FITTING&branchId=BR-001");
await page.getByLabel("Boutique").waitFor();
assert.equal(await page.locator("[name=type]").inputValue(), "FITTING");
await responsive("appointment form");
await page.getByLabel("Preferred date").fill("2099-10-01");
await page.getByLabel("Preferred time").fill("14:30");
await page.getByRole("button", { name: "Submit request", exact: true }).click();
await page
  .getByRole("heading", { name: "Your request has been recorded" })
  .waitFor();
await page.getByRole("link", { name: "View request", exact: true }).click();
await page.getByRole("heading", { name: "REQ-000002", exact: true }).waitFor();
assert.match(await page.locator("main").innerText(), /REQUESTED/);
await responsive("appointment detail");
await nav("/account/service-requests/new");
await page.getByLabel("Your order").waitFor();
await page.getByLabel("Your order").selectOption({ index: 1 });
await page.getByLabel("Your piece").selectOption({ index: 1 });
await responsive("service form");
await page.getByLabel("Reason").fill("Care advice");
await page
  .getByLabel("How can we help?")
  .fill("Please advise on cleaning this piece.");
await page.getByRole("button", { name: "Submit request", exact: true }).click();
await page
  .getByRole("heading", { name: "Your request has been recorded" })
  .waitFor();
await page.getByRole("link", { name: "View request", exact: true }).click();
await page.getByRole("heading", { name: "REQ-000003", exact: true }).waitFor();
await responsive("service detail");
for (const segment of ["custom-requests", "appointments", "service-requests"]) {
  await nav("/account/" + segment);
  await page.locator('main ul a[href*="REQ-"]').first().waitFor();
  await responsive(segment + " list");
}
await nav("/account/custom-requests/unknown");
await page
  .getByText("This request could not be found in your account.")
  .waitFor();
console.log("CUSTOMER workflows/list/detail/not-found passed");
await nav("/staff/login");
await page.getByLabel("Email address").fill("superadmin@swarnova.in");
await page.locator("input[type=password]").fill("Swarnova@123");
await page.locator("button[type=submit]").first().click();
await page.waitForURL("**/super-admin");
for (const segment of ["custom-requests", "appointments", "service-requests"]) {
  await nav("/super-admin/" + segment);
  await page.locator("details summary").first().waitFor();
  await page.locator("details summary").first().click();
  await responsive("super-admin " + segment);
}
console.log("SUPER ADMIN shared records passed");
console.log("ERRORS", JSON.stringify(errors));
assert.equal(
  errors.filter((e) => !e.startsWith("Failed to load resource:")).length,
  0,
);

// Reloads resolve deep links through Vite's SPA fallback. The canonical mock
// book intentionally resets, so list/detail expectations reflect that lifetime.
for (const path of [
  "/custom-jewellery",
  "/appointments",
  "/account/service-requests/new",
]) {
  await page.goto(baseURL + path);
  await page.locator("[data-intake-content] form").waitFor();
}
for (const segment of ["custom-requests", "appointments", "service-requests"]) {
  await page.goto(baseURL + "/account/" + segment);
  await page
    .getByText(
      "No requests yet. When you submit one, its details and status will appear here.",
    )
    .waitFor();
  await page.goto(baseURL + "/account/" + segment + "/unknown");
  await page
    .getByText("This request could not be found in your account.")
    .waitFor();
}
console.log(
  "CUSTOMER direct reloads: all create/list/detail route families passed",
);
for (const [role, email] of [
  ["admin", "arpita.mohanty@swarnova.in"],
  ["employee", "meera.das@swarnova.in"],
]) {
  await page.goto(baseURL + "/staff/login");
  await page.getByLabel("Email address").fill(email);
  await page.locator("input[type=password]").fill("Swarnova@123");
  await page.locator("button[type=submit]").first().click();
  await page.waitForURL("**/" + role);
  for (const segment of [
    "custom-requests",
    "appointments",
    "service-requests",
  ]) {
    await nav("/" + role + "/" + segment);
    await page.getByText("No requests in your permitted scope.").waitFor();
  }
  console.log("STAFF", role, "all routes passed");
}
assert.ok(
  failedRequests.every(
    (url) =>
      url.startsWith("https://fonts.googleapis.com/") ||
      url.startsWith("https://fonts.gstatic.com/"),
  ),
  "No application resource failures",
);
assert.equal(
  errors.filter((e) => !e.startsWith("Failed to load resource:")).length,
  0,
);
console.log(
  "FINAL: no application errors; any network errors above are external Google Fonts",
);
await browser.close();
