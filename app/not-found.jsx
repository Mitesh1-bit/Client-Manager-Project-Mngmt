import Link from "next/link";
import { Compass } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-6 py-20">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist, or you may not have access to it."
        action={
          <Button asChild>
            <Link href="/">Back to dashboard</Link>
          </Button>
        }
        className="max-w-md"
      />
    </main>
  );
}
