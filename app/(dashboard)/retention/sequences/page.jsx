import { PageHeader } from "@/app/components/domain/page-header";
import { RETENTION_MODULE_DESCRIPTION } from "@/app/lib/retention";

import { SequencesListPanel } from "./sequences-list-panel";

export const metadata = { title: "Sequences" };

export default function RetentionSequencesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Retention"
        description={RETENTION_MODULE_DESCRIPTION}
      />

      <SequencesListPanel />
    </>
  );
}
