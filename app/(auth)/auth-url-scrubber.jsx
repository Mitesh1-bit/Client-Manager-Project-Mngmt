"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const SENSITIVE_PARAMS = new Set([
  "email",
  "password",
  "confirmPassword",
  "organizationName",
  "fullName",
]);

/**
 * Auth forms must never leave credentials in the URL (browser history, logs, referrers).
 * Scrub sensitive query params on mount if a native GET submit leaked them.
 */
export function AuthUrlScrubber() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let dirty = false;
    for (const key of searchParams.keys()) {
      if (SENSITIVE_PARAMS.has(key)) {
        dirty = true;
        break;
      }
    }
    if (!dirty) return;
    router.replace(pathname);
  }, [pathname, router, searchParams]);

  return null;
}
