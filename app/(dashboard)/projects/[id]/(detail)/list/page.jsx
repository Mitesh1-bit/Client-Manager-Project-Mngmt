import { notFound } from "next/navigation";

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

  return (
    <TaskList
      projectId={data.project.id}
      tasks={data.project.tasks}
      phases={data.project.phases}
      milestones={data.project.milestones}
      users={options.users}
    />
  );
}
