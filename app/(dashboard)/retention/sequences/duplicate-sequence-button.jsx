"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Copy, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { DuplicateRetentionSequenceDocument } from "@/app/lib/graphql/generated/documents";

export function DuplicateSequenceButton({ sequenceId }) {
  const router = useRouter();
  const [duplicate, { loading }] = useMutation(DuplicateRetentionSequenceDocument);

  async function handleDuplicate() {
    try {
      const { data } = await duplicate({
        variables: { sequenceId },
        update: (cache) => cache.evict({ fieldName: "retentionSequences" }),
      });
      toast.success("Sequence duplicated as draft");
      router.push(`/retention/sequences/${data.duplicateRetentionSequence.id}/edit`);
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? "Couldn't duplicate this sequence.");
    }
  }

  return (
    <Button variant="outline" onClick={handleDuplicate} disabled={loading}>
      {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Copy aria-hidden="true" />}
      Duplicate
    </Button>
  );
}
