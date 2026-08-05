import { Shield } from "lucide-react";

import { SectionCard } from "@/app/components/domain/states";
import { ROLE_CATALOG } from "@/app/lib/rbac";

export function RolesAccessPanel() {
  return (
    <SectionCard
      data-tour="settings-roles"
      title="Roles & access"
      description="What each role can do in your workspace. Client portal access is managed per contact, not per team member."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        {ROLE_CATALOG.map((role) => (
          <article key={role.value} className="rounded-xl border bg-card p-4">
            <h3 className="font-medium">{role.label}</h3>
            <p className="mt-1 text-caption text-pretty text-muted-foreground">{role.summary}</p>
            <ul className="mt-3 space-y-1 text-[0.75rem] text-muted-foreground">
              {role.access.map((item) => (
                <li key={item} className="flex gap-2">
                  <Shield aria-hidden="true" className="mt-0.5 size-3 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
