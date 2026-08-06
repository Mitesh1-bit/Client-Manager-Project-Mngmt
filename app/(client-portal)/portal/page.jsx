import Link from "next/link";
import { FolderKanban, GitPullRequestArrow, Plus, ShieldCheck } from "lucide-react";

import { ErrorState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  buildApprovalQueue,
  countAwaitingViewer,
} from "@/app/lib/approvals";
import {
  normalizePortalChangeRequests,
  normalizePortalProjects,
  portalContactName,
} from "@/app/lib/api/portal";
import { formatRelativeDays, humanizeType } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalApprovalsInboxDocument } from "@/app/lib/graphql/generated/documents";
import { requireViewer } from "@/app/lib/graphql/viewer";

import {
  PortalActionBanner,
  PortalCard,
  PortalEmptyPanel,
  PortalLinkRow,
  PortalSectionHeader,
  PortalStatTile,
  PortalWelcomeHero,
} from "./portal-ui";

export const metadata = { title: "Overview" };

export default async function PortalOverviewPage() {
  const viewer = await requireViewer("PORTAL");
  const companyName = viewer.company?.name ?? "your company";
  const firstName = viewer.name.split(" ")[0];

  let projects = [];
  let requests = [];
  let viewerName = null;
  let loadError = null;

  try {
    const { data } = await getClient().query({ query: PortalApprovalsInboxDocument });
    projects = normalizePortalProjects(data.portalProjects);
    requests = normalizePortalChangeRequests(data.portalChangeRequests ?? []);
    viewerName = portalContactName(data.me?.contact);
  } catch (error) {
    loadError = error;
    console.error("[portal overview] failed", error);
  }

  const approvalQueue = buildApprovalQueue(projects, viewerName);
  const awaitingCount = countAwaitingViewer(approvalQueue);
  const awaitingItems = approvalQueue.filter((item) => item.approvalState.actionable);
  const openRequests = requests.filter((r) =>
    ["SUBMITTED", "UNDER_REVIEW", "PENDING_IMPACT_ASSESSMENT", "PENDING_APPROVAL", "ON_HOLD"].includes(
      r.status,
    ),
  );

  if (loadError) {
    return (
      <ErrorState
        title="We couldn't load your portal"
        description={loadError?.message ?? "Try refreshing the page."}
      />
    );
  }

  if (projects.length === 0) {
    return (
      <div data-tour="portal-overview" className="space-y-6">
        <PortalWelcomeHero
          firstName={firstName}
          companyName={companyName}
          awaitingCount={0}
        />
        <PortalEmptyPanel>
          <FolderKanban aria-hidden="true" className="mx-auto size-10 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold text-[#0a1550]">No projects yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            When your agency starts delivery, projects will appear here with progress, milestones,
            and files.
          </p>
        </PortalEmptyPanel>
      </div>
    );
  }

  return (
    <div data-tour="portal-overview" className="space-y-6">
      <PortalWelcomeHero
        firstName={firstName}
        companyName={companyName}
        awaitingCount={awaitingCount}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <PortalStatTile
          label="Active projects"
          value={projects.length}
          hint="Open any project for full detail"
          href="/portal/projects"
          icon={FolderKanban}
        />
        <PortalStatTile
          label="Needs your approval"
          value={awaitingCount}
          hint={awaitingCount > 0 ? "Review milestones to unblock work" : "All caught up"}
          href="/portal/approvals"
          icon={ShieldCheck}
          accent={awaitingCount > 0 ? "caution" : "positive"}
        />
        <PortalStatTile
          label="Open requests"
          value={openRequests.length}
          hint="Changes outside the original plan"
          href="/portal/change-requests"
          icon={GitPullRequestArrow}
        />
      </div>

      {awaitingCount > 0 ? (
        <PortalActionBanner
          icon={ShieldCheck}
          title={
            awaitingCount === 1
              ? "1 milestone needs your decision"
              : `${awaitingCount} milestones need your decision`
          }
          description="Work is paused until you review and approve — or request changes if something isn't right."
          action={
            <Button size="lg" className="bg-[#0a1550] hover:bg-[#1e3a8a]" asChild>
              <Link href="/portal/approvals">Review & approve</Link>
            </Button>
          }
        >
          <ul className="mt-4 space-y-2">
            {awaitingItems.slice(0, 3).map((item) => (
              <li key={item.key} className="text-sm text-[oklch(0.42_0.06_55)]">
                <span className="font-semibold text-[oklch(0.35_0.08_55)]">{item.milestone.title}</span>
                <span className="opacity-80"> · {item.project.name}</span>
              </li>
            ))}
          </ul>
        </PortalActionBanner>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <PortalCard>
          <PortalSectionHeader
            id="your-projects"
            title="Your projects"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/projects">View all</Link>
              </Button>
            }
          />
          <ul className="space-y-2">
            {projects.slice(0, 4).map((project) => (
              <li key={project.id}>
                <Link
                  href={`/portal/projects/${project.id}`}
                  className="portal-link-row group"
                >
                  <span className="portal-link-row__icon">
                    <FolderKanban className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{project.name}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {project.completionPercent}% complete
                    </span>
                  </span>
                  <StatusBadge kind="projectHealth" value={project.health} size="sm" />
                </Link>
              </li>
            ))}
          </ul>
        </PortalCard>

        <PortalCard>
          <PortalSectionHeader
            id="recent-requests"
            title="Change requests"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link href="/portal/change-requests">View all</Link>
              </Button>
            }
          />
          {openRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[oklch(0.91_0.012_255)] bg-[oklch(0.99_0.002_260)] px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No open change requests.</p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/portal/change-requests/new">
                  <Plus aria-hidden="true" />
                  Request a change
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {openRequests.slice(0, 4).map((request) => (
                <li key={request.id}>
                  <PortalLinkRow
                    href={`/portal/change-requests/${request.id}`}
                    title={request.title}
                    meta={`${humanizeType(request.type)} · updated ${formatRelativeDays(request.updatedAt)}`}
                    icon={GitPullRequestArrow}
                  />
                </li>
              ))}
            </ul>
          )}
        </PortalCard>
      </div>
    </div>
  );
}
