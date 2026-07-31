"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { ResubmitChangeRequestDocument } from "@/app/lib/graphql/generated/documents";

export function WithdrawButton({ requestId, reference }) {
  const router = useRouter();
  const [resubmit, { loading }] = useMutation(ResubmitChangeRequestDocument);

  async function withdraw() {
    try {
      await resubmit({ variables: { id: requestId } });
      toast.success(`${reference ?? "Request"} withdrawn`, {
        description: "You can submit a revised request when ready.",
      });
      router.refresh();
    } catch (error) {
      toast.error("Couldn't withdraw this request", { description: error?.message });
    }
  }

  return (
    <Button variant="ghost" size="sm" disabled={loading} onClick={withdraw}>
      {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
      Withdraw request
    </Button>
  );
}
