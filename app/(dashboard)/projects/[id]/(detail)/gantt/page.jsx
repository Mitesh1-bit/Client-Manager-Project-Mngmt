import { notFound } from "next/navigation";

import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectFormOptionsDocument,
  ProjectPlanDocument,
} from "@/app/lib/graphql/generated/documents";

import { ProjectGantt } from "./project-gantt";

export const metadata = { title: "Timeline" };

export default async function ProjectGanttPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectPlanDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project) notFound();

  return (
    <ProjectGantt
      projectId={data.project.id}
      project={data.project}
      phases={data.project.phases}
      tasks={data.project.tasks}
      milestones={data.project.milestones}
      users={options.users}
    />
  );
}
