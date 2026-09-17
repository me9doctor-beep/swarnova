/**
 * CHECKOUT FIXTURES (Phase 12)
 * -----------------------------------------------------------------------------
 * The canonical delivery and payment surfaces the online checkout offers.
 * Both lists are shaped to mirror future `GET /delivery-methods` and
 * `GET /payment-methods` endpoints — the checkout UI renders whatever this
 * catalogue contains, and the provider validates every selection against it,
 * so nothing a client invents can reach an order.
 *
 * Delivery — the storefront's single, source-of-truth method: the
 * complimentary insured armoured courier the shopping bag and every open
 * order in the order book already promise. No express tier, pickup network
 * or courier integration exists in the source of truth, so none is invented.
 *
 * Payment — the prepaid methods the canonical order book already records for
 * storefront orders ("Prepaid · UPI", "Prepaid · Net Banking"). There is no
 * cash-on-delivery and no online card form: the source of truth supports
 * neither for online checkout, so neither is invented. Card-at-boutique
 * remains a counter flow recorded on boutique orders — not a checkout path.
 *
 * The gateway is deliberately unnamed. `orderMethodLabel` is the exact
 * string the canonical order book stores, so a checkout order is
 * indistinguishable from the orders already in the book.
 */

export const deliveryMethods = [
  {
    id: "insured-courier",
    label: "Insured Courier Delivery",
    description:
      "Complimentary insured, armoured courier across India — signature handover and live consignment tracking.",
    charge: 0,
    currency: "INR",
    eta: "2–5 working days",
    courier: "Blue Dart Apex Insured",
  },
];

export const paymentMethods = [
  {
    id: "upi",
    label: "UPI",
    mode: "prepaid",
    orderMethodLabel: "Prepaid · UPI",
    description: "Pay from any UPI app. Protected, instant, and confirmed before we craft your consignment.",
    /* The one client-safe detail the method asks for — a payment handle,
       never a credential. The mock processor settles deterministically. */
    detail: { field: "upiId", label: "UPI ID", placeholder: "yourname@bank" },
  },
  {
    id: "netbanking",
    label: "Net Banking",
    mode: "prepaid",
    orderMethodLabel: "Prepaid · Net Banking",
    description: "Confirm the payment through your own bank's secure portal after you place the order.",
    detail: null,
  },
];

/**
 * Deterministic mock-payment behaviour, documented where it is defined:
 * every checkout settles successfully except a UPI id beginning with
 * "fail", which the processor declines — the demonstration path for the
 * declined-payment experience. No card number, CVV or payment secret is
 * ever requested, stored or logged anywhere in the mock.
 */
export const checkoutScenarios = {
  declinedUpiPrefix: "fail",
};

export default { deliveryMethods, paymentMethods, checkoutScenarios };
