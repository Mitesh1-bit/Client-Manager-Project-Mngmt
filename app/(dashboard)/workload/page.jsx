import { redirect } from "next/navigation";

import { PageHeader } from "@/app/components/domain/page-header";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { WorkloadDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { WorkloadPanel } from "./workload-panel";

// Mirrors the backend's workload gate — team members don't manage delivery
// capacity, so this stays admin/PM territory like the rest of Operations.
const WORKLOAD_ROLES = ["admin", "project_manager"];

export const metadata = { title: "Workload" };

export default async function WorkloadPage() {
  const viewer = await requireViewer("INTERNAL");
  if (!WORKLOAD_ROLES.includes(viewer.role)) redirect("/dashboard");

  const { data } = await getClient().query({ query: WorkloadDocument, variables: { projectId: null } });

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Workload"
        description="Who's handling what — projects, clients, and open task load per person, with a quick way to add them to another project."
      />

      <WorkloadPanel
        initialRows={pickList(data, "workload")}
        users={pickList(data, "users")}
        projects={pickList(data, "projects")}
        companies={pickList(data, "companies")}
        viewerRole={viewer.role}
      />
    </>
  );
}
