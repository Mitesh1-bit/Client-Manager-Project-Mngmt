import { PageHeader } from "@/app/components/domain/page-header";

import { RetentionTabs } from "../retention-tabs";
import { SequencesListPanel } from "./sequences-list-panel";

export const metadata = { title: "Sequences" };

export default function RetentionSequencesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Retention"
        description="AI-assisted and manual retention sequences, linked to client companies and approved before use."
      />

      <SequencesListPanel />
    </>
  );
}
