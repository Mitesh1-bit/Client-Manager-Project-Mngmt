import Link from "next/link";

import { SignupForm } from "./signup-form";

export const metadata = { title: "Create your workspace" };

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-title">Create your workspace</h1>
      <p className="mt-2 text-caption text-muted-foreground">
        Set up your agency, invite your team, and bring your clients into the portal.
      </p>

      <div className="mt-8">
        <SignupForm />
      </div>

      <p className="mt-8 text-caption text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline underline-offset-2">
          Sign in
        </Link>
      </p>
    </div>
  );
}
