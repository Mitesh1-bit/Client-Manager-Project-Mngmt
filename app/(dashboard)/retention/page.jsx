import { CircleCheck, ShieldCheck } from "lucide-react";

import { LogTouchpointSheet } from "@/app/components/domain/log-touchpoint-sheet";
import { PageHeader } from "@/app/components/domain/page-header";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  AtRiskDashboardDocument,
  RetentionFormOptionsDocument,
} from "@/app/lib/graphql/generated/documents";

import { AtRiskCompanyCard } from "./at-risk-company-card";
import { RetentionTabs } from "./retention-tabs";

export const metadata = { title: "Retention" };

export default async function RetentionAtRiskPage() {
  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: AtRiskDashboardDocument }),
    getClient().query({ query: RetentionFormOptionsDocument }),
  ]);

  const rows = data.atRiskCompanies;

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Retention"
        description="Accounts that need attention before they churn, and why each one is flagged."
        actions={
          <LogTouchpointSheet
            companies={options.companies.nodes}
            trigger={
              <Button variant="outline">
                <ShieldCheck aria-hidden="true" />
                Log a touchpoint
              </Button>
            }
          />
        }
      />

      <div className="space-y-4">
        <RetentionTabs counts={{ "/retention": rows.length }} />

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-tone-positive-bg text-tone-positive-fg">
              <CircleCheck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="font-medium">Nothing at risk right now</p>
              <p className="mt-1 max-w-sm text-caption text-muted-foreground">
                Every active account has a healthy score, recent contact, and no overdue
                touchpoints.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <AtRiskCompanyCard
                key={row.company.id}
                row={row}
                sequences={options.retentionSequences}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
