export const SITE_NAME = "Meridian";
export const SITE_TAGLINE = "The operating system for agency client delivery";
export const SITE_DESCRIPTION =
  "Meridian unifies companies, projects, change requests, client portal access, retention sequences, and health scores in one platform built for modern agencies.";

export const metadataBase =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://meridian.example.com";

export const LOGIN_URL = "/login";
export const SIGNUP_URL = "/signup";

/** Homepage hero & section copy */
export const heroContent = {
  headline: "Agency client delivery, one flow",
  subhead:
    "Everyone on your agency team can run client delivery on Meridian. Companies, projects, change requests, and approvals — yours to manage.",
  primaryCta: { href: SIGNUP_URL, label: "Create account" },
  secondaryCta: { href: "/product", label: "Explore product" },
};

export const toolCarouselContent = {
  title: "Modules or workflows? Both.",
  subtitle:
    "Companies, delivery, change control, client portal, and retention — every module your agency needs.",
  ctaHref: SIGNUP_URL,
  ctaLabel: "Create account",
};

export const beforeAfterContent = {
  title: "Meridian in the wild",
  subtitle: "See what changes when email threads become one operating system.",
};

export const playLearnContent = {
  title: "Build to deliver",
  subtitle: "Configure, approve, repeat. Meridian builds a faster agency.",
  ctaHref: SIGNUP_URL,
  ctaLabel: "Get started free",
};

/** Product page — unique copy & scenarios (not reused on homepage) */
export const productPageContent = {
  hero: {
    title: "The agency delivery stack",
    description:
      "Five modules share one record graph — from the client account to portal approvals and renewal signals. No duplicate entry, no lost context.",
    pills: ["5 connected modules", "Shared audit trail", "Client portal included"],
  },
  platformFlow: {
    title: "One graph. Every handoff.",
    subtitle: "Meridian links company records to delivery, change control, client actions, and retention — so nothing lives in a silo.",
  },
  scenarios: {
    title: "Three moments in an agency week",
    subtitle: "Real scenarios from a 12-person shop running retainers — not generic feature lists.",
    items: [
      {
        id: "monday",
        label: "Monday · Kickoff",
        headline: "Studio Arc signs — project live before lunch",
        story:
          "Your account lead creates the Studio Arc company record, attaches the signed SOW, and spins up the Q2 brand retainer. The board view is ready for the delivery pod before the kickoff call ends.",
        beats: [
          "Company + contacts + contract on one record",
          "Project board seeded from retainer template",
          "Portal invite sent to the client partner",
        ],
        accent: "from-mkt-lime/30 to-mkt-sky/20",
      },
      {
        id: "wednesday",
        label: "Wednesday · Scope shift",
        headline: "CR #52 assessed, approved, and budget-safe",
        story:
          "Design requests extra homepage sections mid-sprint. The PM logs impact hours and cost, routes internal approval, and the client signs off in the portal — budget updates only after explicit approval.",
        beats: [
          "Impact hours + cost captured before work starts",
          "Internal then client approval on one CR thread",
          "Audit log shows who approved what and when",
        ],
        accent: "from-mkt-coral/25 to-mkt-sun/20",
      },
      {
        id: "friday",
        label: "Friday · Renewal radar",
        headline: "Summit Co. flagged before the QBR",
        story:
          "Health scores dipped after two missed touchpoints and an open change request. Leadership sees Summit on the at-risk dashboard Friday morning — retention sequence enrolls automatically.",
        beats: [
          "Health weights combine delivery + touchpoints + open CRs",
          "At-risk filter surfaces accounts before renewal",
          "Retention sequence triggered from project events",
        ],
        accent: "from-mkt-sky/30 to-[#2563eb]/15",
      },
    ],
  },
  atlas: {
    title: "Five layers, one graph",
    subtitle: "Scroll through each layer — full-width sections, not a feature grid.",
  },
  proof: {
    title: "Built for agency reality",
    items: [
      { stat: "1", label: "Record per client", detail: "Company is the root — projects and CRs nest underneath." },
      { stat: "4", label: "CR approval states", detail: "Draft → impact → internal → client → implement." },
      { stat: "0", label: "Duplicate portal logins", detail: "Contacts inherit company scope automatically." },
    ],
  },
};

export const faqContent = {
  title: "Questions? Answered.",
  subtitle: "Everything you need to know before signing in.",
  items: [
    {
      question: "How much does Meridian cost?",
      answer:
        "Create an account to start using Meridian in your organization. Contact us for enterprise pricing if you need custom onboarding or compliance review.",
    },
    {
      question: "How do I sign up?",
      answer:
        "Click Create account, set up your organization, and invite your team. Client partners get portal access through contacts on each company record.",
    },
    {
      question: "Who uses the client portal?",
      answer:
        "Client stakeholders approve milestones and change requests in a portal scoped to their company — without access to internal delivery tools.",
    },
    {
      question: "How do change requests work?",
      answer:
        "Scope changes move through impact assessment, internal approval, client approval, and implementation. Every state transition is logged on the audit trail.",
    },
    {
      question: "What about data privacy?",
      answer:
        "Your organization data is scoped per account. Internal users and portal contacts see only what their role permits. See our privacy policy for details.",
    },
  ],
};

export const logoMarqueeItems = [
  "Northwind",
  "Studio Arc",
  "Helix Digital",
  "Paper & Pixel",
  "Summit Agency",
  "Blue Harbor",
  "Fieldwork",
  "Meridian Labs",
];

export const bentoFeatures = [
  {
    title: "Change control",
    description:
      "Scope changes move through impact assessment, internal approval, and client sign-off — with a full audit trail on every transition.",
    tone: "lime",
    illustration: "agents",
    href: "/product#change-requests",
  },
  {
    title: "Delivery pipeline",
    description:
      "Board, list, Gantt, and calendar views on one project record. Milestones, tasks, and budget stay linked to the client account.",
    tone: "coral",
    illustration: "pipelines",
    href: "/product#projects",
  },
  {
    title: "Client portal",
    description:
      "Client stakeholders approve milestones and change requests in a focused portal — the same status your team sees internally.",
    tone: "sky",
    illustration: "portal",
    href: "/product#portal",
  },
];

export const whyMeridianContent = {
  badge: "New",
  title: "Why modern agency teams choose Meridian",
  subtitle:
    "Replace email threads and spreadsheets with one operating system for delivery, approvals, and retention.",
  items: [
    {
      title: "Scale change requests with guardrails",
      description:
        "Submit impact hours, cost, and timeline before approvals route. Budget updates apply only after explicit client sign-off.",
      href: "/product#change-requests",
      linkLabel: "Explore change requests",
      mockupTitle: "Open change requests",
    },
    {
      title: "Keep every client account in one place",
      description:
        "Companies, contacts, touchpoints, contracts, and health scores on a single record — so account reviews start with context.",
      href: "/product#companies",
      linkLabel: "Explore companies",
      mockupTitle: "Account pipeline",
    },
    {
      title: "Empower clients without exposing internal tools",
      description:
        "Portal login scoped to the client company. Approve milestones, comment on change requests, and skip duplicate data entry.",
      href: "/product#portal",
      linkLabel: "Explore client portal",
      mockupTitle: "Portal activity",
    },
    {
      title: "Spot at-risk accounts before renewal",
      description:
        "Configurable health weights combine project status, touchpoints, and open CRs into one score — filtered on your at-risk dashboard.",
      href: "/product#retention",
      linkLabel: "Explore retention",
      mockupTitle: "Health signals",
    },
  ],
};

export const personaShowcaseContent = {
  title: "Made for the way you work",
  subtitle: "Select a role to see how Meridian fits your workflow.",
  personas: [
    {
      id: "account-managers",
      label: "Account managers",
      headline: "See every client before they go quiet",
      cta: "Solutions for account managers",
      href: "/solutions#account-managers",
      activeTab: 0,
      terrain: "lime",
      mockup: {
        windowTitle: "Meridian — Account health",
        stats: [
          { label: "At risk", value: "3", tone: "bg-mkt-block-coral/80" },
          { label: "Touchpoints", value: "18", tone: "bg-mkt-block-sky" },
          { label: "Renewals", value: "6", tone: "bg-mkt-block-sun" },
        ],
        rows: [
          { title: "Northwind — health 42", status: "In review", pct: 42 },
          { title: "Studio Arc renewal", status: "Approved", pct: 100 },
          { title: "Summit QBR prep", status: "Draft", pct: 55 },
        ],
      },
      markers: [
        { label: "Project manager", tone: "sky", className: "left-2 top-8 md:left-8" },
        { label: "Client partner", tone: "pink", className: "right-2 top-16 md:right-12" },
        { label: "Leadership", tone: "sun", className: "left-4 bottom-32 md:left-16" },
      ],
      useCase: {
        tag: "Popular",
        title: "At-risk dashboard",
        description: "Health scores roll up delivery signals on every company record.",
      },
    },
    {
      id: "project-managers",
      label: "Project managers",
      headline: "Scope changes with guardrails, not guesswork",
      cta: "Solutions for project managers",
      href: "/solutions#project-managers",
      activeTab: 1,
      terrain: "sky",
      mockup: {
        windowTitle: "Meridian — Change requests",
        stats: [
          { label: "Open CRs", value: "8", tone: "bg-mkt-block-lime" },
          { label: "In review", value: "5", tone: "bg-mkt-block-sky" },
          { label: "Blocked", value: "2", tone: "bg-mkt-block-coral/80" },
        ],
        rows: [
          { title: "Scope expansion — Phase 2", status: "In review", pct: 68 },
          { title: "Timeline extension", status: "In review", pct: 45 },
          { title: "Budget reallocation", status: "Draft", pct: 20 },
        ],
      },
      markers: [
        { label: "Client partner", tone: "coral", className: "left-0 bottom-36 md:left-8" },
      ],
      useCase: {
        tag: "Workflow",
        title: "Change request flow",
        description: "Impact assessment before internal and client approvals.",
      },
    },
    {
      id: "leadership",
      label: "Agency leadership",
      headline: "Delivery and retention in one operating picture",
      cta: "Solutions for leadership",
      href: "/solutions#leadership",
      activeTab: 0,
      terrain: "sun",
      mockup: {
        windowTitle: "Meridian — Org overview",
        stats: [
          { label: "Projects", value: "47", tone: "bg-mkt-block-sky" },
          { label: "Clients", value: "22", tone: "bg-mkt-block-lime" },
          { label: "Health avg", value: "78", tone: "bg-mkt-block-sun" },
        ],
        rows: [
          { title: "Delivery pipeline Q3", status: "Approved", pct: 100 },
          { title: "Retention sequences", status: "In review", pct: 80 },
          { title: "Portal adoption", status: "In review", pct: 62 },
        ],
      },
      markers: [
        { label: "Project manager", tone: "sky", className: "right-6 top-20" },
      ],
      useCase: {
        title: "Org-wide health view",
        description: "Pipeline and retention metrics without scattered spreadsheets.",
      },
    },
    {
      id: "clients",
      label: "Client partners",
      headline: "A portal focused on approvals",
      cta: "Solutions for client partners",
      href: "/solutions#clients",
      activeTab: 2,
      terrain: "pink",
      mockup: {
        windowTitle: "Meridian — Client portal",
        stats: [
          { label: "Pending", value: "3", tone: "bg-mkt-block-sun" },
          { label: "Approved", value: "11", tone: "bg-mkt-block-lime" },
          { label: "Comments", value: "7", tone: "bg-mkt-block-sky" },
        ],
        rows: [
          { title: "Milestone 4 sign-off", status: "In review", pct: 90 },
          { title: "Brand asset approval", status: "Approved", pct: 100 },
          { title: "Scope change #12", status: "In review", pct: 60 },
        ],
      },
      markers: [
      ],
      useCase: {
        tag: "Portal",
        title: "Pending approvals",
        description: "Approve milestones and scope changes without internal tools.",
      },
    },
  ],
};

export const speedComparisonContent = {
  title: "3× faster client approvals",
  subtitle:
    "Stop chasing email threads. Meridian routes change requests from submission to client sign-off in one portal.",
  manualLabel: "Spreadsheets & email",
  meridianLabel: "Meridian",
};

/** Primary nav — only routes with real, product-accurate content */
export const navPrimary = [
  { href: "/product", label: "Product" },
  { href: "/solutions", label: "Solutions" },
  { href: "/blog", label: "Guides" },
];

/** Product sections — anchors on /product */
export const navProducts = [
  {
    href: "/product",
    label: "Overview",
    description: "Five modules on one delivery graph",
    accent: "lime",
  },
  {
    href: "/product#companies",
    label: "Companies & contacts",
    description: "Accounts, contracts, and health in one record",
    accent: "lime",
  },
  {
    href: "/product#projects",
    label: "Projects & delivery",
    description: "Board, milestones, budget, and Gantt",
    accent: "sky",
  },
  {
    href: "/product#change-requests",
    label: "Change requests",
    description: "Impact-first scope with approval guardrails",
    accent: "coral",
  },
  {
    href: "/product#portal",
    label: "Client portal",
    description: "Approvals and visibility without email chaos",
    accent: "pink",
  },
  {
    href: "/product#retention",
    label: "Retention & health",
    description: "Scores, sequences, and renewal signals",
    accent: "sun",
  },
];

/** Role-based workflows — anchors on /solutions */
export const navSolutions = [
  {
    href: "/solutions",
    label: "Overview",
    description: "How each role runs delivery on Meridian",
    accent: "navy",
  },
  {
    href: "/solutions#account-managers",
    label: "Account managers",
    description: "Health, renewals, and client relationships",
    accent: "lime",
  },
  {
    href: "/solutions#project-managers",
    label: "Project managers",
    description: "Boards, CRs, and milestone approvals",
    accent: "sky",
  },
  {
    href: "/solutions#leadership",
    label: "Agency leadership",
    description: "Portfolio visibility and delivery metrics",
    accent: "sun",
  },
  {
    href: "/solutions#clients",
    label: "Client partners",
    description: "Portal sign-offs without the inbox thread",
    accent: "pink",
  },
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

export const roleStackSectionContent = {
  eyebrow: "Permission layers",
  title: "Roles on autopilot",
  subtitle:
    "Four permission layers on one company graph — cards rotate every few seconds. Click a role below to jump.",
  points: [
    {
      title: "One company graph",
      body: "Health scores, change requests, and milestones roll up from the same client record — no duplicate spreadsheets.",
    },
    {
      title: "Role-aware by default",
      body: "Account managers, PMs, leadership, and client partners each see a tailored slice of the same underlying data.",
    },
    {
      title: "Portal without leakage",
      body: "Client stakeholders approve scope and milestones in the portal while internal delivery tools stay hidden.",
    },
  ],
};
