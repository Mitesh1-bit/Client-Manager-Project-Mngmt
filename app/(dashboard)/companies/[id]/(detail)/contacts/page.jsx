import { notFound } from "next/navigation";

import { getClient } from "@/app/lib/graphql/apollo-client";
import { CompanyContactsDocument } from "@/app/lib/graphql/generated/documents";

import { ContactsPanel } from "./contacts-panel";

export const metadata = { title: "Contacts" };

export default async function CompanyContactsPage({ params }) {
  const { id } = await params;
  const { data } = await getClient().query({
    query: CompanyContactsDocument,
    variables: { id },
  });

  if (!data.company) notFound();

  return (
    <ContactsPanel
      companyId={data.company.id}
      companyName={data.company.name}
      contacts={data.company.contacts}
    />
  );
}
