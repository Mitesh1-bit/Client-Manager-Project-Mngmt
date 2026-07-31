"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  ConfirmUploadDocument,
  RequestUploadUrlDocument,
} from "@/app/lib/graphql/generated/documents";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * Two-step presigned upload: ask the API where to put the file, transfer it,
 * then tell the API the transfer finished.
 *
 * @param {{ companyId: string, projects: Array<{ id: string, name: string }> }} props
 */
export function DocumentUpload({ companyId, projects }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [target, setTarget] = useState("company");
  const [busy, setBusy] = useState(false);

  const [requestUploadUrl] = useMutation(RequestUploadUrlDocument);
  const [confirmUpload] = useMutation(ConfirmUploadDocument);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_BYTES) {
      toast.error("That file is too big", {
        description: "The limit is 25 MB. Send us a link instead and we'll pull it in.",
      });
      return;
    }

    setBusy(true);
    const scope = target === "company" ? { companyId } : { projectId: target };

    try {
      const { data: ticketData } = await requestUploadUrl({
        variables: {
          input: {
            fileName: file.name,
            mimeType: file.type || null,
            sizeBytes: file.size,
            ...scope,
          },
        },
      });
      const ticket = ticketData.requestUploadUrl;

      // Against the real backend this PUTs the bytes to object storage before
      // confirming. The mock issues a URL that nothing is listening on, so the
      // transfer is skipped rather than faked with a request that would 404.
      if (!ticket.uploadUrl.startsWith("/mock-uploads/")) {
        const response = await fetch(ticket.uploadUrl, { method: "PUT", body: file });
        if (!response.ok) throw new Error("The file couldn't be uploaded. Please try again.");
      }

      const { data } = await confirmUpload({
        variables: {
          input: {
            uploadId: ticket.uploadId,
            name: file.name,
            mimeType: file.type || null,
            sizeBytes: file.size,
            ...scope,
          },
        },
      });

      toast.success(`${data.confirmUpload.name} uploaded`, {
        description: "Your team at Meridian can see it now.",
      });
      router.refresh();
    } catch (error) {
      toast.error("Upload failed", {
        description: error?.message ?? "Nothing was saved. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select value={target} onValueChange={setTarget} disabled={busy}>
        <SelectTrigger className="h-10 sm:w-56" aria-label="Where to file this upload">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="company">General</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        onChange={handleFile}
        aria-hidden="true"
        tabIndex={-1}
      />

      <Button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="sm:w-auto"
      >
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
    </div>
  );
}
