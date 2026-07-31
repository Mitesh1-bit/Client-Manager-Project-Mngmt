"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu";
import { CLIENT_LOGIN_PATH, LOGIN_PATH } from "@/app/lib/auth/routes";
import {
  LogoutDocument,
  PortalLogoutDocument,
} from "@/app/lib/graphql/generated/documents";

/**
 * @param {{ scope?: 'INTERNAL' | 'PORTAL' }} props
 */
export function SignOutMenuItem({ scope = "INTERNAL" }) {
  const router = useRouter();
  const apollo = useApolloClient();
  const [logout] = useMutation(LogoutDocument);
  const [portalLogout] = useMutation(PortalLogoutDocument);
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const isPortal = scope === "PORTAL";

    if (isPortal) {
      await portalLogout().catch(() => null);
    } else {
      await logout().catch(() => null);
    }

    await fetch("/api/auth/session", { method: "DELETE" });
    await apollo.clearStore();
    router.replace(isPortal ? CLIENT_LOGIN_PATH : LOGIN_PATH);
    router.refresh();
  }

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={pending}
      onSelect={(event) => {
        event.preventDefault();
        signOut();
      }}
    >
      <LogOut />
      {pending ? "Signing out…" : "Sign out"}
    </DropdownMenuItem>
  );
}
