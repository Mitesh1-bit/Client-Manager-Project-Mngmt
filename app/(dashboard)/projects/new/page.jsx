import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectFormOptionsDocument } from "@/app/lib/graphql/generated/documents";

import { ProjectForm } from "../project-form";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const { data } = await getClient().query({ query: ProjectFormOptionsDocument });

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/projects"
        className="mb-4 inline-flex items-center gap-1 rounded-sm text-caption text-muted-foreground hover:text-foreground focus-ring"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Back to projects
      </Link>

      <PageHeader
        title="New project"
        description="Set up the shape of the engagement — phases, milestones and tasks come next."
      />

      <ProjectForm
        mode="create"
        companies={data.companies.nodes}
        users={data.users}
        tags={data.tags}
      />
    </div>
  );
}
