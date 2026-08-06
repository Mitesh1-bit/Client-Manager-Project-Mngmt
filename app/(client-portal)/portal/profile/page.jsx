import { ProfileSettingsForm } from "@/app/components/domain/profile-settings-form";
import { requireViewer } from "@/app/lib/graphql/viewer";

import { PortalBackLink, PortalPageHeader } from "../portal-ui";

export const metadata = { title: "Profile & preferences" };

export default async function PortalProfilePage() {
  const viewer = await requireViewer("PORTAL");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PortalBackLink href="/portal">Back to overview</PortalBackLink>
      <PortalPageHeader
        eyebrow="Account"
        title="Profile & preferences"
        description="Update how your agency sees you in the portal and change your password."
      />
      <ProfileSettingsForm scope="PORTAL" viewer={viewer} />
    </div>
  );
}
