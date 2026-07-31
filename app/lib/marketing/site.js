export const SITE_NAME = "Meridian";
export const SITE_TAGLINE = "The operating system for agency client delivery";
export const SITE_DESCRIPTION =
  "Meridian unifies companies, projects, change requests, client portal access, retention sequences, and health scores in one platform built for modern agencies.";

export const metadataBase =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://meridian.example.com";

export const LOGIN_URL = "/login";
export const SIGNUP_URL = "/signup";

/** Primary nav — only routes with real, product-accurate content */
export const navPrimary = [
  { href: "/product", label: "Product" },
  { href: "/solutions", label: "Solutions" },
  { href: "/blog", label: "Guides" },
];

/** Product sections — anchors on /product */
export const navProducts = [
  { href: "/product", label: "Overview" },
  { href: "/product#companies", label: "Companies & contacts" },
  { href: "/product#projects", label: "Projects & delivery" },
  { href: "/product#change-requests", label: "Change requests" },
  { href: "/product#portal", label: "Client portal" },
  { href: "/product#retention", label: "Retention & health" },
];

/** Role-based workflows — anchors on /solutions */
export const navSolutions = [
  { href: "/solutions", label: "Overview" },
  { href: "/solutions#account-managers", label: "Account managers" },
  { href: "/solutions#project-managers", label: "Project managers" },
  { href: "/solutions#leadership", label: "Agency leadership" },
  { href: "/solutions#clients", label: "Client partners" },
];

/** App capabilities surfaced on the marketing site (matches backend phases) */
export const productFeatures = [
  {
    id: "companies",
    tone: "lime",
    title: "Companies & contacts",
    body: "Centralize every client account with contacts, tags, touchpoints, contracts, and health score history.",
    bullets: [
      "Company detail with projects, contacts, touchpoints, and docs",
      "Primary contact and portal invitation per account",
      "Health score history and at-risk filtering",
    ],
  },
  {
    id: "projects",
    tone: "sky",
    title: "Projects & delivery",
    body: "Run retainers with board, list, Gantt, and calendar views. Milestones, tasks, and budget on one project record.",
    bullets: [
      "Board, list, Gantt, calendar, and milestone plan views",
      "Tasks with assignees, due dates, and status",
      "Budget tracking tied to the project record",
    ],
  },
  {
    id: "change-requests",
    tone: "coral",
    title: "Change requests",
    body: "Scope changes move through impact assessment, internal approval, client approval, and implementation with a full audit trail.",
    bullets: [
      "Impact hours, cost, and timeline before approval",
      "Separate internal and client approval paths",
      "Audit log on every state transition",
    ],
  },
  {
    id: "portal",
    tone: "sun",
    title: "Client portal",
    body: "Client stakeholders approve milestones and change requests with the same status your internal team sees.",
    bullets: [
      "Portal login scoped to the client company",
      "Pending approvals and change-request comments",
      "Project visibility without internal tools",
    ],
  },
  {
    id: "retention",
    tone: "pink",
    title: "Retention & health",
    body: "Configurable health weights, at-risk dashboards, and retention sequences triggered by project and contract events.",
    bullets: [
      "Configurable health weights per organization",
      "Retention sequences with enrollment steps",
      "At-risk company dashboard for account reviews",
    ],
  },
];

export const solutionRoles = [
  {
    id: "account-managers",
    label: "Account managers",
    headline: "See every client before they go quiet",
    body: "Health scores roll up project status, touchpoints, open change requests, and contract renewal dates on the company record.",
    bullets: [
      "At-risk dashboard filtered by your threshold",
      "Touchpoint timeline on every company",
      "Retention sequences on project completion",
    ],
  },
  {
    id: "project-managers",
    label: "Project managers",
    headline: "Scope changes with guardrails, not guesswork",
    body: "Submit impact hours and cost before approvals route. Clients sign off in the portal; budget updates only when approved.",
    bullets: [
      "Change request state machine through implementation",
      "Milestone approvals with client visibility",
      "Board, list, Gantt, and calendar in one project",
    ],
  },
  {
    id: "leadership",
    label: "Agency leadership",
    headline: "Delivery and retention in one operating picture",
    body: "Replace scattered spreadsheets with a platform your teams use — with audit export when compliance requires it.",
    bullets: [
      "Organization-wide health and pipeline view",
      "Internal vs portal role separation",
      "GraphQL API for integrations",
    ],
  },
  {
    id: "clients",
    label: "Client partners",
    headline: "A portal focused on approvals",
    body: "Client stakeholders see pending milestones and change requests — without access to internal delivery tools.",
    bullets: [
      "Approve milestones and scope changes",
      "Comment threads on change requests",
      "No duplicate data entry for your team",
    ],
  },
];
