import { notFound } from "next/navigation";

import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ProjectFormOptionsDocument,
  ProjectPlanDocument,
} from "@/app/lib/graphql/generated/documents";

import { ProjectCalendar } from "./project-calendar";

export const metadata = { title: "Calendar" };

export default async function ProjectCalendarPage({ params }) {
  const { id } = await params;

  const [{ data }, { data: options }] = await Promise.all([
    getClient().query({ query: ProjectPlanDocument, variables: { id } }),
    getClient().query({ query: ProjectFormOptionsDocument }),
  ]);

  if (!data.project) notFound();

  return (
    <ProjectCalendar
      projectId={data.project.id}
      project={data.project}
      tasks={data.project.tasks}
      phases={data.project.phases}
      milestones={data.project.milestones}
      users={options.users}
    />
  );
}
