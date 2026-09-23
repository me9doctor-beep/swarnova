/**
 * CUSTOMER NAVBAR — the storefront's primary navigation contract.
 * -----------------------------------------------------------------------------
 * The storefront's primary navigation is deliberately short: four destinations
 * a visitor can name from memory. Everything it no longer carries is still a
 * first-class destination — it is simply entered from where it belongs:
 *
 *   Jewellery        the Collections experience already IS the catalogue
 *   Virtual Try-On   entered from a product, a generated studio concept and
 *                    the customer's own saved fittings
 *   Our Story        reached from the footer and the homepage's own section
 *   Journal          reached from the footer and the homepage's own section
 *
 * These checks exist so a future edit cannot quietly re-add a fifth primary
 * slot, hardcode a second navigation array next to the first, or delete the
 * pages and doors that kept the removed entries reachable.
 *
 * Run from `frontend/`:
 *
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { site } from "../mock/data/site/index.js";
import { homepage } from "../mock/data/homepage/index.js";
import { journalArticles } from "../mock/data/journal/index.js";

const SRC_DIR = join(new URL(".", import.meta.url).pathname, "..");
const read = (relative) => readFileSync(join(SRC_DIR, relative), "utf8");

/** The final navbar: four destinations, in this order. */
const PRIMARY = [
  { label: "Home", href: "/#top" },
  { label: "Collections", href: "/#collections" },
  { label: "AI Studio", href: "/ai-studio" },
  { label: "Stores", href: "/#stores" },
];

/** Labels that were demoted out of the primary navigation. */
const DEMOTED = ["Jewellery", "Virtual Try-On", "Our Story", "Journal"];

const hrefsOf = (links) => links.map((link) => link.href);

test("navbar · the primary navigation is exactly Home, Collections, AI Studio, Stores", () => {
  assert.deepEqual(
    site.navigation.map(({ label, href }) => ({ label, href })),
    PRIMARY,
    "the primary navbar is Home | Collections | AI Studio | Stores and nothing else"
  );
});

test("navbar · no demoted destination keeps a primary slot", () => {
  const labels = site.navigation.map((item) => item.label);
  for (const label of DEMOTED) {
    assert.ok(!labels.includes(label), `${label} must not sit in the primary navbar`);
  }
  /* "Jewellery" pointed at the catalogue route the Collections experience
     already owns — the navbar must not carry that route twice. */
  assert.ok(
    !hrefsOf(site.navigation).includes("/collections"),
    "/collections is reached through Collections, not a duplicate entry"
  );
  assert.ok(
    !hrefsOf(site.navigation).includes("/virtual-try-on"),
    "Virtual Try-On is entered contextually, never from the global navbar"
  );
});

test("navbar · desktop and mobile render one source — no second configuration", () => {
  const header = read("components/layout/Header.jsx");

  assert.match(
    header,
    /site\.navigation\.map\(/,
    "the desktop nav maps `site.navigation` — the canonical list"
  );
  assert.match(
    header,
    /navigation=\{site\.navigation\}/,
    "the mobile menu is handed the same list, not a copy of it"
  );
  for (const label of DEMOTED) {
    assert.ok(
      !header.includes(`"${label}"`),
      `${label} must live in the data layer, never hardcoded in the navbar component`
    );
  }
});

test("navbar · the existing chrome is untouched — logo, actions, mobile menu, spacing", () => {
  const header = read("components/layout/Header.jsx");

  /* Header actions (search / wishlist / account / bag) stay exactly as they
     were, and the desktop nav keeps its type, casing and spacing tokens. */
  for (const label of ["Search", "Wishlist", "Account", "Shopping bag"]) {
    assert.match(header, new RegExp(`label: "${label}"`), `${label} action must remain`);
  }
  assert.match(header, /gap-5 2xl:gap-9/, "the navbar keeps its spacing scale");
  assert.match(header, /font-sans text-nav font-medium uppercase/, "the navbar keeps its type scale");
  assert.match(header, /aria-label="Primary"/, "the desktop nav keeps its landmark label");
  assert.match(header, /aria-label="Mobile primary"/, "the mobile nav keeps its landmark label");
  assert.match(header, /label="Open menu"/, "the mobile menu trigger is unchanged");
  assert.match(header, /label="Close menu"/, "the mobile menu close control is unchanged");
  assert.match(header, /useBodyScrollLock\(open\)/, "the mobile menu still locks background scroll");
});

test("routes · every demoted destination is still reachable, page and door", () => {
  const router = read("app/router.jsx");
  for (const path of ["virtual-try-on", "collections", "products", "ai-studio"]) {
    assert.match(
      router,
      new RegExp(`path: "${path}"`),
      `/${path} must keep its route — removing a navbar entry is not removing a page`
    );
  }

  /* Contextual Try-On: product detail, the studio's generated concept, and the
     customer's saved fittings all still hand over to the fitting room. */
  assert.match(read("components/product/ProductSummary.jsx"), /\/virtual-try-on\?product=/);
  assert.match(read("components/cards/ProductCard.jsx"), /\/virtual-try-on\?product=/);
  assert.match(read("pages/customer/ai-studio/AiStudioPage.jsx"), /\/virtual-try-on\?design=/);
  assert.match(read("pages/customer/account/SavedTryOnsPage.jsx"), /href="\/virtual-try-on"/);
  assert.ok(
    site.experience.some((link) => link.href === "/virtual-try-on"),
    "the footer's Experience column still opens Virtual Try-On"
  );

  /* Footer / editorial doors for the rest. */
  const quickLinks = hrefsOf(site.quickLinks);
  assert.ok(quickLinks.includes("/collections"), "the footer still links the catalogue");
  assert.ok(quickLinks.includes("/#our-story"), "the footer still links Our Story");
  assert.ok(quickLinks.includes("/#stores"), "the footer still links Stores");

  const sections = homepage.sections.map((section) => section.id);
  assert.ok(sections.includes("our-story"), "the homepage still carries the Our Story section");
  assert.ok(sections.includes("journal"), "the homepage still carries the Journal section");
  assert.ok(
    journalArticles.every((article) => article.href === "/#journal"),
    "journal cards still point at the homepage's Journal section"
  );
});
