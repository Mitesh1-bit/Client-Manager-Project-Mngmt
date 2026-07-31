import { Hammer } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { PageHeader } from "@/app/components/domain/page-header";

/**
 * Stands in for a module that later phases deliver. Uses the real page header
 * and empty state so the route is navigable and the shell is reviewable now.
 */
export function PhasePlaceholder({ eyebrow, title, description, phase, scope = [] }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <EmptyState
        icon={Hammer}
        title={`Arrives in ${phase}`}
        description={
          scope.length
            ? `This screen will cover ${scope.join(", ")}.`
            : "Not built yet — the shell and navigation are in place."
        }
      />
    </>
  );
}
