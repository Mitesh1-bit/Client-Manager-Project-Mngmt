import { notFound } from "next/navigation";

import { normalizeProjectPlan } from "@/app/lib/api/project-plan";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectPlanDocument } from "@/app/lib/graphql/generated/documents";

import { ProjectPlan } from "./project-plan";

export const metadata = { title: "Milestones" };

export default async function ProjectMilestonesPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ProjectPlanDocument, variables: { id } });

  if (!data.project) notFound();

  const canManage = Boolean(data.project.canManage);

  const plan = normalizeProjectPlan(data.project);

  return (
    <ProjectPlan
      projectId={plan.project.id}
      phases={plan.phases}
      milestones={plan.milestones}
      boardColumns={plan.boardColumns}
      canManage={canManage}
    />
  );
}
