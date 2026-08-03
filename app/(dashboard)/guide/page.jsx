import { PageHeader } from "@/app/components/domain/page-header";
import { CrmRoleGuide } from "@/app/components/domain/crm-role-guide";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Product guide" };

export default async function GuidePage() {
  const viewer = await requireViewer("INTERNAL");

  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="Product guide"
        description="Animated walkthroughs for every role — what to do, where to click, and how the CRM fits together."
      />
      <CrmRoleGuide scope="INTERNAL" userRole={viewer.role} />
    </>
  );
}
