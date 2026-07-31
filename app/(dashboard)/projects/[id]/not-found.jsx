import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

export default function ProjectNotFound() {
  return (
    <EmptyState
      icon={FolderKanban}
      title="Project not found"
      description="It may have been deleted, or you may not have access to it."
      action={
        <Button asChild>
          <Link href="/projects">Back to projects</Link>
        </Button>
      }
    />
  );
}
