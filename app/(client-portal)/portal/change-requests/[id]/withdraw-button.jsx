"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { ResubmitChangeRequestDocument } from "@/app/lib/graphql/generated/documents";

/**
 * @param {{ requestId: string, reference?: string, status: string }} props
 */
export function WithdrawButton({ requestId, reference, status }) {
  const router = useRouter();
  const [resubmit, { loading }] = useMutation(ResubmitChangeRequestDocument);

  if (status === "REJECTED") {
    async function resubmitRequest() {
      try {
        await resubmit({ variables: { id: requestId } });
        toast.success(`${reference ?? "Request"} sent again`, {
          description: "We've notified the delivery team to review your revised request.",
        });
        router.refresh();
      } catch (error) {
        toast.error("Couldn't resubmit this request", { description: error?.message });
      }
    }

    return (
      <Button variant="outline" size="sm" disabled={loading} onClick={resubmitRequest}>
        {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        Submit revised request
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Cancel request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this change request?</AlertDialogTitle>
          <AlertDialogDescription>
            To cancel an in-progress request, contact your project manager. They can close it on
            your behalf so the team stops work on it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Got it</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
