import { PageHeader } from "@/app/components/domain/page-header";
import { TableSkeleton } from "@/app/components/domain/states";

export default function ProjectsLoading() {
  return (
    <>
      <PageHeader eyebrow="Delivery" title="Projects" />
      <TableSkeleton rows={8} columns={8} />
    </>
  );
}
