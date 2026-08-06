import { notFound } from "next/navigation";
import { FileSignature } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { asArray } from "@/app/lib/api/safe-list";
import { formatCurrency, formatDate } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyContractsDocument,
  CompanyDetailHeaderDocument,
} from "@/app/lib/graphql/generated/documents";

import { ContractDialog } from "./contract-dialog";

export const metadata = { title: "Contracts" };

export default async function CompanyContractsPage({ params }) {
  const { id } = await params;
  const [{ data: header }, { data }] = await Promise.all([
    getClient().query({ query: CompanyDetailHeaderDocument, variables: { id } }),
    getClient().query({ query: CompanyContractsDocument, variables: { companyId: id } }),
  ]);

  if (!header.company) notFound();
  const contracts = asArray(data.contracts).map((contract) => ({
    ...contract,
    status: contract.status?.toUpperCase(),
  }));

  return (
    <div className="space-y-4">
      <div className="toolbar-row">
        <p className="text-caption text-muted-foreground">
          {contracts.length} contract{contracts.length === 1 ? "" : "s"}
        </p>
        <ContractDialog companyId={id} currency={contracts[0]?.currency ?? "GBP"} />
      </div>

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No contracts yet"
          description="Record what this client is signed up for — term, value and renewal."
        />
      ) : (
        <ul className="space-y-2">
          {contracts.map((contract) => (
            <li key={contract.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{contract.name}</p>
                    <StatusBadge kind="contractStatus" value={contract.status} size="sm" />
                    {contract.autoRenew ? (
                      <span className="text-caption text-muted-foreground">Auto-renews</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {formatDate(contract.startDate)} – {formatDate(contract.endDate)}
                  </p>
                </div>
                <p className="tabular font-medium">{formatCurrency(contract.value, contract.currency)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
