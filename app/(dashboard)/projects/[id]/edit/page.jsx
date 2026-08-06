import { notFound } from "next/navigation";

import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
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

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackLink href={`/projects/${id}`}>Back to {data.project.name}</BackLink>

      <PageHeader title={`Edit ${data.project.name}`} />

      <ProjectForm
        mode="edit"
        project={data.project}
        companies={pickList(options, "companies")}
        users={pickList(options, "users")}
        tags={pickList(options, "tags")}
      />
    </div>
  );
}
