import { PageHeader } from "@/app/components/domain/page-header";
import { TableSkeleton } from "@/app/components/domain/states";

export default function CompaniesLoading() {
  return (
    <>
      <PageHeader eyebrow="Clients" title="Clients" />
      <TableSkeleton rows={8} columns={7} />
    </>
  );
}
