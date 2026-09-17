import { media } from "../../assets/index.js";

/**
 * Mock customer orders history and details.
 * Shaped to mirror future order management API contracts.
 */
export const customerOrders = [
  {
    id: "ORD-2026-8941",
    orderNumber: "SWN-8941-IN",
    createdAt: "2026-09-02T10:30:00Z",
    status: "Delivered",
    deliveredAt: "2026-09-06T15:20:00Z",
    items: [
      {
        id: "JWL-001",
        name: "Hrudaya Diamond Pendant",
        sku: "SWN-PND-001",
        purity: "22K",
        price: 72400,
        quantity: 1,
        image: {
          src: media.productPendant,
          alt: "Hrudaya Diamond Pendant",
        },
        href: "/product/JWL-001",
      },
    ],
    subtotal: 72400,
    shipping: 0,
    total: 72400,
    shippingAddress: {
      name: "Aadya Sharma",
      phone: "+91 98765 43210",
      line1: "42, Vasant Vihar Enclave",
      line2: "Near Palm Grove Club",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110057",
      country: "India",
    },
    paymentMethod: "Prepaid · Net Banking",
    courier: "Blue Dart Apex Insured",
    trackingNumber: "BD-8849201",
  },
  {
    id: "ORD-2026-9214",
    orderNumber: "SWN-9214-IN",
    createdAt: "2026-09-12T14:15:00Z",
    status: "Shipped",
    estimatedDelivery: "2026-09-18",
    items: [
      {
        id: "JWL-002",
        name: "Eternal Halo Ring",
        sku: "SWN-RNG-014",
        purity: "22K",
        price: 56800,
        quantity: 1,
        image: {
          src: media.productHaloRing,
          alt: "Eternal Halo Ring",
        },
        href: "/product/JWL-002",
      },
      {
        id: "JWL-004",
        name: "Tara Diamond Drop Earrings",
        sku: "SWN-ERG-008",
        purity: "22K",
        price: 84200,
        quantity: 1,
        image: {
          src: media.productDropEarrings,
          alt: "Tara Diamond Drop Earrings",
        },
        href: "/product/JWL-004",
      },
    ],
    subtotal: 141000,
    shipping: 0,
    total: 141000,
    shippingAddress: {
      name: "Aadya Sharma",
      phone: "+91 98765 43210",
      line1: "42, Vasant Vihar Enclave",
      line2: "Near Palm Grove Club",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110057",
      country: "India",
    },
    paymentMethod: "Prepaid · Razorpay / UPI",
    courier: "Blue Dart Apex Insured",
    trackingNumber: "BD-9930215",
  },
  {
    id: "ORD-2026-9302",
    orderNumber: "SWN-9302-IN",
    createdAt: "2026-09-16T09:40:00Z",
    status: "Processing",
    estimatedDelivery: "2026-09-22",
    items: [
      {
        id: "JWL-003",
        name: "Vriksha Solitaire Ring",
        sku: "SWN-RNG-002",
        purity: "22K",
        price: 64500,
        quantity: 1,
        image: {
          src: media.productSolitaireRing,
          alt: "Vriksha Solitaire Ring",
        },
        href: "/product/JWL-003",
      },
    ],
    subtotal: 64500,
    shipping: 0,
    total: 64500,
    shippingAddress: {
      name: "Aadya Sharma (Studio)",
      phone: "+91 98765 43211",
      line1: "Penthouse 4B, Silver Oak Towers",
      line2: "Golf Course Road, Sector 54",
      city: "Gurugram",
      state: "Haryana",
      postalCode: "122002",
      country: "India",
    },
    paymentMethod: "Prepaid · UPI",
    courier: "Swarnova Hand Courier",
    trackingNumber: "SWN-EXPR-102",
  },
];

export default customerOrders;
