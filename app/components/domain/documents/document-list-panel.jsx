"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { FileText, Grid3X3, List, Search } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { DeleteDocumentDocument } from "@/app/lib/graphql/generated/documents";
import { useClientPreference } from "@/app/lib/hooks/use-client-preference";
import { CATEGORIES, categoryLabel, getDocumentCategory } from "@/app/lib/documents/category";
import { normalizeDocumentRecords } from "@/app/lib/documents/normalize";
import { DocumentCard } from "./document-card";
import { DocumentDeleteDialog } from "./document-delete-dialog";
import { DocumentRow } from "./document-row";

const DocumentViewerModal = dynamic(
  () => import("./document-viewer-modal").then((module) => module.DocumentViewerModal),
  { ssr: false },
);

const VIEW_KEY = "documents-view-mode";

/**
 * @param {{
 *   documents: object[];
 *   viewerId?: string;
 *   viewerRole?: string;
 *   managerRoles?: string[];
 *   emptyTitle?: string;
 *   emptyDescription?: string;
 *   compact?: boolean;
 *   hideToolbar?: boolean;
 *   maxItems?: number;
 *   viewAllHref?: string;
 *   viewAllLabel?: string;
 * }} props
 */
export function DocumentListPanel({
  documents,
  viewerId,
  viewerRole,
  managerRoles = ["admin", "project_manager"],
  emptyTitle = "No documents yet",
  emptyDescription = "Upload a file to get started.",
  compact = false,
  hideToolbar = false,
  maxItems,
  viewAllHref,
  viewAllLabel = "View all files",
}) {
  const router = useRouter();
  const normalized = useMemo(() => normalizeDocumentRecords(documents), [documents]);
  const [storedViewMode, setViewMode] = useClientPreference(() => localStorage.getItem(VIEW_KEY) || "list", "list");
  const viewMode = compact ? "list" : storedViewMode;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [activeDocument, setActiveDocument] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDocument, { loading: deleting }] = useMutation(DeleteDocumentDocument);

  function canDelete(document) {
    return document.uploadedBy === viewerId || managerRoles.includes(viewerRole);
  }

  const filtered = useMemo(() => {
    let rows = [...normalized];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((doc) => doc.filename?.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      rows = rows.filter((doc) => getDocumentCategory(doc) === categoryFilter);
    }
    rows.sort((a, b) => {
      if (sort === "name") return (a.filename || "").localeCompare(b.filename || "");
      if (sort === "size") return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    if (maxItems) rows = rows.slice(0, maxItems);
    return rows;
  }, [normalized, query, categoryFilter, sort, maxItems]);

  // Same filter/sort as `filtered`, minus the `maxItems` cap — the viewer
  // modal navigates prev/next through every match, not just the capped
  // preview list a compact panel shows.
  const navigationDocuments = useMemo(() => {
    let rows = [...normalized];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      rows = rows.filter((doc) => doc.filename?.toLowerCase().includes(q));
    }
    if (categoryFilter !== "all") {
      rows = rows.filter((doc) => getDocumentCategory(doc) === categoryFilter);
    }
    rows.sort((a, b) => {
      if (sort === "name") return (a.filename || "").localeCompare(b.filename || "");
      if (sort === "size") return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return rows;
  }, [normalized, query, categoryFilter, sort]);

  function openViewer(document) {
    setActiveDocument(document);
    setViewerOpen(true);
  }

  function changeViewMode(mode) {
    setViewMode(mode);
    if (!compact) localStorage.setItem(VIEW_KEY, mode);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument({ variables: { id: deleteTarget.id } });
      toast.success("Document deleted");
      setDeleteTarget(null);
      if (activeDocument?.id === deleteTarget.id) setViewerOpen(false);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't delete this document", { description: error?.message });
    }
  }

  if (normalized.length === 0) {
    return <EmptyState icon={FileText} title={emptyTitle} description={emptyDescription} />;
  }

  const showGrid = !compact && viewMode === "grid";

  return (
    <>
      <div className="space-y-4">
        {!hideToolbar ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search documents…"
                className="pl-9"
                aria-label="Search documents"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-9 rounded-xl border bg-background px-3 text-sm"
                aria-label="Filter by type"
              >
                <option value="all">All types</option>
                {Object.values(CATEGORIES).map((value) => (
                  <option key={value} value={value}>
                    {categoryLabel(value)}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-9 rounded-xl border bg-background px-3 text-sm"
                aria-label="Sort documents"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              {!compact ? (
                <div className="inline-flex rounded-xl border p-1">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    onClick={() => changeViewMode("list")}
                    aria-label="List view"
                  >
                    <List aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    onClick={() => changeViewMode("grid")}
                    aria-label="Grid view"
                  >
                    <Grid3X3 aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No matches" description="Try a different search or filter." />
        ) : showGrid ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((document) => (
              <DocumentCard key={document.id} document={document} onView={openViewer} />
            ))}
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                onView={openViewer}
                onDelete={setDeleteTarget}
                canDelete={canDelete(document)}
              />
            ))}
          </ul>
        )}

        {viewAllHref && maxItems && normalized.length > maxItems ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={viewAllHref}>{viewAllLabel}</Link>
          </Button>
        ) : null}
      </div>

      {viewerOpen ? (
        <DocumentViewerModal
          documents={navigationDocuments}
          activeDocument={activeDocument}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          onNavigate={setActiveDocument}
          onDelete={setDeleteTarget}
          canDelete={canDelete}
        />
      ) : null}

      <DocumentDeleteDialog
        document={deleteTarget}
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </>
  );
}
