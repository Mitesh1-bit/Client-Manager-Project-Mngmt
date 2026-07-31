import { notFound } from "next/navigation";

import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectBoardDocument,
  ProjectFormOptionsDocument,
  ProjectPlanDocument,
} from "@/app/lib/graphql/generated/documents";

import { ProjectBoard } from "./project-board";

export const metadata = { title: "Board" };

export default async function ProjectBoardPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: plan }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectBoardDocument, variables: { id } }),
    getClient().query({ query: ProjectPlanDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project) notFound();

  return (
    <ProjectBoard
      projectId={data.project.id}
      tasks={data.project.tasks}
      phases={plan.project.phases}
      milestones={plan.project.milestones}
      users={options.users}
    />
  );
}
