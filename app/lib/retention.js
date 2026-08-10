/** Copy and helpers for the post-project retention workflow. */

export const RETENTION_MODULE_DESCRIPTION =
  "Post-project client retention through scheduled follow-up calls and emails — available only after delivery is complete.";

export const RETENTION_LOCKED_DESCRIPTION =
  "Retention unlocks when at least one project is completed end-to-end and no projects are still in progress.";

export function isRetentionEligible(eligibility) {
  return eligibility?.eligible === true;
}

export function retentionEligibilityMessage(eligibility) {
  if (!eligibility) return RETENTION_LOCKED_DESCRIPTION;
  return eligibility.reason ?? RETENTION_LOCKED_DESCRIPTION;
}
