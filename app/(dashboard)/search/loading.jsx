import { CardGridSkeleton } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";

export default function SearchLoading() {
  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Search"
        description="One search across companies, contacts, projects and tasks."
      />
      <CardGridSkeleton cards={4} />
    </>
  );
}
