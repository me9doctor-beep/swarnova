/**
 * GLOBAL SCROLL RESTORATION — architecture and destination-intent checks.
 *
 * Route-level resets must live once at the router root, never on pages.
 */
import "./support/browser-globals.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { resolveScrollAction } from "../components/layout/ScrollToTop.jsx";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const read = (relative) => readFileSync(join(SRC_DIR, relative), "utf8");

function sourceFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.jsx?$/.test(name) && !full.includes("__tests__")) out.push(full);
  }
  return out;
}

function intent(from, to, navigationType = "PUSH") {
  return resolveScrollAction({
    hash: to.hash ?? "",
    navigationType,
    pathname: to.pathname,
    search: to.search ?? "",
  });
}

test("scroll · ScrollToTop is the router root above every layout", () => {
  const router = read("app/router.jsx");
  assert.match(router, /import ScrollToTop from "\.\.\/components\/layout\/ScrollToTop\.jsx"/);
  assert.match(router, /<ScrollToTop\s*\/>/);
  assert.match(router, /children:\s*routeTree/);
});

test("scroll · the restoration component resets window and overflow containers", () => {
  const source = read("components/layout/ScrollToTop.jsx");
  assert.match(source, /ScrollRestoration/);
  assert.match(source, /useNavigationType/);
  assert.match(source, /window\.scrollTo\(0,\s*0\)/);
  assert.match(source, /#console-main/);
  assert.match(source, /#main/);
  assert.match(source, /data-scroll-container/);
  assert.match(source, /resolveScrollAction/);
  assert.doesNotMatch(source, /behavior:\s*"smooth"/);
});

test("1 · /products → /product/JWL-001 lands at scroll 0", () => {
  assert.equal(
    intent({ pathname: "/products" }, { pathname: "/product/JWL-001" }),
    "top"
  );
});

test("2 · /collections → /collections/:slug lands at scroll 0", () => {
  assert.equal(
    intent({ pathname: "/collections" }, { pathname: "/collections/bridal-gold" }),
    "top"
  );
});

test("3 · /account → /account/orders lands at scroll 0", () => {
  assert.equal(intent({ pathname: "/account" }, { pathname: "/account/orders" }), "top");
});

test("4 · /admin → /admin/orders resets console scroll", () => {
  assert.equal(intent({ pathname: "/admin" }, { pathname: "/admin/orders" }), "top");
  assert.match(read("components/layout/ConsoleShell.jsx"), /data-scroll-container/);
  assert.match(read("components/layout/ScrollToTop.jsx"), /#console-main/);
});

test("5 · /super-admin/* navigation resets scroll", () => {
  assert.equal(
    intent({ pathname: "/super-admin" }, { pathname: "/super-admin/products" }),
    "top"
  );
});

test("6 · /employee/* navigation resets scroll", () => {
  assert.equal(
    intent({ pathname: "/employee" }, { pathname: "/employee/orders" }),
    "top"
  );
});

test("7 · hash navigation keeps the target section reachable", () => {
  assert.equal(
    intent({ pathname: "/" }, { pathname: "/", hash: "#collections" }),
    "hash"
  );
  assert.equal(
    intent({ pathname: "/products" }, { pathname: "/products", hash: "#search" }),
    "hash"
  );
  assert.equal(
    intent({ pathname: "/" }, { pathname: "/our-story", hash: "#ai" }),
    "hash"
  );
});

test("8 · same-page hash navigation preserves anchors", () => {
  assert.equal(
    intent(
      { pathname: "/products", hash: "" },
      { pathname: "/products", hash: "#search" }
    ),
    "hash"
  );
  assert.equal(
    intent(
      { pathname: "/our-story", hash: "" },
      { pathname: "/our-story", hash: "#ai" }
    ),
    "hash"
  );
});

test("9 · query-string navigation is a new destination at scroll 0", () => {
  assert.equal(
    intent({ pathname: "/products" }, { pathname: "/products", search: "?q=gold" }),
    "top"
  );
  assert.equal(
    intent(
      { pathname: "/products" },
      { pathname: "/products", search: "?q=gold", hash: "#search" }
    ),
    "hash"
  );
});

test("scroll · Back/Forward without a hash restores history position", () => {
  assert.equal(
    intent({ pathname: "/product/JWL-001" }, { pathname: "/products" }, "POP"),
    "restore"
  );
  assert.equal(
    intent({ pathname: "/products" }, { pathname: "/", hash: "#collections" }, "POP"),
    "hash"
  );
});

test("scroll · pages do not own route-reset window.scrollTo", () => {
  const offenders = [];
  for (const file of sourceFiles(join(SRC_DIR, "pages"))) {
    const text = readFileSync(file, "utf8");
    if (/window\.scrollTo\s*\(/.test(text)) {
      offenders.push(file.replace(`${SRC_DIR}/`, ""));
    }
  }
  assert.deepEqual(offenders, [], "pages must not reset window scroll on navigation");
});

test("scroll · remaining scrollIntoView usages are in-page UX, not route resets", () => {
  const home = read("pages/customer/home/HomePage.jsx");
  assert.match(home, /scrollIntoView/);
  assert.match(home, /hash/);

  const studio = read("pages/customer/ai-studio/AiStudioPage.jsx");
  assert.match(studio, /getElementById\("atelier"\)\?\.scrollIntoView/);
  assert.doesNotMatch(studio, /window\.scrollTo/);

  const tryOn = read("pages/customer/virtual-try-on/VirtualTryOnPage.jsx");
  assert.match(tryOn, /getElementById\("fitting-room"\)\?\.scrollIntoView/);
  assert.match(tryOn, /getElementById\("try-on-change"\)\?\.scrollIntoView/);
  assert.doesNotMatch(tryOn, /window\.scrollTo/);
});
