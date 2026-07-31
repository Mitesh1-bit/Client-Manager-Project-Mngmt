import Link from "next/link";
import { FolderOpen } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

/**
 * The API scopes projects to the caller's own company, so another client's
 * project resolves to null and lands here — the portal never confirms that
 * some other company's project exists.
 */
export default function PortalProjectNotFound() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="We couldn't find that project"
      description="It may have finished, or the link may be out of date. Your current projects are all listed below."
      action={
        <Button asChild>
          <Link href="/portal/projects">Back to your projects</Link>
        </Button>
      }
    />
  );
}
