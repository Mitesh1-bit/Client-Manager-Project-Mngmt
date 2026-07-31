import { redirect } from "next/navigation";

import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { MeDocument } from "@/app/lib/graphql/generated/documents";
import { humanize } from "@/app/lib/status";

/**
 * Loads the signed-in viewer server-side for the app shells.
 *
 * Middleware has already bounced anonymous requests, so reaching here without a
 * viewer means the session went stale between the two — send them back to login
 * rather than rendering a shell with no identity.
 *
 * @param {'INTERNAL' | 'PORTAL'} expectedScope
 */
export async function requireViewer(expectedScope) {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  let me = null;
  try {
    const { data } = await getClient().query({ query: MeDocument });
    me = data?.me ?? null;
  } catch {
    me = null;
  }

  if (!me) redirect("/login");
  if (me.scope !== expectedScope) redirect(me.scope === "PORTAL" ? "/portal" : "/");

  return {
    ...me,
    roleLabel: me.scope === "PORTAL" ? (me.contact?.title ?? "Client contact") : humanize(me.role),
  };
}
