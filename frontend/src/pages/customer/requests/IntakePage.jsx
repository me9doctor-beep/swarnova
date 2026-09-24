import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Container from "../../../components/ui/Container.jsx";
import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import Select from "../../../components/ui/Select.jsx";
import Textarea from "../../../components/ui/Textarea.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ContentLink from "../../../components/ui/ContentLink.jsx";
import { useIntake } from "../../../hooks/useIntake.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { intakePaths, intakeDetailLink } from "../../../utils/links.js";

const titles = {
  custom: "A piece, imagined by you",
  appointment: "Time at the boutique",
  service: "Care for your treasured piece",
};
const copy = {
  custom:
    "Tell us what you have in mind. This is a consultation intake, not an order, quotation or manufacturing instruction.",
  appointment:
    "Request a private viewing or fitting. Your preferred date and time are not reserved or confirmed; the boutique must confirm separately.",
  service:
    "Share a return or care enquiry about a piece in your order history. Submission does not approve a return, refund, warranty claim or repair.",
};
export default function IntakePage({ kind }) {
  const resource = useIntake(kind, { mode: "options" });
  useDocumentTitle(`${intakePaths[kind].title} — Swarnova`);
  return (
    <Container className="py-12 sm:py-20">
      <div data-intake-content className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-4">
          <p className="eyebrow">At your service</p>
          <h1 className="font-serif text-4xl sm:text-5xl">{titles[kind]}</h1>
          <p className="text-body-lg text-text-secondary">{copy[kind]}</p>
        </header>
        <AsyncBoundary
          status={resource.status}
          error={resource.error}
          onRetry={resource.retry}
        >
          {resource.data && (
            <RequestForm
              key={kind}
              kind={kind}
              options={resource.data}
              submit={resource.submit}
              submission={resource.submission}
            />
          )}
        </AsyncBoundary>
        <ContentLink
          className="text-brand-primary underline underline-offset-4"
          href={intakePaths[kind].account}
        >
          View your {intakePaths[kind].title.toLowerCase()}
        </ContentLink>
      </div>
    </Container>
  );
}
function RequestForm({ kind, options, submit, submission }) {
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("orderId") ?? "");
  const order = options.orders.find((item) => item.id === orderId);
  const busy = submission.status === "loading";
  if (submission.status === "success")
    return (
      <section
        role="status"
        className="space-y-5 border-y border-border-default py-8"
      >
        <h2 className="font-serif text-3xl">Your request has been recorded</h2>
        <p>
          {submission.record.id} · {submission.record.status}
        </p>
        <p className="text-text-secondary">
          This demonstration stores requests only for the current page session.
          No notification has been sent. {copy[kind]}
        </p>
        <Button href={intakeDetailLink(kind, submission.record.id)}>
          View request
        </Button>
      </section>
    );
  if (kind === "service" && !options.orders.length)
    return (
      <p className="py-8">
        There are no orders in your account yet. Return and care requests must
        reference a piece from your own order history.
      </p>
    );
  const branches = (
    <>
      <option value="">
        {kind === "custom"
          ? "No preference — head office"
          : "Choose a boutique"}
      </option>
      {options.branches.map((branch) => (
        <option value={branch.id} key={branch.id}>
          {branch.name}
        </option>
      ))}
    </>
  );
  return (
    <form
      className="space-y-7"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy)
          submit(Object.fromEntries(new FormData(event.currentTarget)));
      }}
    >
      <p className="text-body text-text-secondary break-words">
        Contact:{" "}
        {[options.contact.name, options.contact.email, options.contact.phone]
          .filter(Boolean)
          .join(" · ")}
        .{" "}
        <ContentLink href="/account/profile" className="underline">
          Update your profile
        </ContentLink>{" "}
        before submitting if needed.
      </p>
      <fieldset disabled={busy} className="space-y-6 min-w-0">
        <legend className="sr-only">Request details</legend>
        {kind === "custom" && (
          <>
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                name="category"
                label="Jewellery type"
                placeholder="For example, a ring"
                required
                maxLength={160}
              />
              <Input
                name="style"
                label="Desired style (optional)"
                maxLength={160}
              />
              <Input
                name="occasion"
                label="Occasion (optional)"
                maxLength={160}
              />
              <Input
                name="quantity"
                label="Quantity"
                type="number"
                min="1"
                max="100"
                defaultValue="1"
                required
              />
              <Input
                name="metalPreference"
                label="Metal preference (optional)"
                maxLength={160}
              />
              <Input
                name="purity"
                label="Purity preference (optional)"
                maxLength={160}
              />
              <Input
                name="stonePreference"
                label="Stone preference (optional)"
                maxLength={160}
              />
              <Input
                name="budgetRange"
                label="Budget range in INR (optional)"
                hint={
                  <span className="text-text-secondary">
                    A preference only, not a quotation.
                  </span>
                }
                maxLength={160}
              />
            </div>
            <Select
              name="productId"
              label="Catalogue inspiration (optional)"
              defaultValue={params.get("productId") ?? ""}
            >
              <option value="">No selected piece</option>
              {options.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select
              name="aiDesignId"
              label="AI concept inspiration (optional)"
              hint={
                <span className="text-text-secondary">
                  References the shared demonstration concept, not a private
                  saved-design snapshot.
                </span>
              }
              defaultValue={params.get("aiDesignId") ?? ""}
            >
              <option value="">No selected concept</option>
              {options.designs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select
              name="preferredBranchId"
              label="Preferred boutique (optional)"
              defaultValue={params.get("branchId") ?? ""}
            >
              {branches}
            </Select>
            <Textarea
              name="description"
              label="Your vision and requirements"
              required
              maxLength={2000}
            />
          </>
        )}
        {kind === "appointment" && (
          <>
            <Select
              name="type"
              label="How may we welcome you?"
              defaultValue={
                params.get("type") === "FITTING" ? "FITTING" : "PRIVATE_VIEWING"
              }
              required
            >
              <option value="PRIVATE_VIEWING">Private viewing</option>
              <option value="FITTING">Fitting</option>
            </Select>
            <Select
              name="branchId"
              label="Boutique"
              defaultValue={params.get("branchId") ?? ""}
              required
            >
              {branches}
            </Select>
            <div className="grid gap-6 sm:grid-cols-2">
              <Input
                name="requestedDate"
                label="Preferred date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                required
              />
              <Input
                name="requestedTime"
                label="Preferred time"
                hint={
                  <span className="text-text-secondary">
                    Boutique local time; not live availability.
                  </span>
                }
                type="time"
                required
              />
            </div>
            <Textarea
              name="note"
              label="Anything you would like us to know? (optional)"
              maxLength={2000}
            />
          </>
        )}
        {kind === "service" && (
          <>
            <Select
              name="orderId"
              label="Your order"
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              required
            >
              <option value="">Choose an order</option>
              {options.orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber ?? o.id}
                </option>
              ))}
            </Select>
            <Select
              key={orderId}
              name="orderItemId"
              label="Your piece"
              defaultValue=""
              required
              disabled={!order}
            >
              <option value="">Choose a piece</option>
              {order?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select name="type" label="Request type" required>
              <option value="RETURN_REQUEST">Return enquiry</option>
              <option value="CARE_REQUEST">Care enquiry</option>
            </Select>
            <Input name="reason" label="Reason" required maxLength={160} />
            <Textarea
              name="description"
              label="How can we help?"
              required
              maxLength={2000}
            />
          </>
        )}
        {kind !== "appointment" && (
          <p className="text-body-sm text-text-secondary">
            Image attachments are not available yet. Please describe your
            references; secure image storage is a production dependency.
          </p>
        )}
      </fieldset>
      {submission.error && (
        <p role="alert" className="text-state-error">
          {submission.error.message}
        </p>
      )}
      <Button
        type="submit"
        disabled={busy || (kind === "appointment" && !options.branches.length)}
      >
        {busy ? "Submitting request…" : "Submit request"}
      </Button>
      {kind === "appointment" && !options.branches.length && (
        <p role="status">No boutiques are currently available for requests.</p>
      )}
      <p className="text-caption text-text-secondary">
        Demonstration intake · recorded in this page session only · no external
        notification
      </p>
    </form>
  );
}
