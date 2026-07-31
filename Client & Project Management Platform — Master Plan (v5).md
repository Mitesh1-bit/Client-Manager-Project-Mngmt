---
title: Client & Project Management Platform — Master Plan (v5)

---

# Client & Project Management Platform — Master Plan (v5)
### Next.js 16 (JavaScript) + FastAPI/Python (GraphQL) + PostgreSQL + Celery

**Changelog from v4:**
1. **API layer is GraphQL, not REST.** FastAPI now hosts a single **Strawberry GraphQL** schema at `/graphql` instead of a versioned REST API. Section 4.1, 4.2, 5, 8, and 9 below are reworked accordingly.
2. **`openapi-zod-client` is dropped.** With GraphQL, the schema itself is the contract: the frontend's generated client (via **GraphQL Code Generator**, JS output) is typed against the live schema, and **Apollo Client** replaces TanStack Query as the data-fetching layer against `/graphql`. This is what now replaces compile-time type safety in a JS-only frontend — a query that references a field the schema doesn't have fails codegen/CI, not silently at runtime.
3. **Actor table simplified**: **Super Admin** and **Organization Owner** are removed from Section 2.1 — not needed for this platform's actor model.
4. Backend fundamentals (SQLAlchemy, Celery+Redis, WorkOS, etc.) are otherwise unchanged from v4/v2.
5. Everything else — feature list, data model, process-flow logic, roadmap — is unchanged.

If you want compile-time type safety back at some point, TypeScript is a strict superset of JS and can be adopted incrementally file-by-file later without a rewrite — worth keeping in mind, not something to decide now.

---

## 1. Product Overview

A multi-tenant, enterprise-ready platform for agencies/consultancies/service businesses to manage the full client lifecycle:

**Companies → Contacts → Projects → Planning (Phases → Milestones → Tasks) → Execution → Change Requests → Retention/Renewal**

Built as **two services in one monorepo**: a Next.js 16 (JavaScript) frontend and a FastAPI (Python) backend, each independently deployable, communicating over a single **GraphQL API**.

---

## 2. Actors & Personas

### 2.1 Internal (Agency-side) Actors

| Actor | Description | Key capabilities |
|---|---|---|
| **Admin** | Operational admin | User management, role assignment, approval thresholds, integrations, templates |
| **Account Manager / Account Owner** | Owns the relationship with specific companies | Retention sequences, touchpoints, health score monitoring, renewal ownership |
| **Project Manager (PM)** | Owns delivery of one or more projects | Planning, task assignment, change request triage & impact assessment, milestone sign-off |
| **Team Member / Contributor** | Executes assigned work | Task updates, time logging, comments, file uploads |
| **Finance/Billing Admin** *(optional role)* | Manages commercial side | Budgets, invoices, contract values, payment status |
| **Read-only / Executive Viewer** | Leadership, no edit rights | Dashboards, reports, exports only |

### 2.2 External Actors

| Actor | Description | Key capabilities |
|---|---|---|
| **Client Primary Contact** | Main spokesperson for a company | View project status, raise change requests, approve milestones/deliverables, invite other contacts, view invoices |
| **Client Secondary Contact / Stakeholder** | Additional stakeholder, configurable permission level | View-only by default; can be granted "raise request" permission |

### 2.3 System Actors

| Actor | Description |
|---|---|
| **Automation Engine** (Celery workers) | Executes retention sequence steps, escalations, health-score recalculation, deadline reminders |

---

## 3. Complete Feature List

Unchanged from v2/v3. `[Core]` = MVP. `[Extended]` = production-hardening / competitive-parity.

### A. Company & Account Management
- **[Core]** Company CRUD, industry/segment tagging, logo, address, size, timezone
- **[Core]** Company status lifecycle: Lead → Active → Paused → Churned
- **[Core]** Account owner assignment
- **[Core]** Health score (auto-calculated) with historical trend
- **[Extended]** Company hierarchy (parent/subsidiary companies)
- **[Extended]** Custom fields per company (org-configurable schema)
- **[Extended]** Duplicate detection/merge tool
- **[Extended]** Company-level activity timeline (all touchpoints, projects, change requests, notes in one feed)

### B. Contact / Client Management
- **[Core]** Contact CRUD linked to company, primary-contact flag
- **[Core]** Role/title, department, communication preferences (channel, timezone, best time to contact)
- **[Core]** Contact relationship timeline (touchpoints, projects, change requests in one feed)
- **[Extended]** CSV bulk import and export
- **[Extended]** Contact-level engagement score (open rates, response times)
- **[Extended]** Org chart view per company (reporting lines among contacts)
- **[Extended]** Do-not-contact / communication consent flags (compliance)

### C. Project Management
- **[Core]** Project CRUD, status (Planning/Active/On Hold/Completed/Cancelled), priority
- **[Core]** Budget vs actual cost tracking
- **[Core]** Project team assignment
- **[Core]** Multiple views: List, Kanban, Gantt/Timeline, Calendar
- **[Extended]** Project templates (spin up a standard phase/milestone/task structure instantly)
- **[Extended]** Project risk register / RAID log (Risks, Assumptions, Issues, Dependencies)
- **[Extended]** Project health indicator (on-track / at-risk / delayed), computed per project and rolled up per phase — separate from client health score
- **[Extended]** Portfolio view across all projects for leadership

### D. Project Planning & Execution
- **[Core]** Three-level plan hierarchy: Phases → Milestones → Tasks. Milestones mark key dates/deliverables inside a phase (e.g. "Design sign-off") and are what the client approves (Section 7.5); tasks are the work items underneath.
- **[Core]** Tasks with subtasks, assignees, priority, estimated vs actual hours, planned vs actual dates
- **[Core]** Task dependencies (finish-to-start etc.)
- **[Core]** Workload/resource view across team members
- **[Extended]** Time tracking with timer + manual entry, exportable timesheets
- **[Extended]** Recurring tasks
- **[Extended]** Capacity planning (compare allocated hours vs team availability)
- **[Extended]** Sprint/iteration support for teams running agile delivery

### E. Change Request Management *(client-initiated project changes)*
- **[Core]** Client-raised change requests from the portal (scope, timeline, or budget change)
- **[Core]** Change request types: Scope Addition, Scope Reduction, Timeline Change, Budget Change, Bug-fix/Correction, Other
- **[Core]** Impact assessment fields (hours, cost delta, timeline delta) filled by PM
- **[Core]** Approval routing (internal approval, client approval, or both — configurable by threshold)
- **[Core]** Status lifecycle with full audit trail (state machine in Section 7.3)
- **[Core]** Auto-generation of tasks/phase updates once approved, with optional auto-adjustment of `projects.budget` / `end_date`
- **[Extended]** Change request comment thread (client ↔ PM clarification)
- **[Extended]** Attachments on change requests (screenshots, briefs)
- **[Extended]** Change Request dashboard: open, pending approval, overdue-for-response, aging report
- **[Extended]** E-signature on approval for high-value change orders
- **[Extended]** Auto-generated Change Order PDF for client records
- **[Extended]** Revision-round cap alert (escalate to manager after N revision loops)

### F. Client Retention & Touchpoints
- **[Core]** Reusable touchpoint sequence templates (e.g. Onboarding, Quarterly Check-in, Renewal)
- **[Core]** Sequence steps: channel (email/call/meeting/internal task), offset days, owner role, message template
- **[Core]** Enrollment engine (manual or auto-triggered: on company created, on project completed, on renewal approaching)
- **[Core]** Touchpoint logging with outcome (positive/neutral/at-risk) and notes
- **[Core]** Overdue detection & escalation
- **[Extended]** Client health scoring model (configurable weightings: touchpoint completion, project status, response time, NPS)
- **[Extended]** At-risk client dashboard with churn-probability signal
- **[Extended]** NPS / CSAT survey step type within sequences
- **[Extended]** Renewal/contract expiry tracking with auto-enrollment into a Renewal sequence
- **[Extended]** Win-back sequences for churned accounts

### G. Client Portal (external-facing)
- **[Core]** Scoped login for client contacts (see only their own company's data)
- **[Core]** Project status view (read-only progress, timeline, phase/milestone status)
- **[Core]** Raise a Change Request
- **[Core]** Approve/reject milestones & deliverables
- **[Extended]** View & pay invoices
- **[Extended]** Download contracts/documents
- **[Extended]** Branded/white-labeled portal per org (custom logo/domain)
- **[Extended]** Multi-contact access management (primary contact invites teammates)

### H. Collaboration & Communication
- **[Core]** Comments with @mentions on tasks, projects, companies, change requests — the single, shared "notes" mechanism for the whole platform
- **[Core]** Activity feed per entity
- **[Extended]** Internal-only notes vs client-visible notes distinction (a flag on the comment, not a separate table)
- **[Extended]** Threaded discussions with file attachments
- **[Extended]** Meeting notes capture linked to touchpoints

### I. Document & Contract Management
- **[Core]** File upload/attachment on companies, projects, tasks, change requests
- **[Core]** Version history on documents/deliverables
- **[Extended]** Contract records with start/end dates, auto-renewal flags
- **[Extended]** E-signature integration for contracts and change orders
- **[Extended]** Document approval workflow (client sign-off on deliverables)

### J. Billing, Invoicing & Financials
- **[Extended]** Milestone-based or time-based invoicing
- **[Extended]** Invoice generation, status tracking (draft/sent/paid/overdue)
- **[Extended]** Budget burn-down chart per project
- **[Extended]** Change-order cost roll-up into project budget
- **[Extended]** Integration with accounting tools (QuickBooks/Xero)

### K. Reporting & Analytics
- **[Core]** Org-level KPI dashboard: active projects, at-risk clients, upcoming/overdue touchpoints
- **[Core]** Project status reports
- **[Extended]** Retention/churn analytics (sequence completion rate, health score trend)
- **[Extended]** Team utilization & workload reports
- **[Extended]** Change request analytics (volume, avg approval time, cost impact by client)
- **[Extended]** Custom report builder + scheduled email exports
- **[Extended]** BI export (CSV/API for external tools like Looker/PowerBI)

### L. Notifications & Alerts
- **[Core]** In-app + email notifications (task assigned, touchpoint due, change request submitted/approved)
- **[Core]** Overdue escalation rules (configurable thresholds)
- **[Extended]** Digest emails (daily/weekly summary per role)
- **[Extended]** Slack/Teams notification integration
- **[Extended]** SMS alerts for high-priority items (enterprise tier)

### M. Automation & Workflow Engine
- **[Core]** Trigger-based retention enrollment (on company created, on project completed, on renewal approaching)
- **[Core]** Auto-escalation of overdue touchpoints/change requests
- **[Extended]** Configurable workflow rules (if/then automation builder) for approvals, notifications, status transitions
- **[Extended]** Webhooks out to external systems on key events

### N. Administration & Settings
- **[Core]** User management, role assignment, invite flow
- **[Core]** Org settings: branding, working hours/timezone, approval thresholds
- **[Core]** Sequence/template library management (retention sequences + project/plan templates)
- **[Core]** Platform-wide tags & saved filtered views, usable on companies, contacts, and projects alike
- **[Extended]** Custom roles/permission builder (beyond fixed RBAC roles)
- **[Extended]** Feature flags per org (staged rollout)
- **[Extended]** API key management UI for integrations

### O. Security, Compliance & Audit
- **[Core]** Row-Level Security multi-tenancy, RBAC enforcement
- **[Core]** Full audit log (who changed what, when) on core entities
- **[Core]** Soft delete (`deleted_at`) on core entities instead of hard delete
- **[Core]** 2FA
- **[Extended]** SSO/SAML/SCIM (enterprise tier)
- **[Extended]** GDPR data export/delete tooling
- **[Extended]** Configurable data retention policy
- **[Extended]** SOC 2-ready audit trail export

### P. Integrations
- **[Extended]** Calendar (Google/Outlook) sync for touchpoints & milestones
- **[Extended]** Email provider sync (log sent emails automatically as touchpoints)
- **[Extended]** Slack/Teams
- **[Extended]** Calendly-style scheduling links embedded in touchpoint emails

### Q. Platform, API & Search
- **[Core]** Public GraphQL API (stable, versioned schema) for the entities above
- **[Core]** Global search across companies, contacts, projects, and tasks via Postgres full-text search
- **[Extended]** Mobile-responsive PWA
- **[Extended]** Native mobile app (future)

### R. Forward-looking / AI-assisted (future roadmap, not MVP)
- Auto-drafted change request impact assessments from historical similar requests
- Meeting note summarization → auto-logged touchpoint outcome
- Predictive churn scoring using historical health score patterns
- Smart task estimation based on historical actuals

---

## 4. Tech Stack & Rationale

### 4.1 Frontend — Next.js 16 (JavaScript)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, RSC, Turbopack) | Server Components for read-heavy pages, Client Components for interactivity; a pure client of the FastAPI GraphQL API |
| Language | **JavaScript (ES2022+)**, JSDoc comments on shared utilities for editor hints | No TypeScript compiler in the build; JSDoc gives IDE autocomplete without a type-checking step |
| GraphQL client / codegen | **GraphQL Code Generator** (`client` preset, JS output) generating typed documents + hooks from FastAPI's live GraphQL schema, executed via **Apollo Client** | The GraphQL schema itself is the contract — codegen fails the build if a query references a field the schema doesn't have, which is what replaces compile-time type safety without a TS compiler |
| Data fetching (client) | **Apollo Client** (normalized cache) | Caching, optimistic updates, cache invalidation against the single `/graphql` endpoint |
| Client state | **Zustand** (minimal) | Local UI state only (drag state, builder state) |
| UI | **Tailwind CSS + shadcn/ui + Radix** | Accessible, ownable component code (shadcn's CLI outputs plain `.jsx`, not `.tsx`, when the project is JS) |
| Tables | **TanStack Table** | Server-side pagination/sorting/filtering (params passed as GraphQL query variables) |
| Forms | **React Hook Form + Zod resolver** | Zod validates on the client for immediate UX feedback; the GraphQL schema (backed by Pydantic/Strawberry types) remains the actual source of truth server-side |
| Charts | **Tremor / Recharts** | Health score trends, budget burn-down |
| Testing | **Vitest + Playwright** (JS) | Unit + E2E on the frontend |

### 4.2 Backend — FastAPI (Python) *(unchanged from v2)*

| Layer | Choice | Why |
|---|---|---|
| Framework | **FastAPI** (Python 3.12+, async) | Async I/O for DB + background job dispatch; hosts the GraphQL app via ASGI mounting |
| GraphQL layer | **Strawberry GraphQL** (code-first, async), mounted on FastAPI at `/graphql` | Python-native, type-annotated schema definitions; async resolvers integrate directly with SQLAlchemy's async session; ships a built-in GraphiQL/schema explorer for the same "browsable docs" role `/docs` played under REST |
| Validation / schemas | **Pydantic v2** | Internal request/response and service-layer models; Strawberry types wrap these so validation logic isn't duplicated |
| ORM | **SQLAlchemy 2.0 (async) + Alembic** | Type-safe query building, mature migrations, first-class Postgres RLS support via session-level `SET LOCAL app.current_org_id` |
| DB driver | **`asyncpg`** | Async Postgres driver under SQLAlchemy's async engine |
| Auth | **JWT (access token + httpOnly refresh cookie) issued by FastAPI**, `passlib`/`argon2` for password hashing, **WorkOS Python SDK** for enterprise SSO/SAML/SCIM | Frontend never touches passwords or the DB — it only holds the session and forwards it |
| Background jobs | **Celery + Redis** (broker + result backend), Celery Beat for scheduled/cron jobs | Durable, retryable jobs: sequence steps, escalations, health scoring, reminders |
| Email | **Resend (Python SDK) + Jinja2 templates** | Transactional + sequence emails, rendered server-side |
| Search | **Postgres full-text search** (upgrade path: Meilisearch), queried via SQLAlchemy | Company/contact/project/task search |
| E-signature | **Documenso (OSS) or DocuSign API** | Contract & change-order sign-off |
| Testing | **Pytest** | Unit/service/state-machine tests |
| CI/CD | **GitHub Actions** — separate pipelines for `apps/web` and `apps/api` | Lint/typecheck(JS: eslint)/test/deploy independently per service |

### 4.3 Database
- **PostgreSQL 16+** — unchanged. Relational integrity, JSONB flexibility, native Row-Level Security.

---

## 5. High-Level Architecture

```
┌───────────────────────────┐        ┌──────────────────────────────────┐
│      Next.js 16 App        │GraphQL │           FastAPI App              │
│        (JavaScript)         │        │                                    │
│                             │◄──────►│  app/graphql/{companies,contacts, │
│  app/(marketing)             │        │    projects,planning,             │
│  app/(auth)                  │        │    change_requests,retention,     │
│  app/(dashboard)  – internal │        │    billing}                       │
│  app/(client-portal)         │        │    ├─ schema.py   (Strawberry types│
│                             │        │                    & resolvers)   │
│  Server Components fetch     │        │    ├─ service.py  (business rules,│
│  from FastAPI at request      │        │                    state machines)│
│  time (SSR); Client            │        │    ├─ repository.py (SQLAlchemy, │
│  Components use Apollo         │        │                    tenant-scoped)│
│  Client for queries/mutations   │        │    └─ models.py   (Pydantic)      │
└───────────────┬─────────────┘        └───────────────┬────────────────────┘
                │                                            │
                │                                  ┌────────▼────────┐
                │                                  │   PostgreSQL      │
                │                                  │ (SQLAlchemy, RLS)  │
                │                                  └────────┬────────┘
                │                                           │
                │                                  ┌────────▼────────┐
                │                                  │  Celery Workers   │
                │                                  │  (Redis broker)     │
                │                                  │  - sequence steps    │
                │                                  │  - escalations         │
                │                                  │  - health scoring       │
                │                                  │  - reminders               │
                │                                  └────────────────────────┘
```

**Key decisions:**
- **No Server Actions for business logic.** All mutations and queries go through the single FastAPI GraphQL endpoint (`/graphql`). Next.js Server Components still issue server-side GraphQL requests to FastAPI for SSR/initial page data — that's a data-fetching pattern, not a business-logic layer.
- **State machines live in FastAPI's `service.py`** per module — change request status transitions, milestone approvals, etc. enforced entirely server-side in Python behind GraphQL resolvers, never trusted from the client.
- **Type safety across the JS/Python boundary is schema-checked, not compile-time.** The GraphQL schema (Strawberry) is the single source of truth; GraphQL Code Generator (4.1) generates typed query/mutation documents from that live schema, and a CI step that regenerates them and fails the build on a diff is worth adding so contract drift is caught in CI rather than in production.
- **Client portal is a separate Next.js route group** with its own layout; the FastAPI side enforces the same boundary independently (a portal JWT can only ever query its own `company_id`), so the restriction exists at both the UI and API layer, not just one.
- **Multi-tenancy**: every table is `org_id`-scoped with Postgres Row-Level Security as the hard boundary. FastAPI sets the tenant context per request via a dependency, so RLS — not application code — is what actually prevents cross-tenant reads.
- **Audit log**: every create/update/delete/status-transition on core entities writes to `activity_log` with a before/after diff, from within the service layer.
- **File uploads** (Documents module, 3.I): FastAPI issues pre-signed upload URLs to an S3-compatible bucket and stores only the resulting `file_url`.
- **Data protection**: encryption at rest, TLS in transit, field-level care for contact PII, GDPR export/delete tooling.

---

## 6. Database Schema (PostgreSQL, via SQLAlchemy models)

All tables include `id (uuid, pk)`, `org_id (uuid, fk)`, `created_at`, `updated_at`, and `deleted_at` (nullable, soft delete) unless noted. Unchanged from v2/v3.

### 6.1 Core / Tenancy
- **`organizations`** — id, name, plan, settings (jsonb)
- **`users`** — id, org_id, name, email, password_hash, role, avatar_url, status

### 6.2 Companies & Contacts
- **`companies`** — id, org_id, name, industry, website, logo_url, address (jsonb), size, timezone, status (lead/active/paused/churned), account_owner_id, health_score
- **`contacts`** — id, org_id, company_id, first_name, last_name, email, phone, title, department, is_primary, preferred_channel, timezone, portal_access_enabled, linkedin_url, status

### 6.3 Projects & Planning
- **`projects`** — id, org_id, company_id, name, description, status, priority, project_manager_id, start_date, end_date, budget, actual_cost, health (on_track/at_risk/delayed)
- **`project_phases`** — id, project_id, name, order_index, start_date, due_date, status
- **`milestones`** — id, phase_id, title, description, due_date, status (not_started/in_progress/at_risk/completed), requires_client_approval (bool), approved_at, order_index
- **`tasks`** — id, project_id, phase_id, milestone_id (nullable), parent_task_id, title, description, assignee_id, status, priority, start_date, due_date, estimated_hours, actual_hours
- **`task_dependencies`** — id, task_id, depends_on_task_id, type

### 6.4 Change Request Management
- **`change_requests`** — id, org_id, project_id, company_id, requested_by_contact_id, type (scope_addition/scope_reduction/timeline_change/budget_change/bugfix/other), title, description, priority (low/medium/high/urgent), status (submitted/under_review/pending_impact_assessment/pending_approval/approved/rejected/on_hold/in_progress/implemented/closed), impact_hours, impact_cost, impact_timeline_days, assessment_notes, assigned_pm_id, requires_client_approval, requires_internal_approval, revision_count, decided_at, desired_due_date
- **`change_request_attachments`** — id, change_request_id, file_url, uploaded_by
- **`approvals`** *(generic, reused by change requests, milestones, and documents)* — id, entity_type (change_request/milestone/document), entity_id, approver_type (internal/client), approver_id, status (pending/approved/rejected), comment, decided_at

### 6.5 Client Retention (Touchpoint Sequences)
- **`retention_sequences`** — id, org_id, name, trigger_type (manual/on_project_completed/on_company_created/on_renewal_approaching), is_active, is_template
- **`retention_sequence_steps`** — id, sequence_id, step_order, channel (email/call/meeting/internal_task), offset_days, template_id, assignee_role
- **`retention_enrollments`** — id, sequence_id, company_id, contact_id, status, current_step, enrolled_at
- **`touchpoints`** — id, org_id, enrollment_id (nullable), company_id, contact_id, project_id (nullable), type, scheduled_at, completed_at, status (scheduled/completed/skipped/overdue), outcome, notes, created_by
- **`client_health_scores`** — id, company_id, score, factors (jsonb), calculated_at
- **`contracts`** — id, org_id, company_id, start_date, end_date, value, auto_renew, status

### 6.6 Shared / Supporting Tables
- **`comments`** — id, org_id, entity_type (company/contact/project/task/change_request), entity_id, author_type (internal/client), author_id, body, is_client_visible, created_at
- **`tags`** — id, org_id, name
- **`entity_tags`** *(polymorphic, usable on companies, contacts, and projects alike)* — id, entity_type, entity_id, tag_id
- **`email_templates`** — org_id, name, subject, body
- **`documents`** — polymorphic (entity_type, entity_id), file_url, version, uploaded_by
- **`notifications`** — user_id, type, title, message, link, read_at
- **`activity_log`** — org_id, actor_id, action, entity_type, entity_id, diff (jsonb), created_at
- **`invoices`** *(Extended)* — org_id, company_id, project_id, amount, status, due_date

**Indexing**: composite `(org_id, company_id)`, `(org_id, status)` on major tables; `(project_id, status)` on `change_requests`; `(scheduled_at, status)` on `touchpoints` for the daily due-item scan; `(phase_id, order_index)` on `milestones`.

---

## 7. Detailed Process Flows

*(Unchanged from v2 — state machines live in the backend's `service.py`, written in Python against SQLAlchemy.)*

### 7.1 Client Onboarding Flow
```
Lead created (Company, status=lead)
   → Primary Contact added
   → Sales/kickoff call logged as first touchpoint
   → Contract signed → Company.status = active, Contract record created
   → Project created (from template or custom)
   → Client Portal invite sent to Primary Contact
   → Company auto-enrolled in "Onboarding" retention sequence
```

### 7.2 Project Planning Flow
```
PM creates Project
   → Selects a Project Template (or builds custom) → Phases generated
   → Milestones added within phases (key dates/deliverables)
   → Tasks added under each Phase/Milestone, assignees + estimates set
   → Dependencies configured
   → (Optional) Plan sent to Client Portal for review → Client approves via Approval flow (7.5)
   → Project.status = active → Kanban/Gantt/Calendar views go live
```

### 7.3 Change Request Flow — client raises a project change *(core flow)*

**State machine:**
```
submitted → under_review → pending_impact_assessment → pending_approval
   → approved → in_progress → implemented → closed
   → rejected → closed  (or client resubmits → back to submitted)
   → on_hold → under_review (when clarified)
```

**Step by step:**
1. **Client Primary Contact** opens the Client Portal → selects a Project → clicks **"Request a Change."**
2. Fills form: Type, Title, Description, Priority, Desired due date, Attachments.
3. FastAPI creates a `change_requests` row, `status = submitted`. Notification fires to the assigned PM (in-app + email).
4. **PM reviews** → moves status to `under_review`. If unclear, PM opens the comment thread; status can drop to `on_hold` while awaiting clarification.
5. PM performs an **Impact Assessment**: estimated hours, cost delta, timeline delta, risk notes. Status → `pending_impact_assessment` while in progress, then → `pending_approval`.
6. **Approval routing** (org-configurable):
   - Cost/timeline delta exceeds a threshold → **internal approval** required (Admin/Owner) before it goes to the client.
   - Changes what the client pays or receives → **client approval** required — client sees the impact assessment in the portal and accepts or rejects.
7. **Outcome:**
   - **Approved** → status = `approved`. Backend auto-generates/updates the relevant tasks/milestones, updates `projects.budget`/`end_date` if applicable, writes an audit log entry, notifies both sides. Status moves to `in_progress` as work begins.
   - **Rejected** → status = `rejected` with a reason; client notified; request closes or client may resubmit.
8. When associated tasks complete → status = `implemented`. Optional client confirmation → status = `closed`.
9. If revisions loop past the configured cap (e.g. 3 rounds) → auto-escalate to the manager.
10. All change requests for a project appear in a **Change Log** tab, and roll up into an org-wide **Change Request dashboard** (open / pending approval / overdue-for-response, aging report).

### 7.4 Task Lifecycle Flow
```
todo → in_progress → review → (internal approval by PM, and/or client approval if deliverable-facing) → done
```
- Overdue tasks auto-flagged; comments/attachments/time logs at every stage.
- If review reveals a scope gap → team converts the discussion directly into a **Change Request** linked back to the task.

### 7.5 Milestone / Deliverable Approval Flow
```
PM marks Milestone "Ready for Review"
   → Client Portal shows it under "Pending Your Approval"
   → Client Approves → Milestone.status = completed (unlocks milestone invoice if billing is milestone-based)
   → Client Requests Changes → routed into Change Request flow (7.3) if it affects scope,
     or simply reopened as feedback if it's a minor fix
```

### 7.6 Client Retention / Touchpoint Flow
```
Enrollment created (manual, or auto on trigger: company created / project completed / renewal approaching)
   → Celery Beat checks steps due today (daily)
   → Touchpoint auto-created (status=scheduled); email steps auto-send
   → Owner completes touchpoint, logs outcome (positive/neutral/at-risk) → advance to next step
   → Missed due date → status=overdue → escalation notification to owner's manager
   → Final step done → enrollment.status = completed
```

### 7.7 Renewal & Contract Flow
```
Contract.end_date approaching (X days out, configurable)
   → Auto-enroll Company in "Renewal" retention sequence
   → Account Owner notified to begin renewal conversation
   → Outcome: Renewed (new contract row, sequence marked completed)
             or Churned (Company.status = churned → triggers offboarding/win-back sequence)
```

### 7.8 Notification & Escalation Flow
```
Event occurs (change request submitted, touchpoint due, task overdue, approval pending)
   → In-app + email notification to the responsible actor
   → If no action within SLA window (configurable, e.g. 48h for change request approval,
     3 days for overdue touchpoint) → escalation notification to their manager/Admin
```

### 7.9 Document / Deliverable Approval Flow
```
Team uploads a deliverable (new version) → Document.version incremented
   → Client notified in portal → Reviews → Approves or Comments/Requests changes
   → Approved deliverables locked as the accepted version; history retained
```

---

## 8. API Design (FastAPI + Strawberry GraphQL, `/graphql`)

The only interface between frontend and backend — there's no Server Action layer. A single endpoint; shape below is illustrative of the schema, not literal syntax.

```
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

# Companies/contacts/touchpoints are exposed as nested fields on Company/Project
# (e.g. company.contacts, company.projects, project.tasks, project.milestones)
# rather than separate endpoints — GraphQL resolves them in one request.
```

- Every resolver: **Strawberry/Pydantic input validation → auth dependency (JWT + org scope) → permission check (role + entity scope) → service call → audit log write.** Same layered flow as before, just invoked from resolvers instead of route handlers.
- **Strawberry's built-in GraphiQL** at `/graphql` (dev only) plays the role `/docs` played under REST — a live, browsable schema. The frontend's GraphQL Code Generator output is regenerated in CI against that same live schema, so a backend contract change surfaces as a failing build rather than a silent runtime mismatch.
- Webhooks (`email-events`, `esignature`) remain plain FastAPI REST routes alongside `/graphql` — webhooks are one-way callbacks from third parties, not something the frontend queries, so there's no benefit to forcing them through GraphQL.
- API-key auth (separate from user JWTs) for integrations, scoped per org, rate-limited via `slowapi` (in-process, backed by the same Redis instance Celery already uses). Query complexity/depth limiting is added at the GraphQL layer to prevent abusive nested queries from becoming a DoS vector.

---

## 9. Frontend Architecture (Next.js — presentation only)

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
├─ (client-portal)/                   external clients
│  ├─ projects/[id]/                  status view, milestone approvals
│  ├─ change-requests/                submit new, track existing
│  └─ documents/                      deliverables & contracts
└─ lib/graphql/                       generated query/mutation documents + hooks (GraphQL Code Generator) from FastAPI's live schema; Apollo Client setup
```
- **Server Components by default**, doing server-side GraphQL requests to FastAPI's `/graphql` for initial page data; **Client Components** only for interactivity (Kanban DnD, sequence builder, change request form, charts) using **Apollo Client** against the same endpoint.
- **Optimistic UI** (Apollo Client's optimistic response + normalized cache) for status changes — instant feedback reconciled with the FastAPI response.
- Shared `components/domain/` for `<CompanyCard>`, `<HealthScoreBadge>`, `<ChangeRequestStatusBadge>`, `<MilestoneApprovalPanel>`, `<TouchpointTimeline>` — plain `.jsx` files, PropTypes/JSDoc for editor hints where it helps.
- **ESLint** (with `eslint-plugin-react` + `eslint-plugin-jsx-a11y`) is the substitute for a lot of what TS's compiler would otherwise catch — worth configuring strictly from day one since there's no type checker as a second line of defense. GraphQL Code Generator's schema validation covers the query/mutation shape specifically.

---

## 10. Background Jobs & Automation (Celery)

| Job | Frequency | Purpose |
|---|---|---|
| `process_due_sequence_steps` | Daily (Celery Beat) | Advance retention enrollments, create touchpoints, send emails |
| `flag_overdue_touchpoints` | Daily | Mark overdue, notify owners |
| `escalate_pending_change_requests` | Daily | Escalate approvals stuck past SLA, and revision loops past the cap |
| `recalculate_health_scores` | Nightly | Recompute `companies.health_score` |
| `project_deadline_reminders` | Daily | Notify PMs of tasks/milestones due soon or overdue |
| `contract_renewal_check` | Daily | Auto-enroll companies approaching contract end into Renewal sequence |
| `weekly_digest_email` | Weekly | Per-owner summary: at-risk clients, open change requests, upcoming touchpoints |

All jobs are Celery tasks with automatic retry/backoff on failure; Redis is the broker and result backend.

---

## 11. Non-Functional Requirements

- **Performance**: server-side pagination on every list endpoint; indexed queries; RSC to minimize client JS.
- **Scalability**: SQLAlchemy async connection pooling (PgBouncer in front once needed), read replica for reporting once needed, Celery workers scale horizontally and independently of the API.
- **Security**: RLS on every tenant table, RBAC enforced at the FastAPI dependency layer (never trusted from the client), full audit trail, soft delete, 2FA, SSO for enterprise, rate-limited API, strict portal-side scoping enforced server-side.
- **Compliance**: GDPR export/delete, SOC 2-friendly audit trail, configurable retention policy.
- **Testing**: Pytest on services/state machines (backend), Vitest + Playwright on the frontend, with Playwright E2E covering the critical cross-service flows (create project, submit + approve change request, complete touchpoint, milestone approval).

---

## 12. Delivery Roadmap

| Phase | Scope |
|---|---|
| **Phase 1 — Foundation** | FastAPI + Strawberry GraphQL + Next.js scaffolding, auth (JWT + refresh cookie), multi-tenancy + RLS, org/user management, Companies & Contacts CRUD, tags, generated JS GraphQL client (codegen) wired end-to-end |
| **Phase 2 — Projects & Planning** | Projects, phases, milestones, tasks, dependencies, Kanban/List/Gantt views |
| **Phase 3 — Client Portal + Approvals** | Portal auth, project status view, milestone/deliverable approval flow |
| **Phase 4 — Change Request Management** | Full change request lifecycle, impact assessment, approval routing, change log |
| **Phase 5 — Retention Core** | Sequence builder, enrollments, touchpoint logging, Celery automation engine |
| **Phase 6 — Retention Intelligence** | Health scoring, at-risk dashboard, renewal tracking, weekly digests |
| **Phase 7 — Enterprise Hardening** | SSO/SAML, billing/invoicing, e-signature, custom roles, public API, integrations |

---

## 13. Suggested Immediate Next Steps

1. Scaffold the monorepo: `apps/web` (Next.js 16, JavaScript) + `apps/api` (FastAPI, `uv` or Poetry for dependency management) + shared `docker-compose.yml` for local Postgres + Redis.
2. Stand up `organizations`/`users` with Alembic migrations and RLS wired end-to-end in FastAPI; issue the JWT auth flow and confirm the Next.js middleware can protect routes against it.
3. Build Companies + Contacts as the reference module pattern (SQLAlchemy repository → service → Strawberry GraphQL schema/resolvers → generated JS client via GraphQL Code Generator → Next.js UI).
4. Set up the CI step that regenerates the JS GraphQL client from FastAPI's live schema and fails the build on an uncommitted diff — this is what keeps the JS side honest without a compiler.
5. Build Projects + Planning next (including `milestones`), then the Client Portal shell, then Change Requests — the state machine in Section 7.3 is the trickiest piece, worth unit-testing in Pytest in isolation before wiring the UI.
6. Layer in Celery + Retention automation once the core data model is proven in real use.

Happy to generate the actual SQLAlchemy models + Alembic migration, the change-request state machine as Python code, or scaffold the FastAPI Companies module next — just say which.