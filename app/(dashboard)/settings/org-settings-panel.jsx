"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/app/components/domain/form-field";
import { SectionCard } from "@/app/components/domain/states";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { UpdateOrganizationSettingsDocument } from "@/app/lib/graphql/generated/documents";
import { cn } from "@/app/lib/utils";

const WEIGHT_FIELDS = [
  { key: "healthWeightProjectHealth", label: "Project health" },
  { key: "healthWeightTouchpoints", label: "Touchpoints" },
  { key: "healthWeightChangeRequests", label: "Change requests" },
  { key: "healthWeightContract", label: "Contract" },
  { key: "healthWeightCompanyStatus", label: "Company status" },
];

function toFormState(settings) {
  const state = {};
  for (const { key } of WEIGHT_FIELDS) state[key] = String(settings[key]);
  state.healthAtRiskThreshold = String(settings.healthAtRiskThreshold);
  state.contractRenewalWindowDays = String(settings.contractRenewalWindowDays);
  state.crInternalApprovalCostThreshold = String(settings.crInternalApprovalCostThreshold);
  state.crInternalApprovalTimelineDaysThreshold = String(settings.crInternalApprovalTimelineDaysThreshold);
  state.crRevisionCap = String(settings.crRevisionCap);
  state.crResponseSlaDays = String(settings.crResponseSlaDays);
  return state;
}

/** @param {{ settings: object }} props */
export function OrgSettingsPanel({ settings }) {
  const router = useRouter();
  const [form, setForm] = useState(() => toFormState(settings));
  const [error, setError] = useState(null);
  const [updateSettings, { loading }] = useMutation(UpdateOrganizationSettingsDocument);

  const weightSum = useMemo(
    () => WEIGHT_FIELDS.reduce((total, { key }) => total + (Number(form[key]) || 0), 0),
    [form],
  );
  const weightSumOk = Math.abs(weightSum - 1) <= 0.01;

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await updateSettings({
        variables: {
          healthWeightProjectHealth: Number(form.healthWeightProjectHealth),
          healthWeightTouchpoints: Number(form.healthWeightTouchpoints),
          healthWeightChangeRequests: Number(form.healthWeightChangeRequests),
          healthWeightContract: Number(form.healthWeightContract),
          healthWeightCompanyStatus: Number(form.healthWeightCompanyStatus),
          healthAtRiskThreshold: Number(form.healthAtRiskThreshold),
          contractRenewalWindowDays: Number(form.contractRenewalWindowDays),
          crInternalApprovalCostThreshold: Number(form.crInternalApprovalCostThreshold),
          crInternalApprovalTimelineDaysThreshold: Number(form.crInternalApprovalTimelineDaysThreshold),
          crRevisionCap: Number(form.crRevisionCap),
          crResponseSlaDays: Number(form.crResponseSlaDays),
        },
      });
      toast.success("Workspace rules updated");
      router.refresh();
    } catch (mutationError) {
      setError(mutationError?.message ?? "Couldn't save these settings.");
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Couldn&apos;t save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <SectionCard
        title="Client health scoring"
        description="How a company's health score (0-100) is weighted, and when it counts as at risk."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEIGHT_FIELDS.map(({ key, label }) => (
            <FormField key={key} label={label} required>
              {(field) => (
                <Input
                  {...field}
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form[key]}
                  onChange={(event) => setField(key, event.target.value)}
                  className="h-10 tabular"
                />
              )}
            </FormField>
          ))}
        </div>
        <p
          className={cn(
            "mt-3 text-caption",
            weightSumOk ? "text-muted-foreground" : "font-medium text-destructive",
          )}
        >
          Weights add up to {weightSum.toFixed(2)}
          {weightSumOk ? "" : " — these five must add up to 1.00"}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label="At-risk threshold" required>
            {(field) => (
              <Input
                {...field}
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.healthAtRiskThreshold}
                onChange={(event) => setField("healthAtRiskThreshold", event.target.value)}
                className="h-10 tabular"
              />
            )}
          </FormField>
          <FormField label="Contract renewal window (days)" required>
            {(field) => (
              <Input
                {...field}
                type="number"
                min="0"
                step="1"
                value={form.contractRenewalWindowDays}
                onChange={(event) => setField("contractRenewalWindowDays", event.target.value)}
                className="h-10 tabular"
              />
            )}
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Change request rules"
        description="When a change request needs internal approval, and when it gets escalated."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Internal approval cost threshold" required>
            {(field) => (
              <Input
                {...field}
                type="number"
                min="0"
                step="100"
                value={form.crInternalApprovalCostThreshold}
                onChange={(event) => setField("crInternalApprovalCostThreshold", event.target.value)}
                className="h-10 tabular"
              />
            )}
          </FormField>
          <FormField label="Internal approval timeline threshold (days)" required>
            {(field) => (
              <Input
                {...field}
                type="number"
                min="0"
                step="1"
                value={form.crInternalApprovalTimelineDaysThreshold}
                onChange={(event) =>
                  setField("crInternalApprovalTimelineDaysThreshold", event.target.value)
                }
                className="h-10 tabular"
              />
            )}
          </FormField>
          <FormField label="Revision cap before manager escalation" required>
            {(field) => (
              <Input
                {...field}
                type="number"
                min="1"
                step="1"
                value={form.crRevisionCap}
                onChange={(event) => setField("crRevisionCap", event.target.value)}
                className="h-10 tabular"
              />
            )}
          </FormField>
          <FormField label="Response SLA (days)" required>
            {(field) => (
              <Input
                {...field}
                type="number"
                min="1"
                step="1"
                value={form.crResponseSlaDays}
                onChange={(event) => setField("crResponseSlaDays", event.target.value)}
                className="h-10 tabular"
              />
            )}
          </FormField>
        </div>
      </SectionCard>

      <Button type="submit" disabled={loading || !weightSumOk}>
        {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        Save workspace rules
      </Button>
    </form>
  );
}
