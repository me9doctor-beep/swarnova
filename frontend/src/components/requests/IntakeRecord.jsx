import Badge from "../ui/Badge.jsx";

const labels = {
  type: "Service",
  customerId: "Customer",
  productName: "Piece",
  productId: "Product reference",
  designName: "AI concept",
  aiDesignId: "Design reference",
  source: "Source",
  orderId: "Order",
  orderItemId: "Order item",
  category: "Jewellery type",
  style: "Desired style",
  occasion: "Occasion",
  quantity: "Quantity",
  metalPreference: "Metal preference",
  purity: "Purity",
  stonePreference: "Stones",
  budgetRange: "Budget preference",
  branchName: "Boutique",
  requestedDate: "Preferred date",
  requestedTime: "Preferred time (boutique local time)",
  reason: "Reason",
  description: "Your requirements",
  note: "Note",
  createdAt: "Submitted",
  updatedAt: "Last updated",
};
export default function IntakeRecord({ record, operational = false }) {
  return (
    <article className="min-w-0 space-y-6 break-words">
      <header className="flex flex-wrap items-center gap-3">
        <h2 className="font-serif text-2xl">{record.id}</h2>
        <Badge>{record.status.replaceAll("_", " ")}</Badge>
      </header>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {Object.entries(labels)
          .filter(
            ([key]) =>
              record[key] != null && (key !== "customerId" || operational),
          )
          .map(([key, label]) => (
            <div
              key={key}
              className={
                key === "description" || key === "note" ? "sm:col-span-2" : ""
              }
            >
              <dt className="text-caption uppercase tracking-wider text-text-secondary">
                {label}
              </dt>
              <dd className="mt-1 whitespace-pre-wrap text-body">
                {String(record[key]).replaceAll("_", " ")}
              </dd>
            </div>
          ))}
        <div className="sm:col-span-2">
          <dt className="text-caption uppercase tracking-wider text-text-secondary">
            Contact context at submission
          </dt>
          <dd className="mt-1">
            {[
              record.contact?.name,
              record.contact?.email,
              record.contact?.phone,
            ]
              .filter(Boolean)
              .join(" · ")}
          </dd>
        </div>
      </dl>
    </article>
  );
}
