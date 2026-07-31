import Link from "next/link";
import { Building2 } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

export default function CompanyNotFound() {
  return (
    <EmptyState
      icon={Building2}
      title="Company not found"
      description="It may have been deleted, or you may not have access to it."
      action={
        <Button asChild>
          <Link href="/companies">Back to companies</Link>
        </Button>
      }
    />
  );
}
