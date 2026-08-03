import Link from "next/link";

import { AuthPageFooter, AuthPageHeader } from "../auth-shell";
import { SsoForm } from "./sso-form";

export const metadata = { title: "Single sign-on" };

export default function SsoPage() {
  return (
    <>
      <AuthPageHeader title="Single sign-on" subtitle="Use your organisation domain to continue." />

      <SsoForm />

      <AuthPageFooter>
        <Link href="/login" className="font-semibold text-mkt-navy hover:text-mkt-coral">
          Sign in with email
        </Link>
      </AuthPageFooter>
    </>
  );
}
