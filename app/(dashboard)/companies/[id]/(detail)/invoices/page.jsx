import { notFound } from "next/navigation";
import { Lock, Receipt } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { asArray } from "@/app/lib/api/safe-list";
import { formatCurrency, formatDate } from "@/app/lib/format";
import { formatGraphqlError } from "@/app/lib/graphql/format-error";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  CompanyDetailHeaderDocument,
  CompanyInvoicesDocument,
} from "@/app/lib/graphql/generated/documents";

import { InvoiceDialog } from "./invoice-dialog";

export const metadata = { title: "Invoices" };

export default async function CompanyInvoicesPage({ params }) {
  const { id } = await params;
  const [{ data: header }, invoicesResult] = await Promise.all([
    getClient().query({ query: CompanyDetailHeaderDocument, variables: { id } }),
    getClient()
      .query({ query: CompanyInvoicesDocument, variables: { companyId: id } })
      .then(({ data }) => ({ data, error: null }))
      .catch((error) => ({ data: null, error })),
  ]);

  if (!header.company) notFound();

  // Invoices are finance-sensitive — the backend restricts who can see them
  // (see the tab-visibility check in the layout). Someone reaching this URL
  // directly without that role gets a plain explanation, not a page crash.
  if (invoicesResult.error) {
    return (
      <EmptyState
        icon={Lock}
        title="You don't have access to invoices"
        description={formatGraphqlError(invoicesResult.error, "Ask an admin or finance admin for access.")}
      />
    );
  }

  const invoices = asArray(invoicesResult.data.invoices).map((invoice) => ({
    ...invoice,
    status: invoice.status?.toUpperCase(),
  }));

  return (
    <div className="space-y-4">
      <div className="toolbar-row">
        <p className="text-caption text-muted-foreground">
          {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
        </p>
        <InvoiceDialog companyId={id} />
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Bill this client for work delivered — invoices show up here once created."
        />
      ) : (
        <ul className="space-y-2">
          {invoices.map((invoice) => (
            <li key={invoice.id} className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{invoice.invoiceNumber || "No number"}</p>
                    <StatusBadge kind="invoiceStatus" value={invoice.status} size="sm" />
                  </div>
                  <p className="mt-1 text-caption text-muted-foreground">
                    Due {formatDate(invoice.dueDate)}
                    {invoice.paidAt ? ` · paid ${formatDate(invoice.paidAt)}` : ""}
                  </p>
                  {invoice.notes ? (
                    <p className="mt-1 text-caption text-pretty text-muted-foreground">{invoice.notes}</p>
                  ) : null}
                </div>
                <p className="tabular font-medium">{formatCurrency(invoice.amount)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
