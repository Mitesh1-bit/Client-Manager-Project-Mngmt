import { notFound } from "next/navigation";

import { pickList } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectTeamDocument } from "@/app/lib/graphql/generated/documents";

import { TeamPanel } from "./team-panel";

export const metadata = { title: "Team" };

export default async function ProjectTeamPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ProjectTeamDocument, variables: { id } });

  if (!data.project) notFound();

  const claims = await getSessionClaims();

  return (
    <TeamPanel
      projectId={id}
      members={data.project.members ?? []}
      clientContacts={data.project.clientContacts ?? []}
      allUsers={pickList(data, "users")}
      companyContacts={data.project.company?.contacts ?? []}
      isAdmin={claims?.role === "admin"}
      isProjectManager={claims?.role === "project_manager" && Boolean(data.project.canManage)}
    />
  );
}
