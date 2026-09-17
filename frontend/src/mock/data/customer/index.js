/**
 * Mock customer data — the customer directory, and the storefront's own
 * signed-in profile and addresses.
 * Shaped to mirror future customer account endpoints.
 *
 * Phase 9: `customers` is the ONE canonical customer directory — the Admin
 * customer book reads it, and every order in `mock/data/orders` references
 * one of these ids. The storefront profile below is simply the customer
 * whose browser session is signed in (CUST-84920).
 *
 * Phase 11: the same directory becomes the customer identity registry — the
 * governance store issues every fixture account the shared demo credential
 * below (mirroring `STAFF_TEMP_PASSWORD` for staff), exactly where a future
 * backend keeps credentials: here in plain fixture form, later hashed
 * server-side. The demo credential is surfaced only through the same
 * explicit "Demo access" disclosure the staff login already uses.
 */
export const CUSTOMER_DEMO_PASSWORD = "Swarnova@123";
export const customerProfile = {
  id: "CUST-84920",
  name: "Aadya Sharma",
  email: "aadya.sharma@swarnova.in",
  phone: "+91 98765 43210",
  dateOfBirth: "1994-06-18",
  preferences: {
    preferredMetal: "22K Yellow Gold",
    ringSize: "14",
    favouriteStyle: "Heritage Temple & Contemporary Polki",
  },
  memberSince: "October 2024",
  tier: "Swarnova Privé",
};

export const customerAddresses = [
  {
    id: "ADDR-001",
    name: "Aadya Sharma",
    phone: "+91 98765 43210",
    line1: "42, Vasant Vihar Enclave",
    line2: "Near Palm Grove Club",
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110057",
    country: "India",
    isDefault: true,
  },
  {
    id: "ADDR-002",
    name: "Aadya Sharma (Studio)",
    phone: "+91 98765 43211",
    line1: "Penthouse 4B, Silver Oak Towers",
    line2: "Golf Course Road, Sector 54",
    city: "Gurugram",
    state: "Haryana",
    postalCode: "122002",
    country: "India",
    isDefault: false,
  },
];

/**
 * The customer directory — contact information and membership only. Order
 * history is derived from the order book (never stored twice), and nothing
 * a business view does not need lives here.
 */
export const customers = [
  {
    id: "CUST-84920",
    name: "Aadya Sharma",
    email: "aadya.sharma@swarnova.in",
    phone: "+91 98765 43210",
    city: "New Delhi",
    state: "Delhi",
    tier: "Swarnova Privé",
    memberSince: "October 2024",
  },
  {
    id: "CUST-77341",
    name: "Ritika Sengupta",
    email: "ritika.sengupta@gmail.com",
    phone: "+91 90071 22314",
    city: "Kolkata",
    state: "West Bengal",
    tier: "Swarnova Classic",
    memberSince: "February 2025",
  },
  {
    id: "CUST-66108",
    name: "Debasish Rout",
    email: "debasish.rout@outlook.com",
    phone: "+91 94370 88125",
    city: "Bhubaneswar",
    state: "Odisha",
    tier: "Swarnova Classic",
    memberSince: "June 2025",
  },
  {
    id: "CUST-91552",
    name: "Meenal Agrawal",
    email: "meenal.agrawal@yahoo.in",
    phone: "+91 98612 44790",
    city: "Cuttack",
    state: "Odisha",
    tier: "Swarnova Privé",
    memberSince: "November 2024",
  },
  {
    id: "CUST-58210",
    name: "Sourav Patnaik",
    email: "sourav.patnaik@gmail.com",
    phone: "+91 89173 60218",
    city: "Rourkela",
    state: "Odisha",
    tier: "Swarnova Classic",
    memberSince: "April 2026",
  },
  {
    id: "CUST-80917",
    name: "Ipsita Mohanty",
    email: "ipsita.mohanty@gmail.com",
    phone: "+91 79782 15630",
    city: "Bhubaneswar",
    state: "Odisha",
    tier: "Swarnova Classic",
    memberSince: "January 2026",
  },
];
