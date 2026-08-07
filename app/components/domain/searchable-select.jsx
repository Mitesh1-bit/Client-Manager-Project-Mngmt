"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

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
 * Kept so any lingering imports don't break — search is now the default for
 * every entity picker regardless of list length, so this no longer gates
 * anything. See `shouldUseSearchableSelect`.
 */
export const SEARCHABLE_SELECT_THRESHOLD = 0;

/**
 * Single-select combobox with type-to-search. Used for timezones, countries,
 * and any long option list in forms or filters.
 *
 * `allowCustom`, when passed, turns this into a creatable select: typing
 * something that doesn't match any option offers a "Use '<text>'" row.
 * Selecting it calls `onChange` with that text (run through
 * `normalizeCustomValue` first, if given) — there's no persisted record
 * behind it the way a created tag has one, it's just a value the option
 * list doesn't happen to contain. If `value` itself doesn't match any
 * option (a custom value chosen earlier), the trigger falls back to
 * `formatUnknownValue(value)` instead of the placeholder.
 *
 * @param {{
 *   options: Array<{ value: string, label: string, searchText?: string }>,
 *   value?: string | null,
 *   onChange: (value: string) => void,
 *   placeholder?: string,
 *   emptyText?: string,
 *   allowClear?: boolean,
 *   clearLabel?: string,
 *   allowCustom?: boolean,
 *   createLabel?: (text: string) => string,
 *   normalizeCustomValue?: (text: string) => string,
 *   formatUnknownValue?: (value: string) => string,
 *   disabled?: boolean,
 *   id?: string,
 *   className?: string,
 *   'aria-describedby'?: string,
 *   'aria-invalid'?: boolean,
 * }} props
 */
export function SearchableSelect({
  options,
  value = "",
  onChange,
  placeholder = "Select…",
  emptyText = "Nothing found.",
  allowClear = false,
  clearLabel = "Not set",
  allowCustom = false,
  createLabel = (text) => `Use "${text}"`,
  normalizeCustomValue = (text) => text.trim(),
  formatUnknownValue = (val) => val,
  disabled = false,
  id,
  className,
  ...aria
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const trimmedSearch = search.trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const canCreate = allowCustom && trimmedSearch.length > 0 && !hasExactMatch;

  function selectCustom() {
    onChange(normalizeCustomValue(trimmedSearch));
    setSearch("");
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("h-10 w-full justify-between font-normal", className)}
          {...aria}
        >
          <span className={cn("truncate", !selected && !value && "text-muted-foreground")}>
            {selected?.label ?? (value ? formatUnknownValue(value) : placeholder)}
          </span>
          <ChevronsUpDown aria-hidden="true" className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command
          filter={(itemValue, currentSearch) => {
            const needle = currentSearch.trim().toLowerCase();
            if (!needle) return 1;
            return itemValue.toLowerCase().includes(needle) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search…" value={search} onValueChange={setSearch} />
          <CommandList className="max-h-72">
            {!canCreate ? <CommandEmpty>{emptyText}</CommandEmpty> : null}
            <CommandGroup>
              {allowClear ? (
                <CommandItem
                  value={`__clear__ ${clearLabel}`}
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    aria-hidden="true"
                    className={cn("size-4", value ? "opacity-0" : "opacity-100")}
                  />
                  {clearLabel}
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.searchText ?? `${option.label} ${option.value}`}
                  onSelect={() => {
                    onChange(option.value);
                    setSearch("");
                    setOpen(false);
                  }}
                >
                  <Check
                    aria-hidden="true"
                    className={cn(
                      "size-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {canCreate ? (
                <CommandItem value={`__custom__ ${trimmedSearch}`} onSelect={selectCustom}>
                  <Plus aria-hidden="true" className="size-4" />
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

/**
 * Whether to render a searchable combobox instead of a plain Select. Search
 * is the default everywhere now — a 3-person list today can be a 1000-person
 * list next quarter, and switching UI patterns as data grows is worse than
 * just always having a search box. Pass `useSearchable={false}` for the rare
 * case a plain Select is genuinely preferable (e.g. a fixed 2-3 option enum).
 *
 * @param {{ options: Array<{ value: string, label: string, searchText?: string }>, useSearchable?: boolean | 'auto', selectRenderer?: React.ReactNode, searchableProps?: object }} props
 */
export function shouldUseSearchableSelect(_options, useSearchable = "auto") {
  return useSearchable !== false;
}
