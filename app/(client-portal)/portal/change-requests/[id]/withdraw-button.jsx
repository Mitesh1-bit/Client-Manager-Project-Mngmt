"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/app/components/ui/button";
import { WithdrawChangeRequestDocument } from "@/app/lib/graphql/generated/documents";

export function WithdrawButton({ requestId, reference }) {
  const router = useRouter();
  const [withdraw, { loading }] = useMutation(WithdrawChangeRequestDocument);

  async function confirm() {
    try {
      await withdraw({ variables: { id: requestId, reason: null } });
      toast.success(`${reference} withdrawn`);
      router.refresh();
    } catch (error) {
      toast.error("Couldn't withdraw this", { description: error?.message });
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Withdraw request
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw {reference}?</AlertDialogTitle>
          <AlertDialogDescription>
            We&apos;ll stop work on assessing or approving this. You can always raise it again
            later if you change your mind.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction onClick={confirm} disabled={loading}>
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Withdraw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
