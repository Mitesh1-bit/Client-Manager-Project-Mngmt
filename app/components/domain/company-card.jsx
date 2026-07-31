import Link from "next/link";
import { Building2, FolderKanban, Users } from "lucide-react";

import { EntityAvatar } from "@/app/components/domain/entity-avatar";
import { HealthScoreBadge } from "@/app/components/domain/health-score-badge";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { TagList } from "@/app/components/domain/tag-list";
import { cn } from "@/app/lib/utils";

/**
 * Card presentation of a company, for grid layouts and anywhere a company is
 * referenced outside the main table.
 */
export function CompanyCard({ company, className }) {
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border bg-card p-4 transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <EntityAvatar name={company.name} imageUrl={company.logoUrl} kind="company" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">
            <Link
              href={`/companies/${company.id}`}
              className="after:absolute after:inset-0 focus-ring rounded-sm"
            >
              {company.name}
            </Link>
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-caption text-muted-foreground">
            <Building2 aria-hidden="true" className="size-3.5 shrink-0" />
            {company.industry ?? "No industry set"}
          </p>
        </div>
        <StatusBadge kind="companyStatus" value={company.status} size="sm" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <HealthScoreBadge score={company.healthScore} size="sm" showSparkline={false} />
        <dl className="flex items-center gap-4 text-caption text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Contacts</dt>
            <Users aria-hidden="true" className="size-3.5" />
            <dd className="tabular">{company.contactCount}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Projects</dt>
            <FolderKanban aria-hidden="true" className="size-3.5" />
            <dd className="tabular">{company.projectCount}</dd>
          </div>
        </dl>
      </div>

      {company.tags?.length ? <TagList tags={company.tags} /> : null}
    </article>
  );
}
