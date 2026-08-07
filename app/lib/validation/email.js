import { z } from "zod";

/** Trim whitespace before validating — Zod v4 rejects padded addresses like "user@x.com ". */
export function workEmailField(emptyMessage = "Enter your work email.") {
  return z.string().trim().min(1, emptyMessage).email("That doesn't look like an email.");
}

export function portalEmailField(emptyMessage = "Enter your email.") {
  return z.string().trim().min(1, emptyMessage).email("That doesn't look like an email.");
}
