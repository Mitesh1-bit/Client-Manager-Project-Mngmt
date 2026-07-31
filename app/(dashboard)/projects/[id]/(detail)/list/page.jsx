import { notFound } from "next/navigation";

import { pickList } from "@/app/lib/api/safe-list";
import { normalizeProjectPlan, usersByIdFromData } from "@/app/lib/api/project-plan";
import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectFormOptionsDocument,
  ProjectPlanDocument,
} from "@/app/lib/graphql/generated/documents";

import { TaskList } from "./task-list";

export const metadata = { title: "Task list" };

export default async function ProjectListPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectPlanDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project) notFound();

  const plan = normalizeProjectPlan(data.project, usersByIdFromData(options));

  return (
    <TaskList
      projectId={plan.project.id}
      tasks={plan.tasks}
      phases={plan.phases}
      milestones={plan.milestones}
      users={pickList(options, "users")}
    />
  );
}
