import { Suspense } from "react";
import { notFound } from "next/navigation";

import { normalizeContact } from "@/app/lib/api/normalize";
import { asArray } from "@/app/lib/api/safe-list";
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

  const contacts = asArray(data.company.contacts).map((contact) => normalizeContact(contact));

  return (
    <Suspense fallback={null}>
      <ContactsPanel
        companyId={data.company.id}
        companyName={data.company.name}
        contacts={contacts}
      />
    </Suspense>
  );
}
