import { notFound } from "next/navigation";

import { pickList } from "@/app/lib/api/safe-list";
import { normalizeProjectPlan, usersByIdFromData } from "@/app/lib/api/project-plan";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectFormOptionsDocument,
  ProjectPlanDocument,
} from "@/app/lib/graphql/generated/documents";

import { ProjectGantt } from "./project-gantt";

// Mirrors the backend's createTask/deleteTask gate (require_role in
// app/graphql/planning/schema.py).
const PLAN_MANAGE_ROLES = ["admin", "project_manager"];

export const metadata = { title: "Timeline" };

export default async function ProjectGanttPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectPlanDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project) notFound();

  const claims = await getSessionClaims();
  const canManage = PLAN_MANAGE_ROLES.includes(claims?.role);

  const plan = normalizeProjectPlan(data.project, usersByIdFromData(options));

  return (
    <ProjectGantt
      projectId={plan.project.id}
      project={plan.project}
      phases={plan.phases}
      tasks={plan.tasks}
      milestones={plan.milestones}
      users={pickList(options, "users")}
      canManage={canManage}
    />
  );
}
