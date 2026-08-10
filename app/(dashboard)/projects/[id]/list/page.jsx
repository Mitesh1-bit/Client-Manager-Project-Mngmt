import { notFound } from "next/navigation";

import { pickList } from "@/app/lib/api/safe-list";
import { normalizeProjectPlan, usersByIdFromData } from "@/app/lib/api/project-plan";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectFormOptionsDocument,
  ProjectPlanDocument,
} from "@/app/lib/graphql/generated/documents";

import { TaskList } from "./task-list";

// Mirrors the backend's createTask/deleteTask gate (require_role in
// app/graphql/planning/schema.py). updateTask stays open to team members but
// backend-restricted to the status field on tasks assigned to them (see
// update_task_record in app/graphql/planning/service.py).
const PLAN_MANAGE_ROLES = ["admin", "project_manager"];

export const metadata = { title: "Task list" };

export default async function ProjectListPage({ params }) {
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
    <TaskList
      projectId={plan.project.id}
      tasks={plan.tasks}
      phases={plan.phases}
      milestones={plan.milestones}
      users={pickList(options, "users")}
      canManage={canManage}
      viewerId={claims?.sub}
    />
  );
}
