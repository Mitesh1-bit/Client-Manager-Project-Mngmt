import { cn } from "@/app/lib/utils";

const SIZES = {
  sm: "size-7 text-[0.8125rem]",
  md: "size-9 text-[0.9375rem]",
  lg: "size-11 text-subheading",
};

export function BrandMark({ size = "md", className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground",
        SIZES[size],
        className,
      )}
    >
      M
    </span>
  );
}

export function BrandLockup({ subtitle, size = "md", className }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark size={size} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate font-semibold tracking-tight">Meridian</span>
        {subtitle ? (
          <span className="truncate text-[0.6875rem] text-muted-foreground">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
