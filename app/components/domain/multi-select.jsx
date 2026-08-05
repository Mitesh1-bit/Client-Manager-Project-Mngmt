"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, LoaderCircle, Plus, X } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { cn } from "@/app/lib/utils";

/**
 * Searchable multi-select built on Radix Popover + cmdk, so it's keyboard
 * navigable and announces selection state. Used for tags, and reusable for any
 * many-to-many picker in later modules.
 *
 * `onCreate`, when passed, turns this into a creatable select: typing a name
 * that doesn't match any existing option offers a "Create '<name>'" row.
 * Selecting it calls `onCreate(name)`, which must create the record and
 * resolve to its new `{ value, label }` — the option list is the caller's
 * (it's what makes the newly-created one show as selected immediately,
 * without this component needing to know how the option was persisted).
 *
 * @param {{
 *   options: Array<{ value: string, label: string }>,
 *   value: string[],
 *   onChange: (next: string[]) => void,
 *   onCreate?: (name: string) => Promise<{ value: string, label: string }>,
 *   createLabel?: (name: string) => string,
 *   placeholder?: string,
 *   emptyText?: string,
 *   id?: string,
 *   'aria-describedby'?: string,
 *   'aria-invalid'?: boolean,
 * }} props
 */
export function MultiSelect({
  options,
  value,
  onChange,
  onCreate,
  createLabel = (name) => `Create "${name}"`,
  placeholder = "Select…",
  emptyText = "Nothing found.",
  id,
  ...aria
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const selected = options.filter((option) => value.includes(option.value));

  const trimmedSearch = search.trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const canCreate = Boolean(onCreate) && trimmedSearch.length > 0 && !hasExactMatch;

  function toggle(optionValue) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  }

  async function handleCreate() {
    if (!canCreate || creating) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmedSearch);
      if (created?.value) onChange([...value, created.value]);
      setSearch("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Popover onOpenChange={(open) => !open && setSearch("")}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          className="h-10 w-full justify-between font-normal"
          {...aria}
        >
          <span className={cn("truncate", selected.length === 0 && "text-muted-foreground")}>
            {selected.length === 0
              ? placeholder
              : selected.length <= 2
                ? selected.map((option) => option.label).join(", ")
                : `${selected.length} selected`}
          </span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
          <CommandList>
            {!canCreate ? <CommandEmpty>{emptyText}</CommandEmpty> : null}
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => toggle(option.value)}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-4 items-center justify-center rounded-sm border",
                        isSelected ? "border-primary bg-primary text-primary-foreground" : "opacity-50",
                      )}
                    >
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    {option.label}
                  </CommandItem>
                );
              })}
              {canCreate ? (
                <CommandItem value={`__create__${trimmedSearch}`} onSelect={handleCreate} disabled={creating}>
                  {creating ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Plus aria-hidden="true" className="size-4" />
                  )}
                  {createLabel(trimmedSearch)}
                </CommandItem>
              ) : null}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/** Removable chips for the current selection, shown under the trigger. */
export function SelectedChips({ options, value, onRemove, className }) {
  const selected = options.filter((option) => value.includes(option.value));
  if (selected.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {selected.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            onClick={() => onRemove(option.value)}
            className="inline-flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 text-[0.75rem] font-medium transition-colors hover:bg-accent focus-ring"
          >
            {option.label}
            <X aria-hidden="true" className="size-3" />
            <span className="sr-only">Remove {option.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
