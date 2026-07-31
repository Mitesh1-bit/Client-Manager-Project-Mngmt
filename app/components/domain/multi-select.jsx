"use client";

import { Check, ChevronsUpDown, X } from "lucide-react";

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
 * @param {{ options: Array<{ value: string, label: string }>, value: string[], onChange: (next: string[]) => void, placeholder?: string, emptyText?: string, id?: string, 'aria-describedby'?: string, 'aria-invalid'?: boolean }} props
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  emptyText = "Nothing found.",
  id,
  ...aria
}) {
  const selected = options.filter((option) => value.includes(option.value));

  function toggle(optionValue) {
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <Popover>
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
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
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
