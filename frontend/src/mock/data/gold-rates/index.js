/**
 * Daily indicative gold-rate board. Shape mirrors a future rates API feed.
 * Prices are whole INR per 10 grams, exclusive of making charges and GST.
 */
export const goldRateBoard = {
  id: "GOLD-DESK-IN",
  market: "India",
  currency: "INR",
  unit: "10 g",
  updatedAt: "2026-02-14T09:30:00+05:30",
  sourceLabel: "Swarnova Bullion Desk",
  note: "Indicative morning rates for reference; final in-store rates apply at billing.",
  includes: "BIS hallmarked gold · exclusive of making charges & taxes",
  rates: [
    {
      karat: "22K",
      label: "22 Karat Gold",
      pricePer10g: 74250,
      description: "Hallmarked jewellery gold",
    },
    {
      karat: "24K",
      label: "24 Karat Gold",
      pricePer10g: 81040,
      description: "Pure gold, coins & bars",
    },
  ],
};

export default goldRateBoard;
