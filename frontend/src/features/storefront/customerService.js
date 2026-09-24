/**
 * CUSTOMER SERVICE PAGES (Phase 14.1)
 * -----------------------------------------------------------------------------
 * One house copy module for the footer destinations that previously 404'd.
 * This is not a CMS, a ticket desk, or a counsel-reviewed legal instrument.
 * Every statement matches a behaviour the storefront already has:
 *
 *   contact     the site care desk and the stores anchor — no intake form
 *   shipping    the single complimentary insured courier, read in the order book
 *   returns     cancellation before dispatch is a house action, not a portal
 *   warranty    hallmark and lifetime care as the house already announces them
 *   care        guidance only — not a repair workflow
 *   privacy     what this storefront actually keeps
 *   terms       the order and feature contract a customer can already observe
 *
 * Track Order stays `/account/orders`. Custom and private viewing stay
 * contextual links and are not pages here.
 */

const ALSO = [
  { label: "Contact", href: "/contact" },
  { label: "FAQs", href: "/faq" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Warranty", href: "/warranty" },
  { label: "Care", href: "/care-guide" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

function relatedExcept(href) {
  return ALSO.filter((link) => link.href !== href);
}

export const CUSTOMER_SERVICE_PAGES = {
  contact: {
    eyebrow: "Customer Care",
    title: "Contact the house",
    lead: "Speak with Swarnova care, or visit a boutique. This page does not open a ticket — the care desk and the stores are the doors.",
    showCareDesk: true,
    sections: [
      {
        heading: "Boutiques",
        paragraphs: [
          "Hours, addresses and the boutiques currently open to visitors are kept on the stores list. A private viewing is arranged with the boutique, not booked from this page.",
        ],
        links: [{ label: "Stores", href: "/#stores" }],
      },
      {
        heading: "An order already placed",
        paragraphs: [
          "Status lives in your order book: placed, confirmed, in preparation, shipped, or delivered. Have the order number ready when you write to care.",
        ],
        links: [{ label: "Track an order", href: "/account/orders" }],
      },
    ],
    related: relatedExcept("/contact"),
  },
  faq: {
    eyebrow: "Customer Care",
    title: "Questions the house is asked",
    lead: "Short answers to what this storefront actually does. Anything beyond them goes to the care desk.",
    sections: [
      {
        heading: "When is an order confirmed?",
        paragraphs: [
          "Placing an order records it as placed and paid. The house confirms it before preparation begins. Confirmation is not the same moment as checkout.",
        ],
      },
      {
        heading: "How do I follow an order?",
        paragraphs: [
          "Open your order book. It follows one path: placed, confirmed, in preparation, ready or shipped, out for delivery, delivered. The house does not publish a separate courier-tracking page.",
        ],
        links: [{ label: "Order book", href: "/account/orders" }],
      },
      {
        heading: "How does delivery work?",
        paragraphs: [
          "Online orders travel by the complimentary insured courier offered at checkout, typically within 2–5 working days, with signature handover. There is no express tier and no pickup path on this storefront.",
        ],
        links: [{ label: "Shipping", href: "/shipping" }],
      },
      {
        heading: "Which payments are accepted online?",
        paragraphs: [
          "Prepaid UPI and net banking. The storefront does not take card numbers, and it does not offer cash on delivery.",
        ],
      },
      {
        heading: "Can I cancel?",
        paragraphs: [
          "Write to care before the order is dispatched. The house can cancel a placed, confirmed or processing order; payment taken is marked for return. After dispatch, this website does not open a return.",
        ],
        links: [{ label: "Returns", href: "/returns" }],
      },
      {
        heading: "Are AI Studio and Virtual Try-On always open?",
        paragraphs: [
          "No. The house can pause either one. A paused feature leaves the catalogue, the boutiques and your account open, and a direct link explains that it is unavailable.",
        ],
      },
    ],
    related: relatedExcept("/faq"),
  },
  shipping: {
    eyebrow: "Delivery",
    title: "Shipping & delivery",
    lead: "One method, the one checkout already offers. No second courier, and no tracking page of our own.",
    sections: [
      {
        heading: "Insured courier",
        paragraphs: [
          "Complimentary insured courier across India, typically 2–5 working days, handed over against a signature. The charge at checkout is none. The courier named on the delivery method is the one the house uses; this release does not generate labels or listen for carrier events.",
        ],
      },
      {
        heading: "What you can read here",
        items: [
          "Placed — received and paid, waiting for the house to confirm.",
          "Confirmed — accepted; preparation has not started.",
          "Processing — in preparation at the fulfilling boutique.",
          "Ready / Shipped — prepared for handover, or dispatched with the insured courier.",
          "Out for Delivery — with the courier. No live tracking page is connected.",
          "Delivered — handed over.",
        ],
        links: [{ label: "Your orders", href: "/account/orders" }],
      },
      {
        heading: "What this page does not do",
        paragraphs: [
          "There is no express tier, no store pickup, and no live map. If a consignment needs attention after it has left the boutique, write to care with the order number.",
        ],
      },
    ],
    related: relatedExcept("/shipping"),
  },
  returns: {
    eyebrow: "Customer Care",
    title: "Returns & exchanges",
    lead: "Cancellation before dispatch is a house action. You can submit a return or care enquiry for an order; approval and processing remain with the house.",
    sections: [
      {
        heading: "Before dispatch",
        paragraphs: [
          "Contact care with the order number. The house can cancel an order that is placed, confirmed, or still in preparation. Payment already taken is marked for return. That mark is not a completed refund and not a status you can set yourself.",
        ],
        links: [{ label: "Contact care", href: "/contact" }],
      },
      {
        heading: "After dispatch",
        paragraphs: [
          "You can submit a return enquiry from your order or Service Requests. This records your request only: it does not approve a return, arrange pickup, exchange a piece or settle a refund. The care desk or fulfilling boutique must review it.",
        ],
      },
    ],
    related: relatedExcept("/returns"),
  },
  warranty: {
    eyebrow: "Trust",
    title: "Warranty",
    lead: "What the house already promises, and nothing this screen cannot stand behind.",
    sections: [
      {
        heading: "Hallmark",
        paragraphs: [
          "Gold offered by the house is BIS hallmarked, as the storefront announces. Making charges and taxes sit outside the gold-rate board; the piece you buy carries the price confirmed at checkout.",
        ],
      },
      {
        heading: "Lifetime care",
        paragraphs: [
          "Lifetime jewellery care means the care desk and the boutiques remain available for the life of the piece — guidance, and inspection when you visit. It is not an automatic replacement, and this storefront does not issue a downloadable warranty certificate.",
        ],
        links: [{ label: "Care guide", href: "/care-guide" }],
      },
      {
        heading: "A piece that is not as it should be",
        paragraphs: [
          "Write to care with the order number and what you have noticed. The house reviews it. This page does not start a claim, and it does not promise a timeline the platform cannot keep.",
        ],
        links: [{ label: "Contact care", href: "/contact" }],
      },
    ],
    related: relatedExcept("/warranty"),
  },
  care: {
    eyebrow: "Trust",
    title: "Jewellery care",
    lead: "How to live with a piece between visits. This is guidance, not a repair booking.",
    sections: [
      {
        heading: "Every day",
        items: [
          "Put jewellery on last, and take it off first — perfume, cream and hairspray dull a surface.",
          "Keep pieces apart. Gold, diamonds and softer stones should not share a pouch.",
          "Wipe with a soft, dry cloth after wear. Do not use household chemicals, toothpaste or ultrasonic baths at home.",
        ],
      },
      {
        heading: "Water and work",
        paragraphs: [
          "Remove jewellery for the sea, the pool, the gym and any work that knocks or catches. A clasp that feels loose should wait for the boutique rather than be forced.",
        ],
      },
      {
        heading: "When you want the house to look",
        paragraphs: [
          "Lifetime care is a visit, not a form on this website. Bring the piece to a boutique, or write to care and they will say which counter can see it.",
        ],
        links: [
          { label: "Stores", href: "/#stores" },
          { label: "Contact care", href: "/contact" },
        ],
      },
    ],
    related: relatedExcept("/care-guide"),
  },
  privacy: {
    eyebrow: "House notice",
    title: "Privacy",
    lead: "What this storefront keeps, stated as it actually behaves. This is house copy for the current release, not a counsel-reviewed production policy.",
    sections: [
      {
        heading: "An account",
        paragraphs: [
          "Registration keeps the name, email and phone you give. Saved addresses stay with that account. Signing in with Google, when it is available, uses the verified email to find or open your customer account. It does not make you staff, and it does not grant a role.",
        ],
      },
      {
        heading: "An order",
        paragraphs: [
          "Checkout keeps the pieces, the quantities, the address you chose, the delivery method and the payment method. Online payment asks for a UPI id or a net-banking confirmation. Card numbers, CVV and payment secrets are not collected on this storefront.",
        ],
      },
      {
        heading: "What stays with you",
        paragraphs: [
          "Wishlist, saved designs and saved try-ons are kept for the account that created them on this storefront. A photograph you offer the fitting room is used to prepare that preview. This release does not run a separate consent vault, a deletion desk, or an analytics programme.",
        ],
      },
      {
        heading: "Who may see an order",
        paragraphs: [
          "You see your own book. The fulfilling boutique sees its own. Head office and the Super Admin oversee the organization-wide book. Another customer does not.",
        ],
        links: [{ label: "Contact care", href: "/contact" }],
      },
    ],
    related: relatedExcept("/privacy"),
  },
  terms: {
    eyebrow: "House notice",
    title: "Terms & conditions",
    lead: "The terms a customer can already observe on this storefront. Questions go to the care desk. This is not a counsel-reviewed production instrument.",
    sections: [
      {
        heading: "Placing an order",
        paragraphs: [
          "An order is placed when checkout succeeds. It is confirmed only when the house confirms it. Prices are the catalogue prices snapshotted at placement. Tax is included in the way checkout already calculates it. The delivery charge is the charge of the method you selected — today, none.",
        ],
      },
      {
        heading: "Delivery and cancellation",
        paragraphs: [
          "Delivery is the insured courier described on the shipping page. Cancellation before dispatch is requested through care and performed by the house. After dispatch, this website does not operate a return, an exchange, or a refund.",
        ],
        links: [
          { label: "Shipping", href: "/shipping" },
          { label: "Returns", href: "/returns" },
        ],
      },
      {
        heading: "The atelier and the fitting room",
        paragraphs: [
          "AI Studio and Virtual Try-On may be paused. A paused feature cannot be generated or tried on, including from a link you already hold. Concepts and previews on this storefront are demonstrations, not a manufacturing commitment and not a custom-order workflow.",
        ],
      },
      {
        heading: "The house",
        paragraphs: [
          "Swarnova by MediXO. For anything these terms do not answer, write to the care desk rather than assume a rule the platform has not published.",
        ],
        links: [{ label: "Contact care", href: "/contact" }],
      },
    ],
    related: relatedExcept("/terms"),
  },
};

export function getCustomerServicePage(pageKey) {
  return CUSTOMER_SERVICE_PAGES[pageKey] ?? null;
}
