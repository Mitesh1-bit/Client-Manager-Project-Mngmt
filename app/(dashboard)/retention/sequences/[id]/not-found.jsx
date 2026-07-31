import Link from "next/link";
import { Workflow } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

export default function SequenceNotFound() {
  return (
    <EmptyState
      icon={Workflow}
      title="Sequence not found"
      description="It may have been removed, or the link may be out of date."
      action={
        <Button asChild>
          <Link href="/retention/sequences">Back to sequences</Link>
        </Button>
      }
    />
  );
}
