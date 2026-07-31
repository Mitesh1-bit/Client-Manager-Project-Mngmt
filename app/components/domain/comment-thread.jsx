"use client";

import { EyeOff, MessageSquare } from "lucide-react";

import { formatDateTime, formatRelativeDays, initials } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

/**
 * Read-only comment thread until the backend exposes comment mutations.
 */
export function CommentThread({
  comments,
  audience = "INTERNAL",
  canPost = false,
  emptyText,
}) {
  const internal = audience === "INTERNAL";

  return (
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          {emptyText ?? "No comments yet."}
        </p>
      ) : (
        <ol className="space-y-3">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className={cn(
                "rounded-lg border bg-card p-3",
                comment.internalOnly && internal && "border-dashed bg-muted/30",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[0.6875rem] font-medium"
                >
                  {initials(comment.authorName ?? "?")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{comment.authorName ?? "Someone"}</p>
                    <time
                      dateTime={comment.createdAt}
                      className="text-caption text-muted-foreground"
                      title={formatDateTime(comment.createdAt)}
                    >
                      {formatRelativeDays(comment.createdAt)}
                    </time>
                    {comment.internalOnly && internal ? (
                      <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                        <EyeOff aria-hidden="true" className="size-3.5" />
                        Internal only
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-caption">{comment.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {canPost ? (
        <p className="flex items-center gap-2 text-caption text-muted-foreground">
          <MessageSquare aria-hidden="true" className="size-4" />
          Comment posting is not wired to the API yet.
        </p>
      ) : null}
    </div>
  );
}
