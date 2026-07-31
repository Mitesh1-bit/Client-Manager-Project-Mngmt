import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { initials } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

const SIZES = {
  xs: "size-6 text-[0.625rem]",
  sm: "size-8 text-[0.6875rem]",
  md: "size-10 text-caption",
  lg: "size-14 text-subheading",
};

/**
 * Avatar for a company, contact or user. Companies get a rounded square,
 * people get a circle — a small cue that stops the two reading as the same
 * kind of thing in mixed lists.
 *
 * @param {{ name: string, imageUrl?: string | null, kind?: 'company' | 'person', size?: keyof SIZES, className?: string }} props
 */
export function EntityAvatar({ name, imageUrl, kind = "person", size = "md", className }) {
  return (
    <Avatar
      className={cn(
        SIZES[size],
        kind === "company" ? "rounded-lg" : "rounded-full",
        "shrink-0",
        className,
      )}
    >
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
      <AvatarFallback
        className={cn(
          "font-medium",
          kind === "company"
            ? "rounded-lg bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100"
            : "rounded-full",
        )}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
