import { redirect } from "next/navigation";

/** Touchpoints removed — send old links to the company overview. */
export default async function CompanyTouchpointsRedirect({ params }) {
  const { id } = await params;
  redirect(`/companies/${id}`);
}
