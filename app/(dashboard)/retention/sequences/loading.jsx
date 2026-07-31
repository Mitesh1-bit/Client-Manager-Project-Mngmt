import { PageHeader } from "@/app/components/domain/page-header";
import { CardGridSkeleton } from "@/app/components/domain/states";

export default function SequencesLoading() {
  return (
    <>
      <PageHeader eyebrow="Operations" title="Retention" />
      <CardGridSkeleton cards={4} />
    </>
  );
}
