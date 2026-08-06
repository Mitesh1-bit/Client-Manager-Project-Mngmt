"use client";

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
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { portalDocumentHref, portalEntityLabel } from "@/app/lib/api/portal-ui";
import { DeleteDocumentDocument } from "@/app/lib/graphql/generated/documents";

export function PortalDocumentRow({ document, viewerId }) {
  const router = useRouter();
  const [deleteDocument, { loading }] = useMutation(DeleteDocumentDocument);
  const canDelete = document.uploadedBy === viewerId;

  async function handleDelete() {
    try {
      await deleteDocument({ variables: { id: document.id } });
      toast.success("Document deleted");
      router.refresh();
    } catch (error) {
      toast.error("Couldn't delete this document", { description: error?.message });
    }
  }

  return (
    <li className="flex items-center gap-2">
      <a href={portalDocumentHref(document.fileUrl)} className="portal-link-row group focus-ring flex-1">
        <span className="portal-link-row__icon">
          <FileText className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium group-hover:text-[#1e3a8a]">
            {document.displayName}
          </span>
          <span className="block truncate text-sm text-muted-foreground">
            {portalEntityLabel(document.entityType)} · v{document.version}
          </span>
        </span>
      </a>
      {canDelete ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Delete document">
              <Trash2 aria-hidden="true" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this document?</AlertDialogTitle>
              <AlertDialogDescription>
                {document.displayName} will be removed. This can&apos;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={loading}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </li>
  );
}
