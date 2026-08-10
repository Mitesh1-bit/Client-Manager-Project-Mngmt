import { redirect } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectFormOptionsDocument } from "@/app/lib/graphql/generated/documents";
import { pickList } from "@/app/lib/api/safe-list";
import { getSessionClaims } from "@/app/lib/auth/session";
import { canManageProjects } from "@/app/lib/rbac";

import { ProjectForm } from "../project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const claims = await getSessionClaims();
  if (!canManageProjects(claims?.role)) redirect("/projects");

  let companies = [];
  let users = [];
  let tags = [];

  try {
    const { data } = await getClient().query({ query: ProjectFormOptionsDocument });
    companies = pickList(data, "companies");
    users = pickList(data, "users");
    tags = pickList(data, "tags");
  } catch {
    companies = [];
    users = [];
    tags = [];
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href="/projects">Back to projects</BackLink>

      <PageHeader
        title="New project"
        description="Set up the shape of the engagement — phases, milestones and tasks come next."
      />

      <ProjectForm mode="create" companies={companies} users={users} tags={tags} />
    </div>
  );
}
