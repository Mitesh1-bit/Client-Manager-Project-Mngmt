"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { EyeOff, LoaderCircle, MessageSquare, Send } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { formatDateTime, formatRelativeDays, initials } from "@/app/lib/format";
import { AddCommentDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

/**
 * The clarification thread. Internal users can post a note the client never
 * sees; the portal has no such control, and the API filters internal notes out
 * of a portal response entirely rather than relying on the UI to hide them.
 *
 * @param {{
 *   entityType: 'CHANGE_REQUEST' | 'PROJECT' | 'MILESTONE' | 'TASK',
 *   entityId: string,
 *   comments: Array<object>,
 *   audience?: 'INTERNAL' | 'CLIENT',
 *   canPost?: boolean,
 *   emptyText?: string,
 * }} props
 */
export function CommentThread({
  entityType,
  entityId,
  comments,
  audience = "INTERNAL",
  canPost = true,
  emptyText,
}) {
  const router = useRouter();
  const [addComment] = useMutation(AddCommentDocument);

  const [body, setBody] = useState("");
  const [internalOnly, setInternalOnly] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const internal = audience === "INTERNAL";

  async function submit(event) {
    event.preventDefault();
    if (!body.trim()) {
      setError("Write something first.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await addComment({
        variables: {
          input: {
            entityType,
            entityId,
            body: body.trim(),
            isClientVisible: internal ? !internalOnly : true,
          },
        },
      });
      setBody("");
      setInternalOnly(false);
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "We couldn't post that. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section aria-labelledby={`thread-${entityId}`} className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-3 sm:px-5">
        <MessageSquare aria-hidden="true" className="size-4 text-muted-foreground" />
        <h2 id={`thread-${entityId}`} className="text-subheading">
          {internal ? "Discussion" : "Questions and updates"}
        </h2>
        <span className="tabular ml-auto text-caption text-muted-foreground">
          {comments.length}
        </span>
      </div>

      {comments.length === 0 ? (
        <p className="px-4 py-6 text-center text-caption text-muted-foreground sm:px-5">
          {emptyText ??
            (internal
              ? "No discussion yet. Ask the client a question or leave an internal note."
              : "Nothing here yet. Ask us anything about this request.")}
        </p>
      ) : (
        <ol className="divide-y">
          {comments.map((comment) => {
            const fromClient = comment.authorType === "CLIENT";
            return (
              <li key={comment.id} className="flex gap-3 px-4 py-3.5 sm:px-5">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-medium",
                    fromClient
                      ? "bg-tone-accent-bg text-tone-accent-fg"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {initials(comment.authorName)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-caption font-medium">{comment.authorName}</span>
                    <span className="text-[0.75rem] text-muted-foreground">
                      {fromClient ? "Client" : "Meridian"}
                    </span>
                    <time
                      dateTime={comment.createdAt}
                      title={formatDateTime(comment.createdAt)}
                      className="text-[0.75rem] text-muted-foreground"
                    >
                      {formatRelativeDays(comment.createdAt)}
                    </time>
                    {internal && !comment.isClientVisible ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                        <EyeOff aria-hidden="true" className="size-3" />
                        Internal only
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-caption text-pretty">{comment.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {canPost ? (
        <form onSubmit={submit} className="border-t p-4 sm:p-5">
          <Label htmlFor={`comment-body-${entityId}`} className="sr-only">
            Add a comment
          </Label>
          <Textarea
            id={`comment-body-${entityId}`}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              if (error) setError(null);
            }}
            rows={3}
            placeholder={
              internal ? "Reply to the client, or leave an internal note…" : "Ask a question…"
            }
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `comment-error-${entityId}` : undefined}
          />
          {error ? (
            <p
              id={`comment-error-${entityId}`}
              className="mt-1.5 text-caption font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {internal ? (
              <label className="flex items-center gap-2 text-caption text-muted-foreground">
                <input
                  type="checkbox"
                  checked={internalOnly}
                  onChange={(event) => setInternalOnly(event.target.checked)}
                  className="size-4 rounded border-input accent-primary"
                />
                Internal only — the client won&apos;t see this
              </label>
            ) : (
              <span />
            )}

            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <Send aria-hidden="true" />
              )}
              Post
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
