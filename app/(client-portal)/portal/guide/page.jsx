import { PageHeader } from "@/app/components/domain/page-header";
import { CrmRoleGuide } from "@/app/components/domain/crm-role-guide";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Portal guide" };

export default async function PortalGuidePage() {
  await requireViewer("PORTAL");

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Portal guide"
        description="How to use your client portal — projects, approvals, change requests, and shared documents."
      />
      <CrmRoleGuide scope="PORTAL" />
    </>
  );
}
