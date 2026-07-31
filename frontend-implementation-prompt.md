# Frontend Implementation Prompt — Client & Project Management Platform

Use this as the initial prompt for Claude Code (or paste into a fresh session) to build **only the frontend**. The backend (FastAPI + Strawberry GraphQL) is being built separately by someone else — do not create backend code, resolvers, or database models. Treat the GraphQL schema as a contract you consume, not something you own.

---

## 1. Role & Scope

You are building the **frontend only** for a multi-tenant client/project management platform (agencies/consultancies managing companies → contacts → projects → planning → change requests → retention). A separate engineer owns the FastAPI + Strawberry GraphQL backend. Your job is a Next.js 16 (JavaScript, **no TypeScript**) application that is visually polished, fast, accessible, and production-grade — not a rough scaffold. Every screen you ship should look and feel like a real, considered product, not a wireframe.

Do not touch, assume, or invent backend implementation details beyond the GraphQL schema contract below. If a query/mutation you need isn't in the contract, add it to a running `NEEDED_SCHEMA_CHANGES.md` file instead of guessing at resolver behavior.

## 2. Tech Stack (fixed — do not substitute)

| Layer | Choice |
|---|---|
| Framework | Next.js 16, App Router, React Server Components, Turbopack |
| Language | JavaScript (ES2022+) only — JSDoc comments for editor hints, no `.ts`/`.tsx` |
| GraphQL client/codegen | GraphQL Code Generator (`client` preset) + Apollo Client |
| Client state | Zustand (UI-only state — drag state, builder state, modals) |
| Styling | Tailwind CSS + shadcn/ui + Radix primitives |
| Tables | TanStack Table (server-side pagination/sort/filter via GraphQL variables) |
| Forms | React Hook Form + Zod resolver (client-side validation only; server is source of truth) |
| Charts | Tremor or Recharts |
| Testing | Vitest (unit) + Playwright (E2E) |
| Auth | JWT access token + httpOnly refresh cookie issued by the backend; Next.js middleware protects routes |

## 3. Working Without a Live Backend

The backend is being built in parallel. To avoid blocking:

1. Start from the GraphQL contract in Section 8 below (Query/Mutation shape). Generate a local **schema stub file** (`schema.graphql`) matching it, including realistic input/output types inferred from the data model in Section 6 (ask me for the full data model if you need field-level detail — don't invent business fields that aren't implied by the feature list).
2. Point GraphQL Code Generator at that local schema stub for now, not a live endpoint.
3. Use **Apollo Client's `MockedProvider`** or a lightweight local mock server (e.g. `graphql-yoga` with resolvers returning realistic fixture data) so every screen is fully interactive and demoable before the real backend exists.
4. Keep all fixtures in `lib/mocks/` so they're trivial to delete once the real endpoint is live — swapping to the real backend should mean changing one env var (`NEXT_PUBLIC_GRAPHQL_URL`) and deleting the mock layer, not rewriting components.
5. Flag any assumption you make about a field/type that isn't explicitly in the plan, in `NEEDED_SCHEMA_CHANGES.md`, so it can be reconciled with the backend engineer.

## 4. Project Structure

```
app/
├─ (marketing)/
├─ (auth)/login, /signup, /sso
├─ (dashboard)/                       internal team
│  ├─ page.jsx                        KPI dashboard
│  ├─ companies/[id]/                 overview | contacts | projects | touchpoints | docs | change-log
│  ├─ projects/[id]/                  board | list | gantt | calendar | milestones | change-requests
│  ├─ change-requests/                org-wide queue: submitted | pending approval | overdue
│  ├─ retention/                      sequences builder | touchpoint calendar | at-risk dashboard
│  ├─ search/                         global search results across all entities
│  └─ settings/                       org, users, roles, templates, tags, approval thresholds, integrations
├─ (client-portal)/                   external clients (separate layout, separate auth scope)
│  ├─ projects/[id]/                  status view, milestone approvals
│  ├─ change-requests/                submit new, track existing
│  └─ documents/                      deliverables & contracts
├─ components/
│  ├─ ui/                             shadcn primitives
│  └─ domain/                         <CompanyCard>, <HealthScoreBadge>, <ChangeRequestStatusBadge>,
│                                     <MilestoneApprovalPanel>, <TouchpointTimeline>, etc.
└─ lib/
   ├─ graphql/                        generated documents + hooks (codegen output) + apollo-client.js
   └─ mocks/                          local fixtures + mock schema/resolvers (delete once backend is live)
```

- **Server Components by default.** Fetch initial page data server-side via GraphQL. Only use Client Components where there's real interactivity: Kanban drag-and-drop, the sequence builder, the change-request form, charts, optimistic status changes.
- **Client portal is a fully separate route group** with its own layout, nav, and visual treatment — it should not look like a reskinned internal dashboard. External clients only ever see their own company's data.
- No Server Actions for business logic — everything goes through GraphQL.

## 5. GraphQL Contract to Build Against

```graphql
type Query {
  company(id: ID!): Company
  companies(filter: CompanyFilter, page: PageInput): CompanyConnection!
  project(id: ID!): Project
  projects(filter: ProjectFilter, page: PageInput): ProjectConnection!
  changeRequests(projectId: ID, status: ChangeRequestStatus): [ChangeRequest!]!
  retentionSequences: [RetentionSequence!]!
  me: User
}

type Mutation {
  createCompany(input: CompanyInput!): Company!
  updateCompany(id: ID!, input: CompanyInput!): Company!
  createProject(input: ProjectInput!): Project!
  createTask(input: TaskInput!): Task!
  createMilestone(input: MilestoneInput!): Milestone!
  createChangeRequest(input: ChangeRequestInput!): ChangeRequest!
  assessChangeRequest(id: ID!, input: ImpactAssessmentInput!): ChangeRequest!
  decideChangeRequest(id: ID!, decision: ChangeRequestDecision!): ChangeRequest!
  enrollInSequence(sequenceId: ID!, companyId: ID!): SequenceEnrollment!
  logTouchpoint(input: TouchpointInput!): Touchpoint!
  login(email: String!, password: String!): AuthPayload!
  refreshToken: AuthPayload!
  logout: Boolean!
}
```

Nested data (contacts, projects, tasks, milestones under a company/project) should be modeled as nested fields on `Company`/`Project`, not separate top-level queries — that's how GraphQL resolves them in one round trip. Build your fixture/mock schema accordingly.

## 6. What "Fantastic" Means Here — Quality Bar

This is the most important section. Don't ship a functional-but-generic admin panel. Specifically:

- **Every list/table view** needs real empty states, loading skeletons (not spinners), and error states with a retry action — not blank screens.
- **Kanban board, Gantt/Timeline, and Calendar views** for projects (Section 3.C) should feel native and smooth — real drag-and-drop with optimistic reordering, not a static mockup.
- **The change-request approval flow and milestone approval flow** are the two flows clients actually touch — invest disproportionate polish here: clear status, clear next action, no ambiguity about whose turn it is.
- **Health score and project health indicators** (Section 3.A/C) should be genuinely readable at a glance — color, trend arrow, sparkline — not just a number in a badge.
- **Responsive down to mobile** for the client portal specifically — external clients will often check status from a phone.
- **Consistent design system**: don't let each page invent its own spacing/type scale. Establish tokens (spacing, radius, type, color for status states — on-track/at-risk/delayed, approved/pending/rejected) once, reuse everywhere.
- **Micro-interactions**: optimistic UI on status changes and approvals, subtle transitions, no layout shift on data load.
- Accessibility isn't optional: keyboard nav on the Kanban and forms, proper ARIA on custom components, color contrast that works for the status badges specifically (don't rely on color alone for on-track/at-risk/delayed).

## 7. Build Order (frontend-only phases, mirrors the master plan's roadmap)

1. **Foundation**: Next.js scaffold, Tailwind + shadcn setup, design tokens, auth pages + middleware route protection (against mocked `login`/`me`), Apollo Client + codegen wired to the local mock schema, dashboard shell + nav for both `(dashboard)` and `(client-portal)` route groups.
2. **Companies & Contacts**: list + detail views, CRUD forms, activity timeline — this is your reference pattern for every other module, so get the component conventions right here before moving on.
3. **Projects & Planning**: List/Kanban/Gantt/Calendar views, tasks with subtasks and dependencies, milestones.
4. **Client Portal + Approvals**: portal auth/layout, project status view, milestone/deliverable approval flow.
5. **Change Requests**: full lifecycle UI, impact assessment form (PM-facing), approval routing UI, org-wide queue/dashboard.
6. **Retention**: sequence builder, enrollment UI, touchpoint logging, at-risk dashboard.
7. **Polish pass**: loading/error/empty states audit across every screen, responsive audit, accessibility audit, Playwright E2E for the critical flows (create project, submit + approve change request, complete touchpoint, milestone approval).

Confirm each phase with me before moving to the next, and show me the mock data/fixtures you're using so I can sanity-check them against what the backend will actually return.

## 8. Testing Expectations

- Vitest unit tests for any non-trivial logic (form validation, status-derivation helpers, date/timeline math).
- Playwright E2E covering the four critical flows named above, run against the mock GraphQL layer.
- Don't chase 100% coverage — prioritize the flows a client or PM would actually break the product with.
