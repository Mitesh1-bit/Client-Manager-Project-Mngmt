import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import {
  CLIENT_LOGIN_PATH,
  DASHBOARD_HOME,
  LOGIN_PATH,
  PORTAL_HOME,
} from "@/app/lib/auth/routes";
import { getSessionClaims } from "@/app/lib/auth/session";
import { getClient } from "@/app/lib/graphql/apollo-client";
import { MeDocument } from "@/app/lib/graphql/generated/documents";
import { humanize } from "@/app/lib/status";

function loginPath(expectedScope, returnPath) {
  const base = expectedScope === "PORTAL" ? CLIENT_LOGIN_PATH : LOGIN_PATH;
  if (returnPath && returnPath !== base && !returnPath.startsWith(`${base}?`)) {
    return `${base}?next=${encodeURIComponent(returnPath)}`;
  }
  return base;
}

/**
 * Loads the signed-in viewer server-side for the app shells.
 *
 * @param {'INTERNAL' | 'PORTAL'} expectedScope
 */
export async function requireViewer(expectedScope) {
  const claims = await getSessionClaims();
  const headerStore = await headers();
  const returnPath = headerStore.get("x-pathname") ?? null;

  if (!claims) redirect(loginPath(expectedScope, returnPath));

  let me = null;
  try {
    const { data } = await getClient().query({ query: MeDocument });
    me = data?.me ?? null;
  } catch {
    me = null;
  }

  if (!me) redirect(loginPath(expectedScope, returnPath));
  if (me.scope !== expectedScope) {
    redirect(me.scope === "PORTAL" ? PORTAL_HOME : DASHBOARD_HOME);
  }

  return {
    ...me,
    roleLabel: me.scope === "PORTAL" ? (me.contact?.title ?? "Client contact") : humanize(me.role),
  };
}
