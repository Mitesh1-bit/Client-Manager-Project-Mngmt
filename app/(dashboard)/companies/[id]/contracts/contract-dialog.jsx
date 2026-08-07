"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { CreateContractDocument } from "@/app/lib/graphql/generated/documents";
import { listStatuses } from "@/app/lib/status";

/** @param {{ companyId: string, currency?: string }} props */
export function ContractDialog({ companyId, currency = "GBP" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [value, setValue] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [status, setStatus] = useState("DRAFT");
  const [error, setError] = useState(null);
  const [createContract, { loading }] = useMutation(CreateContractDocument);

  function reset() {
    setName("");
    setStartDate("");
    setEndDate("");
    setValue("");
    setAutoRenew(false);
    setStatus("DRAFT");
    setError(null);
  }

  async function handleSubmit() {
    if (!name.trim() || !startDate || !endDate) {
      setError("Name, start date and end date are required.");
      return;
    }
    if (endDate < startDate) {
      setError("The end date can't be before the start date.");
      return;
    }

    setError(null);
    try {
      await createContract({
        variables: {
          companyId,
          name: name.trim(),
          startDate,
          endDate,
          value: value === "" ? null : Number(value),
          autoRenew,
          status: status.toLowerCase(),
        },
      });
      toast.success(`"${name.trim()}" created`);
      setOpen(false);
      reset();
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "We couldn't save this contract. Try again.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden="true" />
          New contract
        </Button>
      </DialogTrigger>
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle>New contract</DialogTitle>
          <DialogDescription>Record the terms this client is signed up under.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-caption font-medium">
              Name <span aria-hidden="true" className="-ml-1 text-destructive">*</span>
            </Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} className="h-10" placeholder="Annual retainer" />
          </div>

          <div className="form-grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-caption font-medium">
                Start date <span aria-hidden="true" className="-ml-1 text-destructive">*</span>
              </Label>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-caption font-medium">
                End date <span aria-hidden="true" className="-ml-1 text-destructive">*</span>
              </Label>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-10" />
            </div>
          </div>

          <div className="form-grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-caption font-medium">Value ({currency})</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className="h-10"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-caption font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listStatuses("contractStatus").map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border p-3.5">
            <div className="min-w-0">
              <Label htmlFor="contract-auto-renew" className="text-caption font-medium">
                Auto-renew
              </Label>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                Rolls over automatically at the end date.
              </p>
            </div>
            <Switch id="contract-auto-renew" checked={autoRenew} onCheckedChange={setAutoRenew} />
          </div>

          {error ? <p className="text-caption font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Create contract
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
