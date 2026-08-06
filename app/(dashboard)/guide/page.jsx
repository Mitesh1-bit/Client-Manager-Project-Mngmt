import { BackLink } from "@/app/components/domain/back-link";
import { PageHeader } from "@/app/components/domain/page-header";
import { CrmRoleGuide } from "@/app/components/domain/crm-role-guide";
import { requireViewer } from "@/app/lib/graphql/viewer";

export const metadata = { title: "Product guide" };

export default async function GuidePage() {
  const viewer = await requireViewer("INTERNAL");

  return (
    <>
      <BackLink href="/dashboard">Back to dashboard</BackLink>
      <PageHeader
        eyebrow="Help"
        title="Product guide"
        description="Animated walkthroughs for every role — what to do, where to click, and how the CRM fits together."
      />
      <CrmRoleGuide scope="INTERNAL" userRole={viewer.role} />
    </>
  );
}
