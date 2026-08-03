import Link from "next/link";

import { ProfileSettingsForm } from "@/app/components/domain/profile-settings-form";
import { Button } from "@/app/components/ui/button";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Profile & preferences" };

export default async function PortalProfilePage() {
  const viewer = await requireViewer("PORTAL");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Account
          </p>
          <h1 className="mt-1 text-title">Profile & preferences</h1>
          <p className="mt-2 text-caption text-muted-foreground">
            Update how your agency sees you in the portal.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/portal">Back to portal</Link>
        </Button>
      </div>
      <ProfileSettingsForm scope="PORTAL" viewer={viewer} />
    </div>
  );
}
