"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { EmptyState } from "@/app/components/domain/states";
import { DeleteDocumentDocument } from "@/app/lib/graphql/generated/documents";

const MANAGER_ROLES = ["admin", "project_manager"];

export function DocumentList({ documents, viewerId, viewerRole }) {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDocument, { loading: deleting }] = useMutation(DeleteDocumentDocument);

  function canDelete(document) {
    return document.uploadedBy === viewerId || MANAGER_ROLES.includes(viewerRole);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDocument({ variables: { id: deleteTarget.id } });
      toast.success("Document deleted");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't delete this document", { description: error?.message });
    }
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents yet"
        description="Upload a file, or the client can upload one from their portal — either way it shows up here."
      />
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition-shadow hover:shadow-card"
          >
            <a
              href={`/api/backend/assets/download?path=${encodeURIComponent(document.fileUrl)}`}
              className="flex min-w-0 flex-1 items-center gap-3 focus-ring"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FileText aria-hidden="true" className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {document.fileUrl.split("/").pop()}
                </span>
                <span className="block truncate text-caption text-muted-foreground">
                  v{document.version}
                </span>
              </span>
            </a>
            {canDelete(document) ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(document)}
                aria-label="Delete document"
              >
                <Trash2 aria-hidden="true" />
              </Button>
            ) : null}
          </li>
        ))}
      </ul>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? deleteTarget.fileUrl.split("/").pop() : ""} will be removed. This
              can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
