/**
 * Mock customer account data — profile and addresses.
 * Shaped to mirror future customer account endpoints.
 */
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
