/** Product guides — accurate descriptions of shipped Meridian capabilities */

export const blogPosts = [
  {
    slug: "reduce-change-request-chaos",
    title: "How structured change requests work in Meridian",
    description:
      "Dual internal and client approvals, impact assessment, and state transitions keep scope changes visible before work begins.",
    datePublished: "2026-07-15",
    dateModified: "2026-07-15",
    author: "Meridian Team",
    keywords: ["change requests", "agency project management", "client approvals"],
    directAnswer:
      "Meridian change requests use a state machine from submission through impact assessment, internal approval, client approval, and implementation — every transition is logged.",
    body: [
      "Change requests live on the project record. Project managers submit impact hours, cost, and timeline deltas before approvals route based on your organization rules.",
      "Internal approvers review impact assessment; client stakeholders approve through the portal with the same audit trail your team sees.",
      "Budget and timeline updates apply only after explicit approval, which reduces billing disputes at month end.",
    ],
  },
  {
    slug: "client-health-scores-explained",
    title: "Client health scores in Meridian",
    description:
      "How health scores combine project status, touchpoints, open change requests, contracts, and company status into one at-risk view.",
    datePublished: "2026-07-01",
    dateModified: "2026-07-01",
    author: "Meridian Team",
    keywords: ["client retention", "health score", "account management"],
    directAnswer:
      "A client health score is a weighted index of delivery signals — project health, touchpoints, open change requests, contract renewal proximity, and account status.",
    body: [
      "Health scoring uses configurable weights per organization. Scores sync to the company record; history is append-only for reporting.",
      "The at-risk dashboard filters companies below your threshold so account reviews start with clients that need attention.",
      "Advisory summaries may annotate score records but do not replace the numeric score or automate churn decisions.",
    ],
  },
];

export function getBlogPost(slug) {
  return blogPosts.find((post) => post.slug === slug) ?? null;
}
