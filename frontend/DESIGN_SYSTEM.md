# SWARNOVA — DESIGN SYSTEM (Phase 1)

One design system, four experiences. The tokens, primitives and shells in this
document are shared by the **Customer** storefront, **Admin**, **Super Admin**
and **Employee** consoles; the experiences differ in *composition and density*,
never in their UI vocabulary.

```
                         SWARNOVA DESIGN SYSTEM
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
        CUSTOMER              CONSOLE              FEATURES
             │                    │                    │
             │          ┌─────────┼─────────┐          │
             │        ADMIN   SUPER ADMIN EMPLOYEE     │
             └──────────┴─────────┴─────────┴──────────┘
                                  │
                           Shared Components
                                  │
                       Tokens + UI Primitives
```

Everything below lives in `frontend/src`. Tokens are declared once, in
`src/index.css`; components consume them through Tailwind utilities.

---

## 1. Tokens

### 1.1 Colour — two layers

**Layer 1 — brand palette** (the only place literal colour values exist):

| Token | Value | Role |
| --- | --- | --- |
| `--color-paper` | `#ffffff` | primary foundation |
| `--color-ivory` | `#f8f3ea` | warm ivory surface |
| `--color-cream` | `#f2ead9` | soft cream surface |
| `--color-sand` | `#e7dbc4` | deeper neutral |
| `--color-champagne` | `#d8bf93` | soft muted gold |
| `--color-gold-soft` | `#c6a86f` | muted gold |
| `--color-gold` | `#b28a45` | jewellery gold (accent) |
| `--color-gold-deep` | `#8d6c33` | gold for text on light |
| `--color-wine` | `#4d1220` | brand burgundy |
| `--color-wine-soft` | `#63202f` | burgundy hover |
| `--color-wine-deep` | `#3a0c17` | deepest burgundy |
| `--color-ink` | `#2f2a25` | dark charcoal text |
| `--color-ash` | `#70665b` | secondary text |
| `--color-mist` | `#a19687` | muted text |
| `--color-line` | `#e8ddca` | hairline border |
| `--color-line-light` | `#f0e8d9` | softer hairline |

**Layer 2 — semantic tokens** (what components use):

| Token | Maps to | Utility examples |
| --- | --- | --- |
| `--color-surface-primary` | paper | `bg-surface-primary` |
| `--color-surface-secondary` | ivory | `bg-surface-secondary` |
| `--color-surface-muted` | cream | `bg-surface-muted` |
| `--color-surface-inverse` | wine | `bg-surface-inverse` |
| `--color-surface-inverse-deep` | wine-deep | `bg-surface-inverse-deep` |
| `--color-text-primary` | ink | `text-text-primary` |
| `--color-text-secondary` | ash | `text-text-secondary` |
| `--color-text-muted` | mist | `text-text-muted` |
| `--color-text-inverse` | cream | `text-text-inverse` |
| `--color-brand-primary` | wine | `bg-brand-primary`, `border-brand-primary` |
| `--color-brand-primary-strong` | wine-deep | `hover:bg-brand-primary-strong` |
| `--color-brand-primary-soft` | wine-soft | — |
| `--color-brand-accent` | gold | `border-brand-accent/45` |
| `--color-brand-accent-strong` | gold-deep | `text-brand-accent-strong` |
| `--color-brand-accent-soft` | champagne | `text-brand-accent-soft` |
| `--color-border-default` | line | `border-border-default` |
| `--color-border-subtle` | line-light | `border-border-subtle` |
| `--color-state-success` / `-soft` | `#3f6b4f` / `#edf3ec` | `text-state-success` |
| `--color-state-warning` / `-soft` | `#8a6218` / `#faf2e2` | `text-state-warning` |
| `--color-state-error` / `-soft` | `#9b2f28` / `#f9ece7` | `text-state-error` |
| `--color-state-info` / `-soft` | `#42616b` / `#eef3f4` | `text-state-info` |
| `--color-focus` | gold | global `:focus-visible` outline |

Rules: gold is restrained (accent, not decoration); no blue/purple AI hues, no
neon; borders are `1px` and neutral unless a gold hairline is intentional.

**Where each vocabulary is used.** Shared primitives, the cards' surface/media
chrome, the console shell and the console screens consume the semantic layer.
The storefront migrated to the semantic layer in Phase 2 (customer homepage
refinement); only deliberate neutrals remain raw — the hero photograph fallback
`bg-ink`, the newsletter field's `border-ink` and the header's `text-white`
chrome over imagery, none of which has a semantic alias. The two vocabularies
resolve to the same values — the semantic layer is an alias of the palette,
never a parallel set of colours.

### 1.2 Typography

Families (from Phase 0, unchanged): `--font-serif` = Cormorant Garamond for
display and headings, `--font-sans` = Jost for UI and body.

| Token | Size | Line height | Extra | Utilities |
| --- | --- | --- | --- | --- |
| `--text-display` | 44px | 1.12 | | `text-display` |
| `--text-h1` | 34px | 1.14 | | `text-h1` |
| `--text-h2` | 28px | 1.2 | | `text-h2` |
| `--text-h3` | 22px | 1.3 | | `text-h3` |
| `--text-h4` | 18px | 1.35 | | `text-h4` |
| `--text-body-lg` | 16px | 1.8 | | `text-body-lg` |
| `--text-body` | 14px | 1.75 | | `text-body` |
| `--text-body-sm` | 13px | 1.7 | | `text-body-sm` |
| `--text-caption` | 12px | 1.6 | | `text-caption` |
| `--text-nav` | 11px | 1.4 | 0.18em | `text-nav` |
| `--text-label` | 10px | 1.5 | 0.18em, 500 | `text-label` |
| `--text-price` | 15px | 1.75 | 0.025em | `text-price` |
| Eyebrow | 11px | — | 0.34em, 500, uppercase | `.eyebrow` + `Eyebrow` component |

Serif carries heritage (headings, editorial), sans-serif carries usability
(navigation, body, controls, console). Readability wins over decoration — the
scale is never used decoratively.
Phase 2 will map the storefront's editorial type onto this scale; the homepage
sizes were left untouched in Phase 1.

### 1.3 Spacing

The scale is Tailwind's 4px step, used in the approved set
**4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 120**
(`1 2 3 4 5 6 8 10 12 16 20 24 30` in utilities). Two semantic aliases cover
the values components actually repeat:

| Token | Value | Utility |
| --- | --- | --- |
| `--spacing-gutter` | 20px | `px-gutter` — page and shell gutters |
| `--spacing-panel` | 24px | `p-panel` — card and panel padding |

### 1.4 Radius

| Token | Value | Utility | Used by |
| --- | --- | --- | --- |
| `--radius-sm` | 2px | `rounded-sm` | buttons, icon buttons, inputs, selects, badges |
| `--radius-md` | 4px | `rounded-md` | floating surfaces (topbar account menu) |
| `--radius-lg` | 6px | `rounded-lg` | available for larger surfaces |
| `--radius-pill` | 999px | `rounded-pill` | status dots, count bubbles, avatars |

Pills are only for status, tags, filters and compact metadata — never for CTAs.
Large surfaces (cards, panels, shells) stay square/refined.

### 1.5 Elevation

| Token | Utility | Use |
| --- | --- | --- |
| — | — | default: spacing, typography, imagery, hairlines |
| `--shadow-subtle` | `shadow-subtle` | floating menus (account menu) |
| `--shadow-medium` | `shadow-medium` | reserved for overlays that must separate |

The storefront uses no shadows; consoles use elevation only where hierarchy
requires it.

### 1.6 Breakpoints

Tailwind defaults, no new breakpoints:

| Name | Min width | Covers |
| --- | --- | --- |
| (base) | 0 | Mobile 375px |
| `sm` | 640px | Large mobile |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop / console sidebar rail |
| `xl` | 1280px | Desktop / storefront primary nav |
| `2xl` | 1536px | Large desktop |

---

## 2. Primitives

All under `src/components/ui` (shared) and `src/components/layout` (chrome).

| Component | Responsibility | Key API |
| --- | --- | --- |
| `Button` | every action, all experiences | `variant` = `primary` `secondary` `outline` `outlineInverse` `ghost` `link` `danger` `success`, `size` = `sm` `md`, `href` |
| `IconButton` | icon-only actions (search, wishlist, bag, notifications, sidebar/menu, row actions) | `label` (required, becomes the accessible name), `variant` = `plain` `outline` `inverse` `solid`, `size` = `sm` `md` `touch`, `badge`, `href` |
| `Input` | every text field | `label` `hint` `error` `required` `disabled` `readOnly` `size` |
| `Select` | dropdown / filter (native `<select>`, no library) | `label` `hint` `error` `disabled` `size`, options as children |
| `Field` | label + control + hint/error shell shared by Input, Select and future field primitives | `label` `htmlFor` `hint` `error` `hintId` `errorId` |
| `Badge` | status / tag / metadata | `variant` = `neutral` `brand` `success` `warning` `error` `info`, `dot` |
| `Card` + `Card.Media` + `Card.Body` | the one surface foundation, composed by specialised cards | `interactive`; Media: `ratio` `href` `ariaLabel` `overlay`; Body: `padding` |
| `Container` | page width and gutters | `size` = `default` `narrow` `wide` `full`, `as` |
| `SectionHeading` | editorial section heading | `eyebrow` `title` `description` `align` `tone` `ornament` `action` `headingLevel` |
| `Section` | storefront section rhythm and background | `background` `id` `as` |
| `Eyebrow`, `TextLink`, `Price`, `Rating`, `BrandMark`, `SocialIcon`, `Icon` | retained from Phase 0, reused everywhere | — |
| `EmptyState` | "nothing here yet / no results" panel | `title` `children` `action` |
| `SkipLink` | first tab stop of every experience, jumps to `<main>` | `href` (default `#main`) |
| `AsyncBoundary`, `ErrorBoundary` | loading / error / empty states and render-failure safety | — |
| `PageHeader` (layout) | page identity inside a console: the screen's single `<h1>`, description, page actions | `eyebrow` `title` `description` `actions` |

Specialised cards in `src/components/cards` (`ProductCard`, `CollectionCard`,
`BranchCard`, `JournalCard`) compose `Card`; there is no per-experience card or
button.

Icons: `lucide-react` only — one icon language for all four experiences.
`Icon` remains the string-keyed registry used by CMS data.

### Density

Same tokens, contextual composition:

| | Storefront | Console |
| --- | --- | --- |
| Rhythm | `Section` py-16/20/24, editorial measure (1280px) | compact shell, 1536px work area |
| Type | display → body sizes, generous leading | `text-label`/`text-nav`/`text-body-sm` for chrome, `text-h2` page titles |
| Controls | `size="md"` (44px, thumb-friendly) | `size="sm"` (32px) in dense rows, `touch` (44px on phones) for triggers/handheld screens |
| Surfaces | hairlines, no shadow | hairlines, `shadow-subtle` on floating menus |

---

## 3. Layout architecture

```
CustomerLayout                 ConsoleShell (+ ConsoleSidebar / ConsoleTopbar)
  ├── Header                       ├── Sidebar   brand · experience · nav groups · utility area
  ├── <main><Outlet/></main>        ├── Topbar    breadcrumb · actions · identity
  └── Footer                       └── <main> Container(wide) <Outlet/>
```

* **`CustomerLayout`** — storefront chrome: shared `SkipLink`, fixed `Header`,
  `<main>` landmark, wine `Footer`. Unchanged in Phase 1 apart from consuming the
  shared primitives (`Container`, `Button`, `IconButton`, `Eyebrow`).
* **`ConsoleShell`** — the only console shell. Renders `ConsoleSidebar`,
  `ConsoleTopbar` and the page content; owns the mobile drawer state and the
  body scroll lock. Configured entirely by props: experience label, home path,
  navigation groups, role label, session user, sign-out, topbar actions.
* **`ConsoleExperience`** (`layouts/console/`) — resolves one experience's
  configuration and session, then renders `ConsoleShell` around the route's
  page. It exists once so the three experiences do not repeat the wiring.
* **`AdminLayout` / `SuperAdminLayout` / `EmployeeLayout`** — thin route-level
  composition points, each one line: `<ConsoleExperience role={ROLES.X} />`.
  They stay separate because each experience will add its own providers and
  routing, and they make the ownership of each route group explicit.

---

## 4. Navigation architecture

Navigation is data, not components — `src/layouts/console/config.js`:

```js
export const CONSOLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: "Admin",
    homePath: "/admin",
    navigation: [
      { label: "Group heading (optional)", items: [{ label, to, end, icon }] },
    ],
  },
  [ROLES.SUPER_ADMIN]: { … },
  [ROLES.EMPLOYEE]: { … },
};
```

* **One sidebar** renders every experience: brand, experience label, navigation
  groups, items (icon, label, route, active state) and the bottom utility area.
  There is no `AdminSidebar` / `SuperAdminSidebar` / `EmployeeSidebar`.
  Below `lg` it is the off-canvas drawer; when closed it is `invisible`, not just
  translated, so its links never sit in the tab order while off-screen. Escape
  and the backdrop both close it, and it locks background scrolling.
* **Active state** comes from `NavLink` + the item's `end` flag.
* **Collapsed rail** is deliberately not implemented: no screen needs it yet and
  it would add state for no benefit. If the console later needs it, it becomes a
  prop of the one sidebar.
* **Breadcrumbs** are declared next to their route —
  `handle: { crumb: "Overview" }` in `app/router.jsx` — and read by the topbar
  via `useMatches()`. Pages never push a title into the shell; the page's own
  identity is `PageHeader`.
* **Topbar actions** (search, notifications, quick actions) arrive through the
  `actions` prop; the account area renders the `user` object as a native
  `<details>` account menu (keyboard operable, Escape closes) and falls back to
  role/session badges when no session exists. Nothing forces an experience to
  use every element.

---

## 5. Rules for the next phases

1. **Reuse before create.** Look in `components/ui` and `components/layout`
   first; extend a primitive rather than adding a variant per page.
2. **No per-role copies** of buttons, cards, tables or shells.
3. **Meaning over appearance.** `variant="success"`, not `green`; semantic
   tokens, not hex values or raw palette names in new code.
4. **Composition over configuration.** Specialised cards compose `Card`; avoid
   components with a dozen props.
5. **No backend assumptions.** Components take data through props
   (`<ProductCard product={…} />`); data access stays in
   `hooks → services → provider`. Nothing in `src/components` touches
   `src/mock`.
6. **Accessibility is part of the primitive**: real `<button>`/`<label>`,
   accessible names on icon buttons, visible focus from the global
   `:focus-visible` rule, native semantics before ARIA.
7. **No animation system.** Simple state changes only.
8. **Nothing is built before its screen exists** — the primitives that are
   waiting for consumers are listed in the Phase 1 delivery notes.

Deliberately **not** built in Phase 1: data tables (`Table`) and its sorting,
pagination and row actions belong to the Admin/Super Admin phases; a modal /
drawer framework — no screen needs one yet, the console drawer is the sidebar's
own concern; a form framework; TypeScript.

---

## 6. Phase 1 delivery notes

**Refined rather than replaced** (Phase 0 components that already existed):
`Button` (added `secondary`, `link`, `danger`, `success`; reordered variant/
size merge so a variant may own its padding), `Container` (`size`),
`SectionHeading` (`action`), `ErrorBoundary` (reuses `Button`), `Header`
(consumes `Container`, `IconButton`, `useBodyScrollLock`, nav type token),
`Footer` (consumes `Container`, `Eyebrow`), the four storefront cards (compose
`Card` / `Card.Media` / `Card.Body`), `ProductCard` wishlist action (shared
`IconButton`), `ConsoleShell` (rebuilt around the two extracted console regions).

**Created** (nothing else existed to refine): `IconButton`, `Input`, `Select`,
`Field`, `Badge`, `Card`, `EmptyState`, `SkipLink`, `useBodyScrollLock`,
`ConsoleSidebar`, `ConsoleTopbar`, `PageHeader`, `layouts/console/config.js`,
`layouts/console/ConsoleExperience.jsx`.

**Consolidated**: three duplicated dashboard page headers → `PageHeader` +
`EmptyState`; three duplicated console shells and sidebars → one
`ConsoleShell` + one sidebar driven by `CONSOLE_CONFIG`; two body-scroll-lock
implementations → one hook; two skip links → one `SkipLink`.

**Deliberately not built in Phase 1** — each waits for its first real screen:

| Not built | Why |
| --- | --- |
| Data table / sorting / pagination | No console module renders rows yet. The table foundation belongs to the Admin/Super Admin phases, built once on `Card` + `Badge` + `Input`/`Select`. |
| Modal / drawer framework | No screen needs one. The console drawer is the sidebar's own concern; the storefront's mobile menu is a full-screen panel. |
| Collapsible sidebar rail | No screen needs it; it would add persistent state for no user benefit yet. It becomes a prop of the single sidebar when a screen wants it. |
| Tabs, steppers, timeline | Feature inventories, not foundations. |
| A second form primitive set | `Input`, `Select` and `Field` cover the current need; textarea/checkbox/radio arrive with the forms that use them. |
| `NewsletterForm` migration to `Input` | Its field is an inline *group* (container owns the border, the arrow is an in-field adornment, the error message renders outside the field), which `Input` cannot express without a bare/group mode. Rewriting it would change the storefront's newsletter; it migrates with the storefront refinement instead. |

**Validation snapshot** (`npm run build`, Phase 1):

| Check | Result |
| --- | --- |
| Production build | passes — 3,156 kB single file (Phase 0: 3,136 kB), 2,162 kB gzip |
| TypeScript | zero `.ts` / `.tsx` / `tsconfig` files; the unused TS dev-dependencies were removed from `package.json` |
| Routes | `/`, `/admin`, `/super-admin`, `/employee`, unknown path — all render (verified by dev-server response and by rendering each route through `react-dom/server`) |
| Homepage stability | baseline vs Phase 1 element-tree comparison: every changed class-set is either a palette→semantic alias (proven to emit identical CSS), the header's icon-action normalisation, or the removal of a redundant wrapper; nothing else moved |
| Mock architecture | untouched; no component imports `src/mock` or `src/services` |
| Accessibility | one `h1` per page, skip link in both experiences, every icon action labelled, `aria-current` on active navigation and breadcrumb, visible focus from one global rule, native elements before ARIA |

---

## 7. Phase 2 delivery notes — customer homepage refinement

Phase 2 performed the storefront migration the tokens were built for, without
touching the console experiences, the data architecture or the mock boundary.

**Semantic colour migration.** Every customer-facing component (homepage
sections, the four cards, `NewsletterForm`, `Header`, `Footer`) and the shared
primitives that still used raw palette names (`Section`, `SectionHeading`,
`Eyebrow`, `TextLink`, `Rating`, `BrandMark`, `AsyncBoundary`, `ErrorBoundary`,
`SkipLink`) now consume the semantic layer (`bg-surface-*`, `text-text-*`,
`text-brand-*`, `border-border-*`, `divide-brand-accent`, `fill-brand-accent`,
gradient stops). Values are unchanged — the migration swaps names, not colours.
Remaining raw usages are deliberate neutrals with no semantic alias: the hero
photograph fallback `bg-ink`, the newsletter field's `border-ink`, and the
header's `text-white` chrome over imagery.

**Typography mapped onto the scale.** Storefront editorial type now uses the
semantic scale: section headings ramp `text-h2 → text-h1 → text-display`,
split-section titles `text-h1 → text-display`, card titles `text-h3`/`text-h4`,
body copy `text-body-lg`/`text-body`/`text-body-sm`, micro labels
`text-label`/`text-nav`/`text-caption`. The hero keeps one documented one-off
display step (`lg:text-[3.5rem]`, 56px) above `text-display` — the single
editorial exception, held in the section rather than the token system.

**Composition.** The collection grid became frameless editorial tiles
(imagery + centred label + gold hairline, no card frame); the trust strip and
wine promise icons were quieted to 24/28px; section gutters and grid gaps were
normalised to the approved spacing set; the newsletter gained the house
ornament; the duplicated hard-coded try-on caption was removed from the
component (the copy lives in the data layer); the hero's desktop header
clearance moved from arbitrary inline padding into the `hero__copy-inner`
media block.

**Validation snapshot** (`npm run build`, Phase 2):

| Check | Result |
| --- | --- |
| Production build | passes — single-file bundle, no new dependencies |
| Routes | `/`, `/admin`, `/super-admin`, `/employee`, unknown path — rendered in jsdom, one `h1` each, zero console errors |
| Homepage | all 14 CMS sections render with imagery (20 images, none missing), zero console errors |
| Tokens | every migrated utility verified present in the compiled CSS (a missing token would silently emit nothing) |
| Mock architecture | untouched; only `services/providers/mock` reads `src/mock` |
| Animation / TypeScript | none introduced |

---

## 8. Phase 3 delivery notes — customer collections + product catalogue

Phase 3 extends the customer storefront into a premium catalogue: collection
index, collection detail, category detail and the full jewellery listing with
search, filtering, sorting and URL-backed state. The console experiences, the
homepage, the data architecture and the mock boundary are preserved.

**Routes** (customer, under `CustomerLayout`):

| Route | Screen |
| --- | --- |
| `/collections` | Collections index — curated collections + browse-by-category (reuses `CollectionCard`) |
| `/collections/:slug` | Collection detail; a category slug also resolves here (links that predate the dedicated route keep working) |
| `/category/:slug` | Category detail — the same listing implementation as collections (`CatalogueDetailPage` with a `scope`) |
| `/products` | All Jewellery — search + category + price filters + sort |

Product detail links (`/jewellery/…`) remain Phase 4 and resolve through
`NotFoundPage` until then.

**Catalogue components** (new, under `src/components/catalogue`):

| Component | Responsibility | Key API |
| --- | --- | --- |
| `CatalogueHeader` | page masthead: eyebrow, the page's single serif H1, house ornament, description, quiet result count | `eyebrow` `title` `description` `count` |
| `CatalogueControls` | the discovery toolbar: optional search field, category / price selects, sort select, active-filter chips, reset. Fully controlled (state lives in the URL) | `value` `onChange` `onReset` `showSearch` `showCategory` `showPrice` |
| `ProductGrid` | responsive grid of the shared `ProductCard` — 2 / 3 / 4 columns at base / `lg` / `xl` | `products` |
| `config.js` | discovery vocabulary: the three price bands (derived from the real ₹49,600–₹1,42,000 spread) and the sort options the product contract supports | `PRICE_RANGES` `SORT_OPTIONS` `DEFAULT_SORT` |

No per-experience card, button or modal was created: `ProductCard`,
`CollectionCard`, `Input`, `Select`, `Button`, `EmptyState` and `AsyncBoundary`
are reused as-is. The mobile filter experience is the toolbar itself
(two-up native selects) — no drawer, in keeping with Phase 1's decision to
defer a modal framework until a screen genuinely needs one.

**Data flow.** Filtering and sorting live in the provider query contract, so
the future API provider consumes the same parameters one-to-one:
`getProducts({ categoryId, collectionId, priceMin, priceMax, search, sort,
limit, … })`. Pages mirror browsing state in the URL (`?q= &category=
&price= &sort=` — slugs in the URL, backend-friendly bounds/keys in the
provider query); `useSearchParams` is the whole state layer. Sorts:
`featured` (default: bestseller → featured → name), `price-asc`,
`price-desc`. There is deliberately no "Newest" — the product model carries no
date. Filters exist only where the data varies: category, price and name
search. Purity ("22K") and availability ("available") are uniform across the
catalogue, so no filter is offered for them.

**Mock data.** No new mock entities. Two link corrections: category CTAs now
point at their canonical `/category/:slug` routes, and the homepage
"Shop Bestsellers" CTA points at the new `/products` route.

**Header (shared component, backward compatible).** The transparent,
light-tinted header chrome is designed to sit over the hero photograph — the
only customer route with a dark backdrop. Every other storefront page has a
light background, so the chrome is solid there from the first pixel
(`pathname === "/" ? scrolled : true`). The homepage renders exactly as before.

**Validation snapshot** (build + jsdom client renders, zero console errors):

| Check | Result |
| --- | --- |
| Production build | passes — single-file bundle 3,174 kB (Phase 2: 3,156 kB), no new dependencies |
| Routes | `/`, `/collections`, `/collections/:slug`, `/category/:slug`, `/products` (incl. filtered URLs), `/admin`, `/super-admin`, `/employee`, unknown path — all render, one `h1` each |
| Catalogue data | all listings render through hooks → services → provider; provider query contract verified against every filter/sort/search combination (28 checks) |
| Catalogue behaviour | result counts, active-filter chips + remove + reset, zero-result empty states, unknown-slug states, single-product singular "1 piece", slug fallback, search focus via header `#search` link — 78 jsdom checks passed |
| Mock architecture | untouched boundary; no page/component/layout imports `src/mock` |
| Animation / TypeScript | none introduced |

**Deliberately deferred** (later phases): product detail, cart/checkout,
pagination (the catalogue is intentionally small — the provider already
supports `limit`), pagination of results, a filter drawer (no screen needs
one yet).
