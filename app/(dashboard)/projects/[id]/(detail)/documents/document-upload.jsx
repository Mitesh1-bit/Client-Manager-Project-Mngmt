"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import {
  ConfirmProjectUploadDocument,
  RequestProjectUploadUrlDocument,
} from "@/app/lib/graphql/generated/documents";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Two-step presigned upload: ask the API where to put the file, transfer it
 * straight to the backend's own /assets/upload endpoint, then confirm.
 * Mirrors the client portal's uploader — see NEEDED_SCHEMA_CHANGES.md §7.4;
 * documents only attach to projects, there's no company-level entity type.
 *
 * @param {{ projectId: string }} props
 */
export function DocumentUpload({ projectId }) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const [requestUploadUrl] = useMutation(RequestProjectUploadUrlDocument);
  const [confirmUpload] = useMutation(ConfirmProjectUploadDocument);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("That file is too big", { description: "The limit is 25 MB." });
      return;
    }

    setBusy(true);
    try {
      const { data: ticketData } = await requestUploadUrl({
        variables: {
          entityId: projectId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
        },
      });
      const ticket = ticketData.requestUploadUrl;

      // Same-origin proxy, not ticket.uploadUrl directly — that's an absolute
      // backend URL that only resolves correctly from the machine the
      // backend itself runs on. See app/api/backend/assets/upload/route.js.
      const response = await fetch("/api/backend/assets/upload", {
        method: "PUT",
        headers: { Authorization: `Bearer ${ticket.uploadToken}` },
        body: file,
      });
      if (!response.ok) throw new Error("The file couldn't be uploaded. Please try again.");

      await confirmUpload({ variables: { entityId: projectId, fileUrl: ticket.fileUrl } });

      toast.success(`${file.name} uploaded`);
      router.refresh();
    } catch (error) {
      toast.error("Upload failed", { description: error?.message ?? "Nothing was saved. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={handleFile}
        aria-hidden="true"
        tabIndex={-1}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload aria-hidden="true" />
            Upload a file
          </>
        )}
      </Button>
    </>
  );
}
