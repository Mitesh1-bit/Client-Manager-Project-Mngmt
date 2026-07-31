import { cn } from "@/app/lib/utils";

/**
 * Standard page heading block. Keeps the type scale and spacing identical on
 * every screen so no page invents its own header treatment.
 */
export function PageHeader({ eyebrow, title, description, actions, children, className }) {
  return (
    <header className={cn("flex flex-col gap-4 pb-6 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-overline uppercase text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 text-title text-balance">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-caption text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
