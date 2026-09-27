# SWARNOVA

## Business Requirements Document (BRD) + Product Requirements Document (PRD)

### Current Product Baseline --- Version 2.0

**Product:** SWARNOVA\
**Attribution:** SWARNOVA by MediXO\
**Positioning:** Where Heritage Meets Innovation\
**Document Status:** Current Product Definition & Requirements Baseline\
**Version:** 2.0\
**Prepared:** September 2026

------------------------------------------------------------------------

## 1. Executive Summary

SWARNOVA is a premium digital jewellery ecosystem combining gold
jewellery commerce, AI-assisted jewellery creation, virtual try-on,
customized jewellery journeys, and centralized multi-branch business
operations.

The current concept connects:

**Customer → Catalogue → AI Atelier → Virtual Fitting Room → Commerce →
Branches → Inventory → Orders → Business Operations**

The product is organized into four connected experiences:

1.  **Customer Storefront** --- premium editorial discovery and
    commerce.
2.  **AI Jewellery Atelier** --- AI-assisted concept creation and
    refinement.
3.  **Virtual Fitting Room** --- one shared try-on experience for
    catalogue products and AI-generated designs.
4.  **Business Command Platform** --- Super Admin, Admin and Employee
    operations.

This document supersedes the original v1 product baseline as the current
product definition. It preserves valid requirements from the original
BRD/PRD while incorporating the current repository, Phase 13/13.5
decisions, and Phase 14.0 audit findings.

Important status distinction:

-   **Current / Implemented:** already represented in the current
    frontend/mock product.
-   **Required / Production:** needed to make an existing product
    promise production-real.
-   **Future / Candidate:** valuable opportunities requiring separate
    approval.

------------------------------------------------------------------------

# 2. Product Vision

Build a premium jewellery ecosystem where heritage jewellery meets
modern digital discovery, intelligent design, and connected
physical-store experiences.

### Customer promise

**DISCOVER → DESIGN → VISUALIZE → TRY ON → CUSTOMIZE → PURCHASE → OWN →
SERVICE**

### Business promise

**GOVERN → MERCHANDISE → OPERATE → MANAGE INVENTORY → SERVE → FULFIL →
ANALYZE**

------------------------------------------------------------------------

# 3. Brand and Experience Principles

-   Primary brand: **SWARNOVA**
-   Attribution: **by MediXO**
-   Positioning: **Where Heritage Meets Innovation**
-   Premium editorial experience, not generic SaaS.
-   AI should feel like a signature jewellery atelier.
-   Virtual Try-On should feel like a luxury digital fitting room.
-   Branch operations should feel like an extension of the physical
    jewellery house.
-   White, ivory/cream, champagne/muted gold, burgundy/wine and
    charcoal.
-   Cormorant Garamond + Jost.
-   Static premium composition; no unnecessary animation.
-   Minimal code, maximum reuse and strong domain boundaries.

------------------------------------------------------------------------

# 4. Business Objectives

## Customer

-   Premium jewellery discovery.
-   Higher purchase confidence.
-   AI-assisted jewellery creation.
-   Virtual visualization.
-   Customized jewellery journey.
-   Trusted product/pricing/certification information.
-   Online-to-store continuity.
-   Long-term post-purchase relationship.

## Business

-   Centralize catalogue, pricing, content, inventory, orders and
    customer operations.
-   Improve branch visibility.
-   Manage campaigns, homepage, gold rates and media centrally.
-   Maintain traceable operational actions.
-   Support branch-assisted selling.
-   Provide organization-wide reporting.

------------------------------------------------------------------------

# 5. Product Scope

## Core

-   Customer storefront
-   Catalogue
-   Collections/categories
-   Product detail
-   Search/filter/sort
-   Wishlist
-   Cart
-   Checkout
-   Orders
-   Customer account
-   Branch discovery
-   AI Jewellery Studio
-   Virtual Try-On
-   Customized jewellery
-   Customer authentication
-   Staff authentication
-   Multi-branch operations
-   Inventory
-   Orders/customers
-   Content/campaign governance
-   Media governance
-   Gold-rate management
-   Employee management
-   RBAC/capabilities
-   Audit logs
-   Reports

## Current extensions already present

-   Guest/customer ownership boundaries
-   Customer Google OAuth seam
-   Saved AI designs
-   Saved Try-Ons
-   Canonical order/inventory lifecycle
-   Super Admin branch drill-down
-   Product governance lifecycle
-   Media library
-   Homepage governance
-   Campaign governance
-   Employee branch-scoped operations
-   Unified Virtual Fitting Room
-   Global navigation/scroll restoration

## Candidate expansion, not committed automatically

-   Jewellery Compare
-   Ring Size Guide / Ring Sizer
-   Visual Search
-   AI Jewellery Concierge
-   Style DNA
-   Personalized recommendations
-   Recently Viewed
-   Notify Me
-   Reviews
-   Branch Availability
-   Reserve & Visit
-   Appointment / Private Viewing
-   Jewellery Vault
-   Jewellery Care / Repair
-   Gift Experience
-   Custom Request intake
-   Clienteling
-   Product Intelligence

------------------------------------------------------------------------

# 6. User Types and Authority

## Customer

Browse, search, wishlist, cart, checkout, orders, account, AI Studio,
saved designs, Virtual Try-On, saved try-ons and branch discovery.

Customer identity is separate from staff identity.

## Super Admin

Global organization-wide authority over all branches and platform
governance.

Must be able to access or oversee:

-   All branches
-   Catalogue/products
-   Customers
-   Orders
-   Inventory
-   Employees
-   Branch operations
-   Content/campaigns
-   AI/Try-On governance
-   Gold rates
-   Media
-   Reports
-   Roles/capabilities
-   Audit
-   Settings

The exact UI model for global operational order/customer/inventory
access is a P1 decision.

## Admin / Head Office

Business operations:

-   Catalogue
-   Orders
-   Customers
-   Inventory
-   Content
-   Branches
-   Employees
-   Reports

## Employee / Branch

Branch-first and task-first.

Depending on capability:

-   Orders
-   Customers
-   Product lookup
-   Inventory
-   Stock movements
-   Branch operations
-   Reports

Employee scope cannot be widened by client parameters.

------------------------------------------------------------------------

# 7. Authorization Model

**Role → Maximum Authority → Capability Profile → Actual Capabilities →
Branch/Data Scope → UI/Actions**

Rules:

-   Backend is authoritative.
-   Frontend permission checks are UX only.
-   RBAC and branch scope are separate.
-   Employee cannot create staff.
-   Admin can create Employees according to capability.
-   Super Admin has organization-wide authority.
-   Customer sessions never satisfy staff authorization.
-   Google-authenticated customers never receive staff authority.

------------------------------------------------------------------------

# 8. Customer Storefront

## Primary navbar

Current primary navigation:

**HOME \| COLLECTIONS \| AI STUDIO \| STORES**

Virtual Try-On, Our Story and Journal remain accessible
contextually/through secondary areas without occupying primary
navigation.

## Homepage

CMS-controlled production content should include:

-   Hero
-   Hero media
-   Featured collections
-   Featured products
-   Campaigns
-   AI Studio promotion
-   Virtual Try-On promotion
-   Gold-rate information where approved
-   Stores
-   Editorial/Journal
-   Brand promise
-   Newsletter

Homepage section visibility/order is governance controlled.

------------------------------------------------------------------------

# 9. Catalogue and Product Discovery

Support:

-   Categories
-   Collections
-   Product listing
-   Search
-   Filters
-   Sorting
-   Featured products
-   Bestsellers
-   Availability

Current frontend has name/SKU search, category/price filters and
sorting.

Production product schema should support:

-   Name
-   SKU
-   Category
-   Collection
-   Jewellery type
-   Purity
-   Gross/net gold weight
-   Stone information
-   Making charges
-   Other charges
-   Tax
-   Final price
-   Images/video
-   Description
-   Certification
-   Availability
-   Branch availability
-   Status
-   Delivery/pickup
-   Returns/warranty/care
-   Variants/sizes

The commercial product/pricing contract must be agreed before expanding
product UI.

------------------------------------------------------------------------

# 10. Product Detail

Primary:

-   Add to Cart
-   Buy Now
-   Wishlist
-   Virtual Try-On
-   Enquire/Customize where applicable

Secondary:

-   Related
-   Similar
-   Recommendations when available
-   Trust/certification information
-   Availability
-   Delivery/pickup

------------------------------------------------------------------------

# 11. AI Jewellery Atelier

AI Studio is a core differentiator.

Current flow:

**Prompt → Generate → Concepts → Select → Refine → Save / Try-On**

Current controls include:

-   Natural-language prompt
-   Jewellery type
-   Style
-   Occasion
-   Purity
-   Variations
-   Refinement
-   Save
-   Share
-   Try-On

Production AI requires:

-   Model/provider decision
-   Prompt/image policy
-   Moderation
-   Job processing
-   Retry/rate limits
-   Cost controls
-   Model/version tracking
-   Storage/CDN
-   Retention/deletion
-   Quality evaluation

The current fixture renderer is not production AI.

------------------------------------------------------------------------

# 12. Virtual Fitting Room

Unified architecture:

**Product Detail → Try It On → Virtual Fitting Room**

**AI Studio → Generated Design → Try It On → Virtual Fitting Room**

Current:

-   Photo selection/upload
-   Jewellery selection
-   Result
-   Retry
-   Change jewellery
-   Save/share
-   Product continuation
-   AI continuation

Production requires:

-   Consent
-   Secure upload
-   Retention/deletion
-   Segmentation/landmarks
-   Jewellery placement
-   Occlusion
-   Lighting/scale correction
-   Moderation
-   Quality thresholds
-   Rate limiting
-   Job status
-   Persistent result storage/CDN

No fake CV behavior.

------------------------------------------------------------------------

# 13. Customized Jewellery

Original product requirements define customization as a first-class
workflow.

Sources:

-   AI-generated design
-   Existing product
-   Dedicated custom request

Information:

-   Design/reference
-   Jewellery type
-   Requirements
-   Purity
-   Stones
-   Quantity
-   Notes
-   Preferred branch/contact

Lifecycle:

**SUBMITTED → UNDER REVIEW → DESIGN DISCUSSION → QUOTATION → CUSTOMER
APPROVAL → ADVANCE PAYMENT → MANUFACTURING → QUALITY CHECK →
FINALIZATION → DELIVERY/COLLECTION → COMPLETED**

Current frontend has AI concepts and contextual paths, but not the
complete customization workflow.

------------------------------------------------------------------------

# 14. Customer Account

Required:

-   Profile
-   Addresses
-   Orders
-   Wishlist
-   Saved AI designs
-   Saved Try-Ons
-   Customization requests
-   Notifications
-   Preferences

Current frontend implements most core account surfaces; production
requires backend persistence and synchronization.

------------------------------------------------------------------------

# 15. Cart, Checkout and Orders

## Checkout

**CUSTOMER → ADDRESS → FULFILMENT → ORDER REVIEW → PAYMENT →
CONFIRMATION**

Production requirements:

-   Server quote
-   Authoritative pricing
-   Inventory validation
-   Promotions
-   Payment authorization
-   Idempotency
-   Webhooks
-   Reconciliation
-   Refunds
-   Recovery
-   Notifications

## Order lifecycle

Canonical vocabulary must be unified:

**PLACED → CONFIRMED → PROCESSING → READY/SHIPPED → OUT FOR DELIVERY →
DELIVERED**

Additional:

-   CANCELLED
-   RETURNED
-   REFUNDED
-   FAILED
-   ON HOLD

A current P1 defect exists because `Placed` is not represented
consistently across customer order views.

------------------------------------------------------------------------

# 16. Inventory and Transfers

Inventory states:

-   AVAILABLE
-   RESERVED
-   IN TRANSIT
-   SOLD
-   RETURNED
-   DAMAGED
-   LOST
-   ARCHIVED

Transfer:

**REQUESTED → APPROVED → DISPATCHED → IN TRANSIT → RECEIVED →
RECONCILED**

Production requires database transactions, locking, reservation expiry,
transfer/reconciliation and durable audit.

------------------------------------------------------------------------

# 17. Branch and Omnichannel Experience

Current:

-   Branch directory
-   Branch identity/contact/hours
-   Branch status
-   Branch operations
-   Branch-scoped Employee access
-   Super Admin branch drill-down

Future/candidate:

-   Branch product availability
-   Reserve & Visit
-   Pickup
-   Private viewing
-   Appointments
-   Product reservation
-   Transfers
-   Branch-specific customer service

These require backend allocation and workflow design.

------------------------------------------------------------------------

# 18. Admin / Head Office

Admin manages:

-   Products
-   Orders
-   Customers
-   Inventory
-   Content
-   Branches
-   Employees
-   Reports

Use canonical domain contracts. Do not create duplicate data stores.

------------------------------------------------------------------------

# 19. Super Admin Command Centre

Core governance:

-   Overview
-   Branches
-   Admins
-   Employees
-   Products
-   Media
-   Categories
-   Collections
-   Homepage
-   Campaigns
-   AI/Try-On
-   Gold Rate
-   Roles & Permissions
-   Audit Logs
-   Settings

P1 decision: define whether Super Admin receives inherited Admin read
capabilities or dedicated global operational screens for
orders/customers/inventory.

------------------------------------------------------------------------

# 20. CMS and Media

CMS production capabilities should eventually include:

-   Hero
-   Mobile hero
-   Promotional banners
-   Festival/collection campaigns
-   Featured products/collections
-   AI/Try-On promotion
-   Editorial
-   Store promotion

Campaign lifecycle:

**DRAFT → SCHEDULED → ACTIVE → PAUSED/EXPIRED → ARCHIVED**

Production CMS needs:

-   Editing
-   CTA targets
-   Media placement
-   Preview
-   Versioning
-   Publish
-   Rollback
-   Scheduling

Media production requires durable object storage/CDN, transformations,
permissions and safe reference deletion.

------------------------------------------------------------------------

# 21. Gold Rates and Pricing

Gold rate:

-   Purity
-   Rate
-   Effective date/time
-   History
-   Authorized changes

Pricing:

**GOLD VALUE + MAKING + STONE/OTHER CHARGES + TAXES − ELIGIBLE DISCOUNTS
= FINAL PRICE**

Displayed gold rate must be distinguishable from final jewellery price.

------------------------------------------------------------------------

# 22. Promotions and Campaigns

Types:

-   Percentage
-   Fixed
-   Product-specific
-   Category-specific
-   Branch-specific
-   Festival/seasonal
-   Limited-time
-   New-customer

Controls:

-   Start/end
-   Status
-   Eligibility
-   Products/categories
-   Branches
-   Usage limits
-   Priority/conflict handling

------------------------------------------------------------------------

# 23. Customer Services and Trust

Production customer service should provide authoritative experiences
for:

-   Contact
-   FAQ
-   Shipping
-   Returns/exchanges
-   Warranty
-   Jewellery care
-   Track order
-   Privacy
-   Terms

Current audit found several configured footer destinations without
customer routes. These must be approved for implementation or
removed/replaced.

Trust information should eventually include:

-   Hallmark
-   Certification
-   Authenticity
-   Warranty
-   Care
-   Invoice/certificate documents

------------------------------------------------------------------------

# 24. Personalization

Current:

-   Wishlist
-   Saved designs
-   Saved Try-Ons
-   Related products

Candidate:

-   Recently Viewed
-   Recommendations
-   Style DNA
-   Occasion preferences
-   AI Jewellery Concierge
-   Notify Me
-   Personalized collections

These require backend/data/privacy decisions.

------------------------------------------------------------------------

# 25. Jewellery Vault

Future concept:

**Purchased Jewellery → Invoice → Certificate → Hallmark → Warranty →
Care → Service → Repair**

This is not currently implemented.

It requires durable backend ownership and document storage.

------------------------------------------------------------------------

# 26. Reviews

Future production capability:

-   Reviews
-   Ratings
-   Verified purchase
-   Moderation
-   Customer photos where approved

Current ratings are not a full review system.

------------------------------------------------------------------------

# 27. Gift Experience

Candidate:

-   Gift packaging
-   Gift message
-   Recipient details
-   Gift delivery
-   Gift receipt/privacy

Requires commerce rules before implementation.

------------------------------------------------------------------------

# 28. Analytics and Intelligence

Business analytics should cover:

-   Revenue
-   Orders
-   AOV
-   Branch performance
-   Inventory
-   Customer growth
-   AI usage
-   Try-On usage
-   Campaign performance
-   Gold-rate summary
-   Operational alerts

Future product intelligence may include views, wishlist, try-on, cart
and conversion metrics.

Requires event taxonomy, privacy/consent, retention and analytics
ownership.

------------------------------------------------------------------------

# 29. Notifications

Production channels may include:

-   Email
-   SMS
-   WhatsApp

Events:

-   Authentication/reset
-   Orders
-   Payments
-   Fulfilment
-   Delivery
-   Appointments
-   Custom quotations
-   Service
-   Back-in-stock

No notification service should be faked.

------------------------------------------------------------------------

# 30. Authentication

## Customer

-   Login
-   Registration
-   Forgot/reset password
-   Google OAuth
-   Guest state
-   Customer session
-   Ownership

Google production flow:

**Customer → OAuth URL → Google → Callback → Server verification →
Customer reconciliation → Secure session**

## Staff

-   Shared staff login
-   Super Admin
-   Admin
-   Employee
-   Role/capability
-   Branch scope
-   Persistent server session

------------------------------------------------------------------------

# 31. Backend Contract

Frontend contract:

**UI → Page → Hook → Service → DataProvider → Provider**

Current:

**DataProvider → Mock Provider → Canonical Mock Store**

Future:

**DataProvider → HTTP/API Provider → Backend**

Backend owns:

-   Identity
-   Authorization
-   Branch scope
-   Products
-   Pricing
-   Inventory
-   Orders
-   Payments
-   Customer ownership
-   Content
-   Media
-   Audit
-   AI jobs
-   Try-On jobs

------------------------------------------------------------------------

# 32. Security

Production requirements:

-   Server authorization
-   Ownership checks
-   Branch scope
-   Secure sessions
-   Password hashing
-   CSRF/session protection
-   OAuth PKCE/state
-   Payment callback verification
-   Audit
-   Validation
-   Rate limiting
-   File validation
-   AI moderation
-   Photo consent/retention

------------------------------------------------------------------------

# 33. UX, Accessibility and Performance

All major workflows require:

-   Loading
-   Empty
-   Success
-   Error
-   Partial
-   Unavailable
-   Unauthorized
-   Session expired
-   Validation error
-   Processing
-   Retry

Responsive targets:

375, 640, 768, 1024, 1280, 1536px.

Accessibility:

-   Keyboard support
-   Focus
-   Semantic controls
-   Labels
-   Dialog accessibility
-   Meaningful alt text
-   Error associations
-   Touch targets

Performance should eventually address:

-   Single-file bundle size
-   Route splitting
-   Image optimization
-   CDN
-   Caching
-   Pagination
-   Performance budgets

------------------------------------------------------------------------

# 34. P1 Decisions Before Broad Feature Work

### P1.1 Order lifecycle

Create one shared status vocabulary and eliminate `Placed`/`Confirmed`
inconsistencies.

### P1.2 Super Admin authority

Choose the final global operational model without duplicating stores.

### P1.3 AI/Try-On availability

Governance settings must enforce customer availability or be clearly
informational/deferred.

### P1.4 Requirement reconciliation

Reconcile this current product definition with the original BRD/PRD
acceptance criteria before committing additional feature scope.

### P1.5 Customer-service promises

Resolve unsupported footer/service destinations.

------------------------------------------------------------------------

# 35. Production Gaps

Known dependencies:

-   API/backend provider
-   Persistent customer/staff sessions
-   Server authorization
-   Database inventory allocation
-   Reservation expiry
-   Payment integration
-   Shipping/courier
-   Notifications
-   Permanent media/CDN
-   Real AI
-   Real CV
-   Analytics
-   CRM/support
-   Gold-rate feed if approved
-   Invoice/certificate generation

------------------------------------------------------------------------

# 36. Roadmap

## Phase 14.1 --- P1 Resolution + Requirements Reconciliation

-   Order status contract
-   Super Admin authority
-   AI/Try-On enforcement
-   Customer service route/content decision
-   BRD/PRD acceptance reconciliation

## Phase 14.2 --- Approved Product Gaps

Only implement capabilities explicitly approved after 14.1.

Potential groups:

-   Jewellery discovery
-   Omnichannel/branch
-   Customer services
-   Jewellery ownership
-   Personalization
-   Business intelligence

## Phase 15 --- Frontend Backend Readiness

-   Final API contracts
-   Request/response schemas
-   Error taxonomy
-   Auth/session seams
-   Persistence boundaries
-   API provider
-   Environment configuration
-   Production data handling

## Future --- Real Backend and Integrations

-   Database
-   API
-   OAuth
-   Payments
-   Inventory transactions
-   Storage/CDN
-   AI/CV
-   Notifications
-   Analytics
-   CRM

------------------------------------------------------------------------

# 37. Definition of Done

Every future SWARNOVA feature must:

-   Use React + Vite + JavaScript/JSX.
-   Avoid TypeScript.
-   Reuse existing primitives.
-   Preserve the provider architecture.
-   Keep mock data isolated.
-   Avoid duplicate business logic.
-   Keep authorization server-owned.
-   Keep branch scope server-owned.
-   Avoid fake production integrations.
-   Include loading/empty/error states.
-   Consider accessibility and responsive behavior.
-   Include focused tests.
-   Preserve existing journeys.
-   Document production dependencies honestly.

------------------------------------------------------------------------

# 38. Final Product Definition

SWARNOVA is:

**A premium digital jewellery house connecting discovery, intelligent
design, visualization, commerce, physical branches, inventory and
long-term customer relationships.**

It is not simply an e-commerce website with an AI feature.

The product should evolve from:

**DISCOVER → DESIGN → VISUALIZE → TRY ON → CUSTOMIZE → PURCHASE**

toward:

**DISCOVER → DESIGN → VISUALIZE → TRY ON → CUSTOMIZE → PURCHASE → OWN →
SERVICE**

while the business operates through:

**GOVERN → MERCHANDISE → OPERATE → MANAGE INVENTORY → SERVE → FULFIL →
ANALYZE**

The immediate priority is controlled product-definition reconciliation
and production contracts, not uncontrolled feature expansion.
