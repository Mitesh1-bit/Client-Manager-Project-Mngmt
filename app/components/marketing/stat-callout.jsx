import { cn } from "@/app/lib/utils";

export function StatCallout({ value, label, className }) {
  return (
    <div
      className={cn(
        "rounded-xl bg-mkt-navy px-4 py-3 text-white shadow-lg",
        className,
      )}
    >
      <p className="font-mkt-display text-2xl leading-none md:text-3xl">{value}</p>
      <p className="mt-1 text-xs font-medium text-white/80">{label}</p>
    </div>
  );
}
