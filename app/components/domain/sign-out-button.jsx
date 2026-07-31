"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { LogOut } from "lucide-react";

import { DropdownMenuItem } from "@/app/components/ui/dropdown-menu";
import { LogoutDocument } from "@/app/lib/graphql/generated/documents";

export function SignOutMenuItem() {
  const router = useRouter();
  const apollo = useApolloClient();
  const [logout] = useMutation(LogoutDocument);
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await logout().catch(() => null);
    await fetch("/api/auth/session", { method: "DELETE" });
    await apollo.clearStore();
    router.replace("/login");
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
