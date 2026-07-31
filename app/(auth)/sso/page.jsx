import Link from "next/link";

import { SsoForm } from "./sso-form";

export const metadata = { title: "Single sign-on" };

export default function SsoPage() {
  return (
    <div>
      <h1 className="font-mkt-display text-title text-mkt-navy">Single sign-on</h1>
      <p className="mt-2 text-caption text-mkt-navy/70">
        Sign in with your organisation&apos;s identity provider.
      </p>

      <div className="mt-8">
        <SsoForm />
      </div>

      <p className="mt-8 text-caption text-mkt-navy/70">
        Prefer a password?{" "}
        <Link href="/login" className="font-medium text-mkt-cta underline underline-offset-2 hover:text-mkt-cta-hover">
          Sign in with email
        </Link>
      </p>
    </div>
  );
}
