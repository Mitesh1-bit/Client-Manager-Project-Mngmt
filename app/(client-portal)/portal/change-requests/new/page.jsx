import Link from "next/link";

import { Button } from "@/app/components/ui/button";
import { normalizePortalProjects } from "@/app/lib/api/portal";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalProjectsDocument } from "@/app/lib/graphql/generated/documents";

import { PortalBackLink, PortalEmptyPanel, PortalPageHeader } from "../../portal-ui";
import { ChangeRequestForm } from "../change-request-form";

export const metadata = { title: "New request" };

export default async function NewChangeRequestPage({ searchParams }) {
  const { projectId } = await searchParams;
  const { data } = await getClient().query({ query: PortalProjectsDocument });
  const projects = normalizePortalProjects(data.portalProjects);

  if (projects.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <PortalBackLink href="/portal/change-requests">Your change requests</PortalBackLink>
        <PortalPageHeader
          eyebrow="New request"
          title="Request a change"
          description="Ask for something outside the agreed scope."
        />
        <PortalEmptyPanel>
          <h2 className="text-lg font-semibold text-[#0a1550]">No projects to attach this to</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Change requests are linked to a project. Once your agency creates a project for you, you
            can submit requests here.
          </p>
          <Button variant="outline" className="mt-5" asChild>
            <Link href="/portal/projects">View projects</Link>
          </Button>
        </PortalEmptyPanel>
      </div>
    );
  }

  const defaultProjectId =
    projectId && projects.some((p) => p.id === projectId)
      ? projectId
      : projects.length === 1
        ? projects[0].id
        : "";

  return (
    <div className="mx-auto w-full max-w-2xl">
      <PortalBackLink href="/portal/change-requests">Your change requests</PortalBackLink>

      <PortalPageHeader
        eyebrow="New request"
        title="Request a change"
        description="Describe what you need outside the agreed plan. We'll review the impact on timeline and budget before anything is scheduled."
      />

      <ChangeRequestForm projects={projects} defaultProjectId={defaultProjectId} />
    </div>
  );
}
