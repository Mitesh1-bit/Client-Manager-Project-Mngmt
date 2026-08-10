import { notFound, redirect } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { normalizeProject } from "@/app/lib/api/normalize";
import { pickList } from "@/app/lib/api/safe-list";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectForEditDocument,
  ProjectFormOptionsDocument,
} from "@/app/lib/graphql/generated/documents";

import { ProjectForm } from "../../project-form";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ProjectForEditDocument, variables: { id } });
  return { title: data.project ? `Edit ${data.project.name}` : "Edit project" };
}

export default async function EditProjectPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectForEditDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project) notFound();
  if (!data.project.canManage) redirect(`/projects/${id}`);

  const companies = pickList(options, "companies");
  const users = pickList(options, "users");
  const companiesById = new Map(companies.map((company) => [String(company.id), company]));
  const usersById = new Map(users.map((user) => [String(user.id), user]));
  const project = normalizeProject(data.project, usersById, companiesById);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={`/projects/${id}`}>Back to {project.name}</BackLink>

      <PageHeader title={`Edit ${project.name}`} />

      <ProjectForm
        key={project.id}
        mode="edit"
        project={project}
        companies={companies}
        users={users}
        tags={pickList(options, "tags")}
      />
    </div>
  );
}
