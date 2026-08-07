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

  const companyById = new Map((data?.companies ?? []).map((company) => [company.id, company]));
  const usersById = new Map((data?.users ?? []).map((user) => [user.id, user]));
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
          project: { id: project.id, name: project.name, currency: project.currency },
          company: companyById.get(project.companyId) ?? { id: project.companyId },
          assignedPm: cr.assignedPmId ? (usersById.get(cr.assignedPmId) ?? null) : null,
        }),
      );
    }
  }

  return { dashboard, rows, projects };
}
