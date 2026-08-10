"use client";

import { useQuery } from "@apollo/client/react";

import { Progress } from "@/app/components/ui/progress";
import { ProjectDetailHeaderDocument } from "@/app/lib/graphql/generated/documents";

/**
 * Live project progress — refetches when board/list mutations call projectHeaderRefetch().
 *
 * @param {{ projectId: string; initialPercent?: number }} props
 */
export function ProjectProgressBar({ projectId, initialPercent = 0 }) {
  const { data } = useQuery(ProjectDetailHeaderDocument, {
    variables: { id: projectId },
    fetchPolicy: "cache-and-network",
  });

  const percent = data?.project?.completionPercent ?? initialPercent;

  return (
    <div className="flex items-center gap-2">
      <Progress
        value={percent}
        aria-label={`${percent}% complete`}
        className="flex-1"
      />
      <span className="tabular text-caption font-medium">{percent}%</span>
    </div>
  );
}
