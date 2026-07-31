import { Download, FileText } from "lucide-react";

import { PageHeader } from "@/app/components/domain/page-header";
import { EmptyState } from "@/app/components/domain/states";
import { formatBytes, formatDate } from "@/app/lib/format";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { PortalDocumentsDocument } from "@/app/lib/graphql/generated/documents";

import { DocumentUpload } from "./document-upload";

export const metadata = { title: "Documents" };

export default async function PortalDocumentsPage() {
  const { data } = await getClient().query({ query: PortalDocumentsDocument });

  const company = data.me?.company;
  const projects = data.projects.nodes;

  const groups = [
    { key: "company", title: "Contracts and general", documents: company?.documents ?? [] },
    ...projects.map((project) => ({
      key: project.id,
      title: project.name,
      documents: [
        ...project.documents,
        // Milestone deliverables belong to the project as far as a client is
        // concerned — they don't think in milestones when hunting for a file.
        ...project.milestones.flatMap((milestone) =>
          milestone.documents.map((document) => ({ ...document, context: milestone.title })),
        ),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    })),
  ].filter((group) => group.documents.length > 0);

  const total = groups.reduce((count, group) => count + group.documents.length, 0);

  return (
    <>
      <PageHeader
        title="Documents"
        description="Deliverables, contracts and anything else we've shared with you."
        actions={
          company ? <DocumentUpload companyId={company.id} projects={projects} /> : null
        }
      />

      {total === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nothing here yet"
          description="Contracts and deliverables will appear here as we share them. You can upload files for us too."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`group-${group.key}`}>
              <h2 id={`group-${group.key}`} className="text-subheading">
                {group.title}
              </h2>
              <ul className="mt-3 space-y-2">
                {group.documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={document.fileUrl}
                      download
                      className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-shadow hover:shadow-card focus-ring"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <FileText aria-hidden="true" className="size-4.5" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{document.name}</span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {document.context ? `${document.context} · ` : ""}v{document.version} ·{" "}
                          {formatBytes(document.sizeBytes)} · {formatDate(document.createdAt)}
                          {document.uploadedByName ? ` · ${document.uploadedByName}` : ""}
                        </span>
                      </span>

                      <Download
                        aria-hidden="true"
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      <span className="sr-only">Download {document.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
