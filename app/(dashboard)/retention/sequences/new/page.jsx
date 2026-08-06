import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";

import { SequenceBuilder } from "../sequence-builder";

export const metadata = { title: "New sequence" };

export default function NewSequencePage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/retention/sequences">Sequences</BackLink>

      <PageHeader
        title="New sequence"
        description="Define the steps, then enroll clients once you're happy with the timing."
      />

      <SequenceBuilder mode="create" />
    </div>
  );
}
