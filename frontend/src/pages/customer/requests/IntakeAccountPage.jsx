import { useParams } from "react-router-dom";
import Button from "../../../components/ui/Button.jsx";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ContentLink from "../../../components/ui/ContentLink.jsx";
import IntakeRecord from "../../../components/requests/IntakeRecord.jsx";
import { useIntake } from "../../../hooks/useIntake.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { intakePaths, intakeDetailLink } from "../../../utils/links.js";

export default function IntakeAccountPage({ kind }) {
  const { id } = useParams();
  const resource = useIntake(kind, { mode: id ? "detail" : "list", id });
  useDocumentTitle(`${intakePaths[kind].title} — Swarnova`);
  return (
    <section data-intake-content className="space-y-8 min-w-0">
      <header className="space-y-4">
        <h1 className="font-serif text-4xl">{intakePaths[kind].title}</h1>
        <p className="text-text-secondary">
          Requests, not confirmed bookings or commercial approvals.
          Demonstration records last for this page session only.
        </p>
        <Button href={intakePaths[kind].create} variant="outline">
          Make a request
        </Button>
      </header>
      {id && (
        <ContentLink
          href={intakePaths[kind].account}
          className="inline-block underline"
        >
          Back to requests
        </ContentLink>
      )}
      <AsyncBoundary
        status={resource.status}
        error={resource.error}
        onRetry={resource.retry}
        isEmpty={!id && resource.data?.length === 0}
        emptyMessage="No requests yet. When you submit one, its details and status will appear here."
      >
        {id ? (
          resource.data && <IntakeRecord record={resource.data} />
        ) : (
          <ul className="divide-y divide-border-default">
            {resource.data?.map((record) => (
              <li key={record.id} className="py-6 space-y-2 break-words">
                <ContentLink
                  className="font-serif text-2xl underline underline-offset-4"
                  href={intakeDetailLink(kind, record.id)}
                >
                  {record.id}
                </ContentLink>
                <p>
                  {record.type?.replaceAll("_", " ") ?? record.category} ·{" "}
                  {record.status}
                </p>
                <p className="text-text-secondary">
                  {record.productName ?? record.branchName ?? "Head office"} ·{" "}
                  {record.createdAt.slice(0, 10)}
                </p>
                {record.requestedDate && (
                  <p>
                    Preferred: {record.requestedDate} at {record.requestedTime}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </AsyncBoundary>
    </section>
  );
}
