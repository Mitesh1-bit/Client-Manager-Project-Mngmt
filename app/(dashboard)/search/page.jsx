import { PhasePlaceholder } from "@/app/components/domain/phase-placeholder";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <PhasePlaceholder
      eyebrow="Workspace"
      title="Search"
      description="One search across companies, contacts, projects and tasks."
      phase="a later phase"
      scope={["results grouped by entity type", "recent and saved searches"]}
    />
  );
}
