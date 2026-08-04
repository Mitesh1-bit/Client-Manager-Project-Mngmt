import Link from "next/link";
import { Building2, CheckSquare2, FolderKanban, SearchX, UserRound } from "lucide-react";

import { EmptyState } from "@/app/components/domain/states";
import { StatusBadge } from "@/app/components/domain/status-badge";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { SearchDocument } from "@/app/lib/graphql/generated/documents";
import { asArray } from "@/app/lib/api/safe-list";

import { RecordSearch } from "./recent-searches";

/** @param {{ query: string }} props */
export async function SearchResults({ query }) {
  const { data } = await getClient().query({ query: SearchDocument, variables: { query } });
  const results = data?.search;

  const companies = asArray(results?.companies);
  const contacts = asArray(results?.contacts);
  const projects = asArray(results?.projects);
  const tasks = asArray(results?.tasks);

  const total =
    (results?.companiesCount ?? 0) +
    (results?.contactsCount ?? 0) +
    (results?.projectsCount ?? 0) +
    (results?.tasksCount ?? 0);

  if (total === 0) {
    return (
      <>
        <RecordSearch query={query} />
        <EmptyState
          icon={SearchX}
          title={`No matches for "${query}"`}
          description="Try a different spelling, or search by company, contact, project, or task name."
        />
      </>
    );
  }

  return (
    <>
      <RecordSearch query={query} />
      <div className="space-y-6">
        <ResultGroup
          icon={Building2}
          title="Companies"
          count={results.companiesCount}
          rows={companies.map((company) => ({
            key: company.id,
            href: `/companies/${company.id}`,
            primary: company.name,
            secondary: company.industry,
            badge: <StatusBadge kind="companyStatus" value={company.status} size="sm" />,
          }))}
        />
        <ResultGroup
          icon={UserRound}
          title="Contacts"
          count={results.contactsCount}
          rows={contacts.map((contact) => ({
            key: contact.id,
            href: `/companies/${contact.companyId}/contacts`,
            primary: `${contact.firstName} ${contact.lastName}`,
            secondary: contact.title ?? contact.email,
          }))}
        />
        <ResultGroup
          icon={FolderKanban}
          title="Projects"
          count={results.projectsCount}
          rows={projects.map((project) => ({
            key: project.id,
            href: `/projects/${project.id}/board`,
            primary: project.name,
            badge: <StatusBadge kind="projectStatus" value={project.status} size="sm" />,
          }))}
        />
        <ResultGroup
          icon={CheckSquare2}
          title="Tasks"
          count={results.tasksCount}
          rows={tasks.map((task) => ({
            key: task.id,
            href: `/projects/${task.projectId}/board`,
            primary: task.title,
            badge: <StatusBadge kind="taskStatus" value={task.status} size="sm" />,
          }))}
        />
      </div>
    </>
  );
}

function ResultGroup({ icon: Icon, title, count, rows }) {
  if (!count) return null;

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-caption font-medium text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
        {title}
        <span className="tabular">({count})</span>
      </h2>
      <ul className="divide-y rounded-xl border bg-card">
        {rows.map((row) => (
          <li key={row.key}>
            <Link
              href={row.href}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent focus-ring"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{row.primary}</p>
                {row.secondary ? (
                  <p className="truncate text-caption text-muted-foreground">{row.secondary}</p>
                ) : null}
              </div>
              {row.badge}
            </Link>
          </li>
        ))}
      </ul>
      {count > rows.length ? (
        <p className="mt-1.5 text-caption text-muted-foreground">
          Showing {rows.length} of {count} — refine your search to narrow it down.
        </p>
      ) : null}
    </section>
  );
}
