"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { HealthScoreBadge } from "@/app/components/domain/health-score-badge";
import { StatusBadge } from "@/app/components/domain/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { formatDate } from "@/app/lib/format";
import { CancelEnrollmentDocument } from "@/app/lib/graphql/generated/documents";

export function EnrollmentRow({ enrollment, totalSteps }) {
  const router = useRouter();
  const [cancelEnrollment, { loading }] = useMutation(CancelEnrollmentDocument);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  async function cancel() {
    try {
      await cancelEnrollment({ variables: { enrollmentId: enrollment.id } });
      toast.success(`Cancelled for ${enrollment.company?.name ?? "company"}`);
      setConfirmingCancel(false);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't cancel this enrollment", { description: error?.message });
    }
  }

  const finished = ["COMPLETED", "CANCELLED"].includes(enrollment.status);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3.5">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/companies/${enrollment.company.id}`}
            className="truncate font-medium hover:underline focus-ring rounded-sm"
          >
            {enrollment.company.name}
          </Link>
          <StatusBadge kind="enrollmentStatus" value={enrollment.status} size="sm" />
        </div>
        <p className="mt-0.5 text-caption text-muted-foreground">
          {enrollment.contact ? `${enrollment.contact.fullName} · ` : ""}
          Step {Math.min(enrollment.currentStep + 1, totalSteps)} of {totalSteps} · enrolled{" "}
          {formatDate(enrollment.enrolledAt)}
        </p>
      </div>

      <HealthScoreBadge score={enrollment.company.healthScore} size="sm" showSparkline={false} />

      {!finished ? (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={loading}
            onClick={() => setConfirmingCancel(true)}
          >
            {loading ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : (
              <X aria-hidden="true" />
            )}
            <span className="sr-only">Cancel enrollment for {enrollment.company.name}</span>
          </Button>
        </div>
      ) : null}

      <AlertDialog open={confirmingCancel} onOpenChange={setConfirmingCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this enrollment?</AlertDialogTitle>
            <AlertDialogDescription>
              Any touchpoints this sequence still had scheduled for {enrollment.company.name} will
              be skipped. This can&apos;t be undone — enroll them again to restart from the
              beginning.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={cancel}>
              Cancel enrollment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
