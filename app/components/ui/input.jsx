import * as React from "react"

import { cn } from "@/app/lib/utils"

/** Block scientific notation and plus-sign in native number inputs. */
function handleNumberInputKeyDown(event) {
  if (event.key === "e" || event.key === "E" || event.key === "+") {
    event.preventDefault()
  }
}

function handleNumberInputPaste(event) {
  const text = event.clipboardData.getData("text")
  if (/[eE+]/.test(text)) {
    event.preventDefault()
  }
}

function sanitizeNumberInputValue(value) {
  if (typeof value !== "string") return value
  return value.replace(/[eE+]/g, "")
}

const Input = React.forwardRef(function Input(
  { className, type, onKeyDown, onPaste, onChange, ...props },
  ref,
) {
  const isNumber = type === "number"

  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      onKeyDown={(event) => {
        if (isNumber) handleNumberInputKeyDown(event)
        onKeyDown?.(event)
      }}
      onPaste={(event) => {
        if (isNumber) handleNumberInputPaste(event)
        onPaste?.(event)
      }}
      onChange={(event) => {
        if (isNumber) {
          const sanitized = sanitizeNumberInputValue(event.target.value)
          if (sanitized !== event.target.value) {
            event.target.value = sanitized
          }
        }
        onChange?.(event)
      }}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props} />
  );
});

export { Input }
