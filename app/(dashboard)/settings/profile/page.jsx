import Link from "next/link";

import { PageHeader } from "@/app/components/domain/page-header";
import { ProfileSettingsForm } from "@/app/components/domain/profile-settings-form";
import { Button } from "@/app/components/ui/button";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Profile & preferences" };

export default async function ProfileSettingsPage() {
  const viewer = await requireViewer("INTERNAL");

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Profile & preferences"
        description="Update how you appear in the workspace and change your password."
        actions={
          <Button variant="outline" asChild>
            <Link href="/settings">Back to settings</Link>
          </Button>
        }
      />
      <ProfileSettingsForm scope="INTERNAL" viewer={viewer} />
    </>
  );
}
