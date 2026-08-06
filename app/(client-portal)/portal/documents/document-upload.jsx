"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import {
  SearchableSelect,
  shouldUseSearchableSelect,
} from "@/app/components/domain/searchable-select";
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
 * then tell the API the transfer finished. Documents attach to a project —
 * the API has no company-level entity type for them, so a project must be
 * picked (there's no "General" bucket to fall back to).
 *
 * @param {{ projects: Array<{ id: string, name: string }> }} props
 */
export function DocumentUpload({ projects }) {
  const router = useRouter();
  const inputRef = useRef(null);

  const [target, setTarget] = useState(projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  const [requestUploadUrl] = useMutation(RequestUploadUrlDocument);
  const [confirmUpload] = useMutation(ConfirmUploadDocument);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires a change.
    event.target.value = "";
    if (!file) return;

    if (!target) {
      toast.error("Choose a project first");
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("That file is too big", {
        description: "The limit is 25 MB. Send us a link instead and we'll pull it in.",
      });
      return;
    }

    setBusy(true);
    const entityType = "project";
    const entityId = target;

    try {
      const { data: ticketData } = await requestUploadUrl({
        variables: {
          entityType,
          entityId,
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

      await confirmUpload({
        variables: { entityType, entityId, fileUrl: ticket.fileUrl },
      });

      toast.success(`${file.name} uploaded`, {
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

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {shouldUseSearchableSelect(projectOptions) ? (
        <SearchableSelect
          options={projectOptions}
          value={target}
          onChange={setTarget}
          placeholder="Choose a project"
          emptyText="No project matches."
          disabled={busy || projects.length === 0}
          className="sm:w-56"
        />
      ) : (
        <Select value={target} onValueChange={setTarget} disabled={busy || projects.length === 0}>
          <SelectTrigger className="h-10 sm:w-56" aria-label="Which project this belongs to">
            <SelectValue placeholder="Choose a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
