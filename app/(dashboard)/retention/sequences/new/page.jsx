import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";

import { SequenceBuilder } from "../sequence-builder";

export const metadata = { title: "New sequence" };

export default function NewSequencePage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/retention/sequences"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Sequences
      </Link>

      <PageHeader
        title="New sequence"
        description="Define the steps, then enroll companies once you're happy with the timing."
      />

      <SequenceBuilder mode="create" />
    </div>
  );
}
