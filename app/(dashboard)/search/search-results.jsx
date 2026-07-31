import Link from "next/link";
import { Building2, FolderKanban, ListChecks, SearchX, UserRound } from "lucide-react";

import { EmptyState, SectionCard } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";

function ResultRow({ href, icon: Icon, title, meta, badge }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent focus-ring"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-caption font-medium text-foreground">{title}</span>
        {meta ? <span className="block truncate text-[0.8125rem] text-muted-foreground">{meta}</span> : null}
      </span>
      {badge}
    </Link>
  );
}

/** One entity group. `viewAllHref` is only passed for entities with a real filterable list route. */
function ResultGroup({ title, count, shown, viewAllHref, children }) {
  const hasMore = count > shown;

  return (
    <SectionCard
      title={title}
      actions={
        hasMore ? (
          viewAllHref ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href={viewAllHref}>View all {count}</Link>
            </Button>
          ) : (
            <span className="text-caption text-muted-foreground">
              {shown} of {count}
            </span>
          )
        ) : null
      }
    >
      <div className="-mx-2 space-y-0.5">{children}</div>
    </SectionCard>
  );
}

export function SearchResults({ query, results }) {
  const { companies, companiesCount, contacts, contactsCount, projects, projectsCount, tasks, tasksCount } =
    results;
  const totalCount = companiesCount + contactsCount + projectsCount + tasksCount;

  if (totalCount === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No results for "${query}"`}
        description="Try a different name, or check the spelling."
      />
    );
  }

  return (
    <div className="space-y-4">
      {companies.length ? (
        <ResultGroup
          title="Companies"
          count={companiesCount}
          shown={companies.length}
          viewAllHref={`/companies?q=${encodeURIComponent(query)}`}
        >
          {companies.map((company) => (
            <ResultRow
              key={company.id}
              href={`/companies/${company.id}`}
              icon={Building2}
              title={company.name}
              meta={company.industry}
              badge={<StatusBadge kind="companyStatus" value={company.status} size="sm" />}
            />
          ))}
        </ResultGroup>
      ) : null}

      {projects.length ? (
        <ResultGroup
          title="Projects"
          count={projectsCount}
          shown={projects.length}
          viewAllHref={`/projects?q=${encodeURIComponent(query)}`}
        >
          {projects.map((project) => (
            <ResultRow
              key={project.id}
              href={`/projects/${project.id}`}
              icon={FolderKanban}
              title={project.name}
              meta={project.company?.name}
              badge={<StatusBadge kind="projectHealth" value={project.health} size="sm" />}
            />
          ))}
        </ResultGroup>
      ) : null}

      {contacts.length ? (
        <ResultGroup title="Contacts" count={contactsCount} shown={contacts.length} viewAllHref={null}>
          {contacts.map((contact) => (
            <ResultRow
              key={contact.id}
              href={`/companies/${contact.company.id}/contacts`}
              icon={UserRound}
              title={contact.fullName}
              meta={[contact.title, contact.company?.name].filter(Boolean).join(" · ")}
            />
          ))}
        </ResultGroup>
      ) : null}

      {tasks.length ? (
        <ResultGroup title="Tasks" count={tasksCount} shown={tasks.length} viewAllHref={null}>
          {tasks.map((task) => (
            <ResultRow
              key={task.id}
              href={`/projects/${task.project.id}/list`}
              icon={ListChecks}
              title={task.title}
              meta={task.project?.name}
              badge={<StatusBadge kind="taskStatus" value={task.status} size="sm" />}
            />
          ))}
        </ResultGroup>
      ) : null}
    </div>
  );
}
