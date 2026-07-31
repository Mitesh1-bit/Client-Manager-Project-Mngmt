import { PageHeader } from "@/app/components/domain/page-header";
import { TableSkeleton } from "@/app/components/domain/states";

export default function ChangeRequestsLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Change requests"
        description="Everything clients have asked for, what needs assessing, and what's waiting on a decision."
      />
      <TableSkeleton rows={8} columns={8} />
    </>
  );
}
