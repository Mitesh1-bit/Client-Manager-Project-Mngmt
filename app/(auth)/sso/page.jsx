import Link from "next/link";

import { SsoForm } from "./sso-form";

export const metadata = { title: "Single sign-on" };

export default function SsoPage() {
  return (
    <div>
      <h1 className="text-title">Single sign-on</h1>
      <p className="mt-2 text-caption text-muted-foreground">
        Sign in with your organisation&apos;s identity provider.
      </p>

      <div className="mt-8">
        <SsoForm />
      </div>

      <p className="mt-8 text-caption text-muted-foreground">
        Prefer a password?{" "}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Sign in with email
        </Link>
      </p>
    </div>
  );
}
