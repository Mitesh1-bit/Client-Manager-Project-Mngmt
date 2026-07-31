"use client";

import { useId } from "react";

import { Label } from "@/app/components/ui/label";
import { cn } from "@/app/lib/utils";

/**
 * Wraps a control with its label, hint and error, wiring aria-describedby and
 * aria-invalid so screen readers get the same information sighted users do.
 * `children` receives the ids it needs to spread onto the control.
 *
 * @param {{ label: string, hint?: string, error?: string, required?: boolean, className?: string, children: (props: { id: string, 'aria-describedby': string | undefined, 'aria-invalid': boolean }) => React.ReactNode }} props
 */
export function FormField({ label, hint, error, required, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-caption font-medium">
        {label}
        {/* -ml-1 closes the gap the Label's flex layout would otherwise put
            between the text and its asterisk. */}
        {required ? (
          <span aria-hidden="true" className="-ml-1 text-destructive">
            *
          </span>
        ) : null}
      </Label>

      {children({ id, "aria-describedby": describedBy, "aria-invalid": Boolean(error) })}

      {hint && !error ? (
        <p id={hintId} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-caption text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
