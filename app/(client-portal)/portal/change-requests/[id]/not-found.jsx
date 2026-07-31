import Link from "next/link";
import { GitPullRequestArrow } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

export default function PortalChangeRequestNotFound() {
  return (
    <EmptyState
      icon={GitPullRequestArrow}
      title="We couldn't find that request"
      description="It may be out of date. Your current requests are listed below."
      action={
        <Button asChild>
          <Link href="/portal/change-requests">Back to your requests</Link>
        </Button>
      }
    />
  );
}
