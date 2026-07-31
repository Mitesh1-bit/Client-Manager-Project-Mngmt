"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

import { SectionCard } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { canAssess, isAssessed } from "@/app/lib/change-requests";
import { formatCurrency } from "@/app/lib/format";

import { AssessmentForm } from "./assessment-form";

/**
 * Read-only summary of the assessment, with an inline edit toggle. Kept
 * separate from `AssessmentForm` so the common case — glancing at what was
 * already decided — doesn't render a whole form.
 */
export function AssessmentPanel({ request, threshold }) {
  const [editing, setEditing] = useState(!isAssessed(request) && canAssess(request));

  if (editing) {
    return (
      <SectionCard title="Impact assessment">
        <AssessmentForm
          request={request}
          threshold={threshold}
          onDone={isAssessed(request) ? () => setEditing(false) : undefined}
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Impact assessment"
      actions={
        canAssess(request) ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil aria-hidden="true" />
            {isAssessed(request) ? "Revise" : "Assess"}
          </Button>
        ) : null
      }
    >
      {!isAssessed(request) ? (
        <p className="text-caption text-muted-foreground">Not assessed yet.</p>
      ) : (
        <div className="space-y-4">
          <dl className="grid grid-cols-3 gap-4 text-caption">
            <div>
              <dt className="text-muted-foreground">Effort</dt>
              <dd className="tabular mt-0.5 font-medium">{request.impactHours ?? 0}h</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Cost</dt>
              <dd className="tabular mt-0.5 font-medium">
                {request.impactCost > 0 ? "+" : ""}
                {formatCurrency(request.impactCost)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Timeline</dt>
              <dd className="tabular mt-0.5 font-medium">
                {request.impactTimelineDays > 0 ? "+" : ""}
                {request.impactTimelineDays} days
              </dd>
            </div>
          </dl>
          {request.assessmentNotes ? (
            <p className="text-caption text-pretty">{request.assessmentNotes}</p>
          ) : null}
          <p className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-muted-foreground">
            <span>
              Internal sign-off {request.requiresInternalApproval ? "required" : "not required"}
            </span>
            <span>Client approval {request.requiresClientApproval ? "required" : "not required"}</span>
          </p>
        </div>
      )}
    </SectionCard>
  );
}
