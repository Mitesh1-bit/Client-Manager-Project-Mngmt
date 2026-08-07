"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { LoaderCircle, Plus, Search, Sparkles, Workflow } from "lucide-react";
import { toast } from "sonner";

import { SearchableSelect } from "@/app/components/domain/searchable-select";
import { EmptyState } from "@/app/components/domain/states";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { normalizeRetentionSequence } from "@/app/lib/api/normalize";
import {
  GenerateRetentionSequenceDocument,
  RetentionFormOptionsDocument,
  RetentionSequencesDocument,
} from "@/app/lib/graphql/generated/documents";

import { RetentionTabs } from "../retention-tabs";
import { SequenceCard } from "./sequence-card";
import { SEQUENCE_STATUS_LABELS } from "./sequence-schema";

const STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  ...Object.entries(SEQUENCE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const SOURCE_OPTIONS = [
  { value: "ALL", label: "All sources" },
  { value: "AI", label: "AI generated" },
  { value: "MANUAL", label: "Manual" },
];

export function SequencesListPanel() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [generatingCompanyId, setGeneratingCompanyId] = useState("");

  const { data: optionsData } = useQuery(RetentionFormOptionsDocument);
  const companyOptions = useMemo(
    () => (optionsData?.companies ?? []).map((company) => ({ value: company.id, label: company.name })),
    [optionsData],
  );
  const companyFilterOptions = useMemo(
    () => [{ value: "ALL", label: "All companies" }, ...companyOptions],
    [companyOptions],
  );

  const variables = useMemo(
    () => ({
      activeOnly: false,
      companyId: companyId === "ALL" ? null : companyId,
      status: status === "ALL" ? null : status.toLowerCase(),
      source: source === "ALL" ? null : source.toLowerCase(),
      search: debouncedSearch.trim() || null,
    }),
    [companyId, status, source, debouncedSearch],
  );

  const { data, loading, error, refetch } = useQuery(RetentionSequencesDocument, { variables });
  const [generateSequence, { loading: generating }] = useMutation(GenerateRetentionSequenceDocument);

  const sequences = (data?.retentionSequences ?? []).map(normalizeRetentionSequence);

  function handleSearchSubmit(event) {
    event.preventDefault();
    setDebouncedSearch(search);
  }

  async function handleGenerate() {
    if (!generatingCompanyId) {
      toast.error("Choose a client company first.");
      return;
    }
    try {
      const { data: result } = await generateSequence({
        variables: { companyId: generatingCompanyId },
        update: (cache) => cache.evict({ fieldName: "retentionSequences" }),
      });
      toast.success("AI sequence generated", {
        description: "Review and approve the pending sequence.",
      });
      router.push(`/retention/sequences/${result.generateRetentionSequence.id}`);
      router.refresh();
    } catch (mutationError) {
      toast.error(mutationError?.message ?? "AI generation failed. Try again.");
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RetentionTabs counts={{ "/retention/sequences": sequences.length }} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/retention/sequences/new">
              <Plus aria-hidden="true" />
              Manual sequence
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 space-y-4 rounded-2xl border bg-card p-4">
        <form onSubmit={handleSearchSubmit} className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <SearchableSelect
              options={companyFilterOptions}
              value={companyId}
              onChange={setCompanyId}
              placeholder="Client company"
              emptyText="No client matches."
            />
          </div>
          <div className="lg:col-span-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 lg:col-span-5">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or description"
              className="h-10"
            />
            <Button type="submit" variant="outline" className="shrink-0">
              <Search aria-hidden="true" />
              Search
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3 rounded-xl border border-dashed p-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-caption font-medium">Generate with AI</p>
            <p className="text-[0.75rem] text-muted-foreground">
              Analyze client data and create a pending retention sequence for PM approval.
            </p>
            <SearchableSelect
              options={companyOptions}
              value={generatingCompanyId}
              onChange={setGeneratingCompanyId}
              placeholder="Choose a client company"
              emptyText="No client matches."
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating || !generatingCompanyId}>
            {generating ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : <Sparkles aria-hidden="true" />}
            Generate sequence
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-caption text-destructive">
          {error.message}
          <Button variant="link" className="ml-2 h-auto p-0" onClick={() => refetch()}>
            Retry
          </Button>
        </p>
      ) : null}

      {loading ? (
        <div className="mt-6 flex items-center justify-center py-16 text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin" />
        </div>
      ) : sequences.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="No sequences match"
          description="Create a manual sequence or generate one with AI for a specific client company."
          className="mt-6"
          action={
            <Button asChild>
              <Link href="/retention/sequences/new">
                <Plus aria-hidden="true" />
                New sequence
              </Link>
            </Button>
          }
        />
      ) : (
        <div data-tour="retention-sequences-list" className="mt-4 grid gap-4 lg:grid-cols-2">
          {sequences.map((sequence) => (
            <SequenceCard key={sequence.id} sequence={sequence} />
          ))}
        </div>
      )}
    </>
  );
}
