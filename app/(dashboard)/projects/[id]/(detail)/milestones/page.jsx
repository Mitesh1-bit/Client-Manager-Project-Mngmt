import { notFound } from "next/navigation";

import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectPlanDocument } from "@/app/lib/graphql/generated/documents";

import { ProjectPlan } from "./project-plan";

export const metadata = { title: "Milestones" };

export default async function ProjectMilestonesPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ProjectPlanDocument, variables: { id } });

  if (!data.project) notFound();

  return (
    <ProjectPlan
      projectId={data.project.id}
      phases={data.project.phases}
      milestones={data.project.milestones}
    />
  );
}
