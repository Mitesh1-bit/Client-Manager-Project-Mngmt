import Link from "next/link";
import { Inbox } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalApprovalsDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Approvals" };

export default async function PortalApprovalsPage() {
  await requireViewer("PORTAL");
  const { data } = await getClient().query({ query: PortalApprovalsDocument });
  const approvals = data.portalPendingApprovals ?? [];

  return (
    <>
      <PageHeader
        title="Approvals"
        description="Everything we've sent over for sign-off, and where each one has got to."
      />

      {approvals.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing to approve"
          description="When we finish a milestone that needs your sign-off, it'll appear here."
          action={
            <Button variant="outline" asChild>
              <Link href="/portal/projects">See your projects</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-3">
          {approvals.map((approval) => (
            <li key={approval.id} className="rounded-2xl border bg-card p-4 sm:p-5">
              <p className="font-medium">{approval.entityType.replace("_", " ")}</p>
              <p className="mt-1 text-caption text-muted-foreground">Status: {approval.status}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
