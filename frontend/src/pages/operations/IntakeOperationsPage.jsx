import { useSearchParams } from "react-router-dom";
import AsyncBoundary from "../../components/ui/AsyncBoundary.jsx";
import IntakeRecord from "../../components/requests/IntakeRecord.jsx";
import { useEmployeeActor } from "../../hooks/useEmployeeOperations.js";
import { useIntake } from "../../hooks/useIntake.js";
import { intakePaths } from "../../utils/links.js";

export default function IntakeOperationsPage({ kind }) {
  const actor = useEmployeeActor();
  const [params] = useSearchParams();
  const resource = useIntake(kind, {
    mode: "operations",
    actor,
    branchId: params.get("branch") || undefined,
  });
  return (
    <section data-intake-content className="space-y-6 min-w-0">
      <h1 className="font-serif text-3xl">{intakePaths[kind].title}</h1>
      <p className="text-text-secondary">
        Read-only intake book within your permitted scope. No confirmation,
        quotation, refund or repair actions are available.
      </p>
      <AsyncBoundary
        status={resource.status}
        error={resource.error}
        onRetry={resource.retry}
        isEmpty={resource.data?.length === 0}
        emptyMessage="No requests in your permitted scope."
      >
        <div className="divide-y divide-border-default">
          {resource.data?.map((record) => (
            <details key={record.id} className="py-5">
              <summary className="cursor-pointer break-words">
                {record.id} · {record.status} ·{" "}
                {record.branchName ?? "Head office"} · {record.contact?.name}
              </summary>
              <div className="pt-6">
                <IntakeRecord record={record} operational />
              </div>
            </details>
          ))}
        </div>
      </AsyncBoundary>
    </section>
  );
}
