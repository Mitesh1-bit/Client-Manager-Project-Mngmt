"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLazyQuery } from "@apollo/client/react";
import { Building2, CheckSquare2, FolderKanban, Search, SearchX, UserRound } from "lucide-react";

import { StatusBadge } from "@/app/components/domain/status-badge";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { asArray } from "@/app/lib/api/safe-list";
import { SearchDocument } from "@/app/lib/graphql/generated/documents";

import { loadRecent, useRecordRecentSearch } from "./recent-searches";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 300;

/**
 * The topbar's search button opens this in place, rather than navigating to
 * `/search` — most searches are "jump to this one thing," which doesn't need
 * a page load. The full `/search` page still exists for browsing everything
 * at once; "View all results" at the bottom of a query drops into it.
 */
export function QuickSearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [runSearch, { data, loading }] = useLazyQuery(SearchDocument);

  useEffect(() => {
    // localStorage isn't available during SSR, so this has to run post-mount
    // — same reasoning as `RecentSearches` on the full search page.
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(loadRecent());
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length >= MIN_QUERY_LENGTH) {
      runSearch({ variables: { query: debouncedQuery } });
    }
  }, [debouncedQuery, runSearch]);

  useRecordRecentSearch(data?.search ? debouncedQuery : "");

  // Global Ctrl/Cmd+K, same shortcut every command palette uses.
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function reset() {
    setQuery("");
    setDebouncedQuery("");
  }

  function go(href) {
    setOpen(false);
    reset();
    router.push(href);
  }

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
  const shown = companies.length + contacts.length + projects.length + tasks.length;

  const searching = query.trim().length >= MIN_QUERY_LENGTH;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground"
        data-tour="topbar-search"
        onClick={() => setOpen(true)}
      >
        <Search aria-hidden="true" />
        <span className="hidden sm:inline">Search</span>
        {/* Static across server/client render on purpose — branching on
            navigator.platform here would mismatch during hydration. */}
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[0.6875rem] text-muted-foreground sm:inline">
          Ctrl/⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) reset();
        }}
        title="Search"
        description="Search clients, contacts, projects and tasks."
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search clients, contacts, projects, tasks…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {!searching ? (
              recent.length > 0 ? (
                <CommandGroup heading="Recent searches">
                  {recent.map((term) => (
                    <CommandItem key={term} value={`recent-${term}`} onSelect={() => setQuery(term)}>
                      <Search aria-hidden="true" className="size-4 text-muted-foreground" />
                      {term}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>Find a client, contact, project, or task by name.</CommandEmpty>
              )
            ) : loading && !data ? (
              <div className="py-6 text-center text-caption text-muted-foreground">Searching…</div>
            ) : total === 0 ? (
              <CommandEmpty>
                <div className="flex flex-col items-center gap-2 py-2">
                  <SearchX aria-hidden="true" className="size-5 text-muted-foreground" />
                  No matches for &quot;{debouncedQuery}&quot;
                </div>
              </CommandEmpty>
            ) : (
              <>
                <ResultGroup icon={Building2} heading="Clients">
                  {companies.map((company) => (
                    <CommandItem
                      key={company.id}
                      value={`company-${company.id}`}
                      onSelect={() => go(`/companies/${company.id}`)}
                    >
                      <Building2 aria-hidden="true" className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{company.name}</span>
                      <StatusBadge kind="companyStatus" value={company.status} size="sm" />
                    </CommandItem>
                  ))}
                </ResultGroup>

                <ResultGroup icon={UserRound} heading="Contacts">
                  {contacts.map((contact) => (
                    <CommandItem
                      key={contact.id}
                      value={`contact-${contact.id}`}
                      onSelect={() => go(`/companies/${contact.companyId}/contacts`)}
                    >
                      <UserRound aria-hidden="true" className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.title ? (
                        <span className="shrink-0 truncate text-caption text-muted-foreground">
                          {contact.title}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </ResultGroup>

                <ResultGroup icon={FolderKanban} heading="Projects">
                  {projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      value={`project-${project.id}`}
                      onSelect={() => go(`/projects/${project.id}/board`)}
                    >
                      <FolderKanban aria-hidden="true" className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                      <StatusBadge kind="projectStatus" value={project.status} size="sm" />
                    </CommandItem>
                  ))}
                </ResultGroup>

                <ResultGroup icon={CheckSquare2} heading="Tasks">
                  {tasks.map((task) => (
                    <CommandItem
                      key={task.id}
                      value={`task-${task.id}`}
                      onSelect={() => go(`/projects/${task.projectId}/board`)}
                    >
                      <CheckSquare2 aria-hidden="true" className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{task.title}</span>
                      <StatusBadge kind="taskStatus" value={task.status} size="sm" />
                    </CommandItem>
                  ))}
                </ResultGroup>

                {total > shown ? (
                  <CommandGroup>
                    <CommandItem
                      value="view-all"
                      onSelect={() => go(`/search?q=${encodeURIComponent(debouncedQuery)}`)}
                      className="justify-center text-caption font-medium text-primary"
                    >
                      View all {total} results for &quot;{debouncedQuery}&quot;
                    </CommandItem>
                  </CommandGroup>
                ) : null}
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

function ResultGroup({ icon: Icon, heading, children }) {
  if (children.length === 0) return null;
  return (
    <CommandGroup
      heading={
        <span className="flex items-center gap-1.5">
          <Icon aria-hidden="true" className="size-3.5" />
          {heading}
        </span>
      }
    >
      {children}
    </CommandGroup>
  );
}
