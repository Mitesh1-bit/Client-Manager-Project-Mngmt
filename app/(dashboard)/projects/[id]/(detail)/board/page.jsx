import { notFound } from "next/navigation";

import { pickList } from "@/app/lib/api/safe-list";
import { normalizeProjectPlan, usersByIdFromData } from "@/app/lib/api/project-plan";
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

  const [{ data }, { data: planData }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectBoardDocument, variables: { id } }),
    getClient().query({ query: ProjectPlanDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project || !planData.project) notFound();

  const usersById = usersByIdFromData(options);
  const plan = normalizeProjectPlan(planData.project, usersById);

  const statusById = new Map(
    (data.project.tasks ?? []).map((task) => [task.id, String(task.status).toUpperCase()]),
  );
  const tasks = plan.tasks.map((task) =>
    statusById.has(task.id) ? { ...task, status: statusById.get(task.id) } : task,
  );

  return (
    <ProjectBoard
      projectId={data.project.id}
      tasks={tasks}
      phases={plan.phases}
      milestones={plan.milestones}
      users={pickList(options, "users")}
    />
  );
}
