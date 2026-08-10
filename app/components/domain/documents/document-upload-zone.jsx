"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";

const MAX_BYTES = 25 * 1024 * 1024;

/**
 * @param {{
 *   entityId: string;
 *   entityType?: string;
 *   requestUploadMutation: import("@apollo/client").DocumentNode;
 *   confirmUploadMutation: import("@apollo/client").DocumentNode;
 *   projectOptions?: { id: string; name: string }[];
 *   label?: string;
 *   includeEntityType?: boolean;
 * }} props
 */
export function DocumentUploadZone({
  entityId,
  entityType = "project",
  requestUploadMutation,
  confirmUploadMutation,
  projectOptions,
  label = "Upload files",
  includeEntityType = false,
}) {
  const router = useRouter();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(entityId);
  const [dragOver, setDragOver] = useState(false);

  const [requestUploadUrl] = useMutation(requestUploadMutation);
  const [confirmUpload] = useMutation(confirmUploadMutation);

  async function uploadFile(file) {
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} is too big`, { description: "The limit is 25 MB per file." });
      return;
    }

    const targetEntityId = projectOptions?.length ? selectedProjectId : entityId;

    const { data: ticketData } = await requestUploadUrl({
      variables: {
        ...(includeEntityType ? { entityType } : {}),
        entityId: targetEntityId,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
      },
    });
    const ticket = ticketData.requestUploadUrl;

    const response = await fetch("/api/backend/assets/upload", {
      method: "PUT",
      headers: { Authorization: `Bearer ${ticket.uploadToken}` },
      body: file,
    });
    if (!response.ok) throw new Error(`${file.name} couldn't be uploaded.`);

    await confirmUpload({
      variables: {
        ...(includeEntityType ? { entityType } : {}),
        entityId: targetEntityId,
        fileUrl: ticket.fileUrl,
      },
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setBusy(true);
    try {
      for (const file of files) {
        await uploadFile(file);
      }
      toast.success(files.length === 1 ? `${files[0].name} uploaded` : `${files.length} files uploaded`);
      router.refresh();
    } catch (error) {
      toast.error("Upload failed", { description: error?.message ?? "Nothing was saved." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {projectOptions?.length ? (
        <label className="block text-sm">
          <span className="mb-1 block text-caption text-muted-foreground">Attach to project</span>
          <select
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="h-9 w-full max-w-sm rounded-xl border bg-background px-3 text-sm"
          >
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Drag-and-drop is a supplementary input method — the "Browse files"
          button below is the fully keyboard-accessible way in, so this
          wrapper stays a plain, non-interactive div rather than claiming a
          landmark role and tab stop it doesn't actually support. */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions --
          drag handlers only enhance a drop target that's already reachable
          and operable via the "Browse files" button below. */}
      <div
        className={`rounded-2xl border border-dashed p-4 transition-colors ${dragOver ? "border-accent bg-accent/5" : "bg-muted/20"}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer.files);
        }}
      >
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{label}</p>
            <p className="text-caption text-muted-foreground">Drag and drop files here, or browse. Max 25 MB each.</p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? (
              <>
                <LoaderCircle aria-hidden="true" className="animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload aria-hidden="true" />
                Browse files
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
