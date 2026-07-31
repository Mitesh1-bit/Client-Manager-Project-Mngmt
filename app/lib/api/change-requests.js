import { getClient } from "@/app/lib/graphql/apollo-client";
import {
  ChangeRequestsByProjectDocument,
  ChangeRequestQueueDocument,
} from "@/app/lib/graphql/generated/documents";
import { normalizeChangeRequest } from "@/app/lib/api/normalize";

/** Loads change requests across all projects for queue views. */
export async function fetchChangeRequestQueue(client = getClient()) {
  const { data } = await client.query({ query: ChangeRequestQueueDocument });
  const projects = data?.projects ?? [];
  const dashboard = data?.changeRequestDashboard ?? {
    openCount: 0,
    pendingApprovalCount: 0,
    overdueCount: 0,
    slaDays: 0,
  };

  const projectById = new Map(projects.map((project) => [project.id, project]));
  const rows = [];

  for (const project of projects) {
    const { data: crData } = await client.query({
      query: ChangeRequestsByProjectDocument,
      variables: { projectId: project.id },
    });
    for (const cr of crData?.changeRequests ?? []) {
      rows.push(
        normalizeChangeRequest({
          ...cr,
          project: { id: project.id, name: project.name },
          company: projectById.get(project.companyId) ?? { id: project.companyId },
        }),
      );
    }
  }

  return { dashboard, rows, projects };
}
