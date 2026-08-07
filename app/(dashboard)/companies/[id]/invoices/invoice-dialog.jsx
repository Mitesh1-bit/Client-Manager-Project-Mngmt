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
import { Textarea } from "@/app/components/ui/textarea";
import { CreateInvoiceDocument } from "@/app/lib/graphql/generated/documents";
import { listStatuses } from "@/app/lib/status";

/** @param {{ companyId: string, currency?: string }} props */
export function InvoiceDialog({ companyId, currency = "GBP" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [createInvoice, { loading }] = useMutation(CreateInvoiceDocument);

  function reset() {
    setInvoiceNumber("");
    setAmount("");
    setDueDate("");
    setStatus("DRAFT");
    setNotes("");
    setError(null);
  }

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0 || !dueDate) {
      setError("Amount and due date are required.");
      return;
    }

    setError(null);
    try {
      await createInvoice({
        variables: {
          companyId,
          amount: Number(amount),
          dueDate,
          invoiceNumber: invoiceNumber.trim() || null,
          status: status.toLowerCase(),
          notes: notes.trim() || null,
        },
      });
      toast.success("Invoice created");
      setOpen(false);
      reset();
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "We couldn't save this invoice. Try again.");
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
          New invoice
        </Button>
      </DialogTrigger>
      <DialogContent size="form">
        <DialogHeader>
          <DialogTitle>New invoice</DialogTitle>
          <DialogDescription>Bill this client for work delivered.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-caption font-medium">
              Invoice number <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
              className="h-10"
              placeholder="INV-1042"
            />
          </div>

          <div className="form-grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-caption font-medium">
                Amount ({currency}) <span aria-hidden="true" className="-ml-1 text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                step="50"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="h-10"
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-caption font-medium">
                Due date <span aria-hidden="true" className="-ml-1 text-destructive">*</span>
              </Label>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-10" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-caption font-medium">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {listStatuses("invoiceStatus").map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-caption font-medium">
              Notes <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
          </div>

          {error ? <p className="text-caption font-medium text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
            Create invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
