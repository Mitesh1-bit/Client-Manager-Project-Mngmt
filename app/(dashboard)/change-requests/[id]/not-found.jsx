import Link from "next/link";
import { GitPullRequestArrow } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

export default function ChangeRequestNotFound() {
  return (
    <EmptyState
      icon={GitPullRequestArrow}
      title="Change request not found"
      description="It may have been removed, or the link may be out of date."
      action={
        <Button asChild>
          <Link href="/change-requests">Back to change requests</Link>
        </Button>
      }
    />
  );
}
