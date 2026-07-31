import { PhasePlaceholder } from "@/app/components/domain/phase-placeholder";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <PhasePlaceholder
      eyebrow="Workspace"
      title="Settings"
      description="Organisation, users and roles, templates, tags, approval thresholds and integrations."
      phase="a later phase"
      scope={[
        "user management and role assignment",
        "approval thresholds that drive change request routing",
        "template and tag libraries",
      ]}
    />
  );
}
