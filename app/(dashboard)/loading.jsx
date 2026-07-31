import { PageHeader } from "@/app/components/domain/page-header";
import { CardGridSkeleton } from "@/app/components/domain/states";

export default function DashboardLoading() {
  return (
    <>
      <PageHeader eyebrow="Workspace" title="Dashboard" />
      <CardGridSkeleton cards={3} />
    </>
  );
}
