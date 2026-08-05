import { notFound } from "next/navigation";

import { normalizeProjectPlan } from "@/app/lib/api/project-plan";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { ProjectPlanDocument } from "@/app/lib/graphql/generated/documents";

import { ProjectPlan } from "./project-plan";

// Mirrors the backend's create/update/delete phase & milestone gate
// (require_role in app/graphql/planning/schema.py).
const PLAN_MANAGE_ROLES = ["admin", "project_manager"];

export const metadata = { title: "Milestones" };

export default async function ProjectMilestonesPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({ query: ProjectPlanDocument, variables: { id } });

  if (!data.project) notFound();

  const claims = await getSessionClaims();
  const canManage = PLAN_MANAGE_ROLES.includes(claims?.role);

  const plan = normalizeProjectPlan(data.project);

  return (
    <ProjectPlan
      projectId={plan.project.id}
      phases={plan.phases}
      milestones={plan.milestones}
      canManage={canManage}
    />
  );
}
