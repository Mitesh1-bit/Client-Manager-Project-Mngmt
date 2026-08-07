"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { Check, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  ApproveRetentionSequenceDocument,
  RejectRetentionSequenceDocument,
} from "@/app/lib/graphql/generated/documents";

export function SequenceApprovalPanel({ sequenceId, status, aiRationale, rejectionReason }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [approve, { loading: approving }] = useMutation(ApproveRetentionSequenceDocument);
  const [reject, { loading: rejecting }] = useMutation(RejectRetentionSequenceDocument);

  if (status !== "PENDING" && status !== "REJECTED") {
    return null;
  }

  async function handleApprove() {
    try {
      await approve({
        variables: { id: sequenceId },
        update: (cache) => cache.evict({ fieldName: "retentionSequences" }),
      });
      toast.success("Sequence approved");
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? "Couldn't approve this sequence.");
    }
  }

  async function handleReject() {
    try {
      await reject({
        variables: { id: sequenceId, reason: reason.trim() || null },
        update: (cache) => cache.evict({ fieldName: "retentionSequences" }),
      });
      toast.success("Sequence rejected");
      router.refresh();
    } catch (error) {
      toast.error(error?.message ?? "Couldn't reject this sequence.");
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-tone-caution-border bg-tone-caution-bg p-4">
      {status === "PENDING" ? (
        <>
          <p className="text-caption font-medium text-tone-caution-fg">Pending approval</p>
          {aiRationale ? (
            <Alert>
              <AlertDescription className="text-pretty">{aiRationale}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleApprove} disabled={approving || rejecting}>
              {approving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Check aria-hidden="true" />}
              Approve
            </Button>
            <Button variant="outline" onClick={handleReject} disabled={approving || rejecting}>
              {rejecting ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <X aria-hidden="true" />}
              Reject
            </Button>
          </div>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={2}
            placeholder="Optional rejection reason"
          />
        </>
      ) : null}

      {status === "REJECTED" && rejectionReason ? (
        <p className="text-caption text-muted-foreground">
          Rejected: {rejectionReason}
        </p>
      ) : null}
    </div>
  );
}
