/**
 * PRICING — the ONE authoritative commerce calculation (Phase 12)
 * -----------------------------------------------------------------------------
 * Every commercial total in the platform is produced here and nowhere else:
 * the checkout summary, the placed order's snapshot and any future payment
 * reconciliation read these numbers — the UI only displays results and the
 * mock provider is the only caller. Cart, Checkout, Order and Payment never
 * re-derive a business rule.
 *
 * The Swarnova model, straight from the storefront's own commerce language:
 *
 *   Subtotal        Σ (unit price × quantity) — GST-inclusive prices
 * + Delivery        the selected canonical delivery method's charge
 * − Discount        reserved boundary; nothing in the source of truth
 *                   grants discounts, so it is always 0 today
 * = Grand Total
 *
 * Tax — "GST (3% Indian Jewellery Tax)" is INCLUDED in the catalogue prices
 * (the shopping bag and order detail both state this). The tax amount below
 * is therefore an extract of the total for display and reporting, never an
 * addition. Whole rupees throughout, matching the order book.
 */

export const GST_RATE = 0.03;
export const GST_LABEL = "GST (3% Indian Jewellery Tax)";

const round = (value) => Math.round(Number(value) || 0);

/**
 * The totals contract.
 *
 *   calculateTotals({
 *     items: [{ unitPrice, quantity }],   // canonical lines only
 *     deliveryCharge,                     // from the delivery method
 *     discount,                           // boundary — 0 until the source of truth says otherwise
 *   });
 */
export function calculateTotals({ items = [], deliveryCharge = 0, discount = 0 } = {}) {
  const lines = Array.isArray(items) ? items : [];

  const subtotal = round(
    lines.reduce((sum, line) => {
      const unit = Number(line?.unitPrice ?? line?.price ?? 0);
      const quantity = Number(line?.quantity ?? 0);
      if (!Number.isFinite(unit) || !Number.isFinite(quantity) || unit < 0 || quantity < 0) {
        return sum;
      }
      return sum + unit * quantity;
    }, 0)
  );

  const delivery = Math.max(0, round(deliveryCharge));
  const discountAmount = Math.max(0, round(discount));
  const grandTotal = Math.max(0, subtotal + delivery - discountAmount);

  /* Prices carry the tax, so the GST portion is backed out of the grand
     total — it can never inflate what the customer pays. */
  const taxAmount = round(grandTotal - grandTotal / (1 + GST_RATE));

  return {
    subtotal,
    deliveryCharge: delivery,
    discount: discountAmount,
    taxRate: GST_RATE,
    taxMode: "inclusive",
    taxLabel: GST_LABEL,
    taxAmount,
    grandTotal,
  };
}

export default { calculateTotals, GST_RATE, GST_LABEL };
