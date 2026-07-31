# Needed Schema Changes — Consolidated Handoff

This is the reconciliation document for swapping the local mock schema (`schema.graphql` + `app/lib/mocks/`) for the real FastAPI + Strawberry backend. It replaces the phase-by-phase log that grew across Phases 1–6 — everything from that log is folded in here, organized by what kind of answer it needs rather than by when it was written.

**Status key**
- **BLOCKING** — the frontend guessed at a contract shape or a business rule to keep building. If the guess is wrong, the fix is wide (touches a state machine, a schema type, or logic duplicated for a reason). These need an explicit confirm-or-correct before the real API replaces the mock.
- **GAP** — a feature in the master plan has no query or mutation to call at all. Most gaps got a stubbed shape in the mock so the module could be built anyway (noted inline); a few are still genuinely open.
- **Invented field** — a read-only convenience added to the mock schema that isn't in the master plan's table list, usually because computing it client-side would be slow, wrong, or impossible (e.g. it depends on joining polymorphic rows the client can't see).

Scalars assumed throughout: `DateTime` (ISO 8601 with offset), `Date` (`YYYY-MM-DD`), `JSON`.

---

## Read this first: the six items still genuinely unresolved

Everything else in this document has a mock implementation to reconcile against. These six do not have a confirmed answer at all, several of them raised more than once across phases without a response, and they're the ones most likely to cause a wide, silent breakage if the real backend disagrees:

1. **Enum value casing** — `SCREAMING_SNAKE_CASE` assumed everywhere; the master plan's DB values are lowercase. Raised at the end of Phase 1, again after Phase 3, again after Phase 5. See [§1.3](#13-enum-value-casing-blocking-raised-three-times-unanswered).
2. **`me` for portal callers** — assumed to return `User { scope, contact, company }` rather than `null`. The entire client portal is built on this. See [§1.1](#11-me-has-to-serve-two-different-kinds-of-caller-blocking).
3. **Pagination shape** — offset (`nodes`, `pageInfo`, `totalCount`) assumed, not Relay cursors. Raised at the end of Phase 1, again after Phase 3. See [§1.4](#14-pagination-shape-blocking-raised-twice-unanswered).
4. **Approver identity is a flat string match**, not a foreign key. `Approval.approverName` compared against the signed-in user/contact's display name is how both milestone and change-request approvals decide "is this mine?". Fragile (two people with the same name, a renamed user). See [§4.1](#41-approver-identity-should-be-a-foreign-key-not-a-name-string).
5. **Currency** — no currency field anywhere in the contract (`Contract.value`, `Project.budget`, `ChangeRequest.impactCost` are bare numbers). The frontend hard-codes GBP. Raised independently in four different modules. See [§4.4](#44-currency-raised-independently-in-four-modules).
6. **The org KPI dashboard** ([§2](#2-gaps--features-named-in-the-plan-with-nothing-to-call), gap 2.3) still has no aggregate query — `/` over-fetches and counts client-side. Phase 6 built a second, purpose-built aggregate (`atRiskCompanies`) rather than wait on this one; the same approach should extend to the dashboard.

---

## 1. Blocking assumptions — please confirm or correct

### 1.1 `me` has to serve two different kinds of caller — BLOCKING

`Query.me: User` is the only identity query, but the master plan models client-portal users as `contacts` rows, not `users` rows. The frontend needs one call that answers "who is this and which shell do I render", so the stub adds three fields:

```graphql
type User {
  scope: AuthScope!   # INTERNAL | PORTAL
  contact: Contact    # populated when scope = PORTAL
  company: Company    # populated when scope = PORTAL — the only company they may see
}
```

Alternatives that also work, if either is a better fit server-side: `me: Viewer` as a union of `User | ClientContact`, or a separate `portalMe: Contact` query with the frontend choosing which to call based on token scope. What does **not** work is `me` returning `null` for a portal contact — the portal layout has no identity to render without it, `me.contact.fullName` is how the portal decides whose turn it is on an approval, and `me.company` is the tenancy boundary itself.

That tenancy boundary is verified working end to end against the mock: signed in as a Northwind contact, `/portal/projects/{a-halcyon-project}` resolves to `null` and renders "we couldn't find that project" rather than leaking its existence, and an internal-only route bounces a portal session back to `/portal`. The behavior is right; it's the shape of `me` that needs confirming before the real backend takes over.

### 1.2 `ChangeRequestDecision` / `ApprovalDecision` are input objects, not enums — BLOCKING

The contract shows `decideChangeRequest(id: ID!, decision: ChangeRequestDecision!)`, which reads like an enum. The stub makes it an input object, and gives milestone approval the identical shape:

```graphql
input ChangeRequestDecision {
  outcome: ApprovalOutcome!      # APPROVED | REJECTED
  approverType: ApproverType!    # INTERNAL | CLIENT
  comment: String
}

input ApprovalDecision {         # decideMilestoneApproval — deliberately identical
  outcome: ApprovalOutcome!
  approverType: ApproverType!
  comment: String
}
```

A rejection requires a **reason**, and internal/client approvals route separately, so the resolver needs to know which of the two decisions this is — a bare enum has nowhere to put either. Since the two input types are identical on purpose (the two flows differ in *what* is decided, not *how* a decision is recorded), **it's worth unifying them into one input type** rather than two that can drift apart.

### 1.3 Enum value casing — BLOCKING, raised three times, unanswered

The stub uses `SCREAMING_SNAKE_CASE` (`ON_TRACK`, `PENDING_APPROVAL`, `SCOPE_ADDITION`). The master plan's own tables list DB values in lowercase (`on_track`, `pending_approval`). Strawberry can emit either.

By the end of Phase 5 this had become the single highest-density risk in the app: `ChangeRequestStatus` alone has ten members, and together with `TaskStatus`, `ApprovalStatus`, `ApproverType` and `ChangeRequestType` these literals are threaded through every status badge (`app/lib/status.js`), every form's `z.enum([...])`, the Kanban board, the Gantt bar colours, the calendar chips, and — critically — two state machines that key off **exact string equality**: `allowedTransitions()` / `canTransition()` in `app/lib/change-requests.js`, and `canDecide()` for approvals. If the wire format turns out to be `lowercase` or `Title Case`, every transition check and every "can I approve this" check doesn't error — it silently returns `false`, which is a worse failure mode than a crash because nothing looks broken, things just stop being clickable.

Recolouring the badges is a one-file fix (`app/lib/status.js`). Recovering from a casing mismatch in the state machines is not. Please confirm the wire format before the real backend replaces the mock.

### 1.4 Pagination shape — BLOCKING, raised twice, unanswered

`CompanyConnection` / `ProjectConnection` / `ChangeRequestConnection` are modelled as offset pagination, not Relay cursors:

```graphql
type CompanyConnection { nodes: [Company!]!  pageInfo: PageInfo!  totalCount: Int! }
input PageInput { page: Int = 1  pageSize: Int = 25  sortBy: String  sortDirection: SortDirection }
```

The "Connection" name usually implies Relay `edges { node cursor }`. Offset suits the product better — TanStack Table wants numbered pages and a total count, and the project list's "showing 1–15 of 42" line has no cursor equivalent — but if the backend goes Relay regardless, `totalCount` needs to exist on the connection somehow or every paginated table in the app loses its page count.

`PageInput.sortBy` is a bare `String` across every list. A per-entity enum (`CompanySortField`, `ProjectSortField`, ...) would be safer and self-documenting than a string the server has to validate defensively. Related: several list screens (companies, projects) currently fall back to a default sort client-side when `sortBy` is unrecognised — **the server should reject unknown sort keys rather than silently ignoring them**, so a typo'd sort param fails loudly instead of quietly serving the wrong order.

### 1.5 Auth payload and cookie ownership — BLOCKING

```graphql
type AuthPayload { accessToken: String!  expiresAt: DateTime!  scope: AuthScope!  user: User! }
```

Two things to settle:

1. **Who sets the refresh cookie.** Ideally `login` sets the httpOnly refresh cookie itself in the HTTP response. Right now the frontend has a stopgap route (`app/api/auth/session/route.js`) that parks the access token in an httpOnly cookie so Next's middleware can read it, because middleware can only see cookies. Delete that route once the backend sets both cookies — but then the access token also needs to arrive as a cookie, not only in the mutation payload, or route protection has nothing to read.
2. **`refreshToken` takes no arguments** and is assumed to read the refresh cookie. Confirm the cookie name, `SameSite`, and domain — especially if the API is on a different origin to the app, since cross-site cookies need `SameSite=None; Secure` plus a CORS allowlist.

### 1.6 Contact CRUD — closes gap 2.10 — BLOCKING

The original contract has no contact mutations at all, despite contacts being a full CRUD module in the plan. The stub adds:

```graphql
input ContactInput {
  companyId: ID!
  firstName: String!
  lastName: String!
  email: String!
  phone: String
  title: String
  department: String
  isPrimary: Boolean
  preferredChannel: PreferredChannel
  bestTimeToContact: String
  doNotContact: Boolean
  timezone: String
  portalAccessEnabled: Boolean
  linkedinUrl: String
  status: ContactStatus
}

createContact(input: ContactInput!): Contact!
updateContact(id: ID!, input: ContactInput!): Contact!
archiveContact(id: ID!): Contact!
```

Three behaviours the UI depends on and cannot enforce itself — please confirm the server does these, or say where they actually live:

1. **Primary contact is exclusive per company.** Setting `isPrimary: true` must demote the previous primary in the same transaction, or two contacts can both claim primary and the overview card becomes ambiguous.
2. **Email uniqueness**, surfaced as `extensions.code = "BAD_USER_INPUT"` / `extensions.field = "email"` in the mock. Any error shape works since the form shows `message` verbatim, but a machine-readable `field` lets the error attach to the right input instead of a form-level banner.
3. **Archive is a soft delete.** `archiveContact` sets `status: INACTIVE` and `portalAccessEnabled: false`, keeps touchpoint history, and refuses to archive the primary contact. If the backend prefers a hard `deleteContact`, say so — the UI copy ("their history stays on the record") would need to change.

`updateContact` takes the whole `ContactInput`, so a partial update resends every field — same full-replace problem as §1.8 below. A `ContactPatchInput` with all-optional fields would be better.

`doNotContact` also needs to exclude the contact from retention sequences — that's a server-side rule the frontend is relying on, not enforcing.

### 1.7 `Query.tags` and `Query.users` — BLOCKING

Neither exists in the original contract. `Query.tags: [Tag!]!` backs the tag picker (`CompanyInput.tagIds` already existed with nothing to populate it from); `Query.users: [User!]!` backs the account-owner and every assignee picker.

`Tag.color` is treated as a **tone name** (`positive | caution | critical | info | accent | neutral`), not a hex value — that keeps tags inside the design system's colour tokens so they stay legible in dark mode and meet contrast on their own backgrounds. If the backend intends to store arbitrary hex, a mapping layer is needed; flagging early because it's cheaper to fix in the schema than after tags exist in a real database.

Both queries are unpaginated for now, which is fine at fixture scale but won't survive a real org — `users(filter: UserFilter, page: PageInput): UserConnection!` before this ships. Tag *management* (create/rename/delete) is a separate, still-open gap — see §2.

### 1.8 Project / task / milestone / phase writes are full-replace — BLOCKING

The original contract has `createTask` and `createProject` but no way to change either afterward. The stub adds:

```graphql
updateProject(id: ID!, input: ProjectInput!): Project!
updateTask(id: ID!, input: TaskInput!): Task!
updateMilestone(id: ID!, input: MilestoneInput!): Milestone!
createPhase(input: PhaseInput!): Phase!
updatePhase(id: ID!, input: PhaseInput!): Phase!
```

All five take the **whole** input type, so a one-field change resends everything. This is the same shape problem as contacts (§1.6) and companies (§4.3), but it bites hardest here: the list view's inline status control would otherwise have to resend a task's title, dates, estimate and every foreign key just to move it from "To do" to "In progress". That's why the Kanban write (§1.9) exists as a separate, narrow mutation instead of going through `updateTask` — and why a `TaskPatchInput` (and equivalents for the others) would be worth having generally.

There is still **no delete or archive** for projects, tasks, phases, or milestones, and phases have no reorder mutation. Both left out rather than guessed at — soft vs. hard delete, what happens to a deleted task's subtasks and dependents, and how reindexing works, are decisions the backend should own. If phases need reordering, `reorderPhases(projectId: ID!, phaseIds: [ID!]!)` is the simplest shape.

### 1.9 `updateTaskStatus` — the Kanban drop write — BLOCKING

```graphql
updateTaskStatus(id: ID!, status: TaskStatus!, orderIndex: Int!): [Task!]!
```

**`orderIndex` is a position among siblings, not a global rank** — for a top-level task, its slot in the destination status column; for a subtask, its slot within its parent (subtasks aren't on the board, so status doesn't partition them).

Three things the server has to do, which the mock does and the UI depends on:

1. **Reindex both affected sibling groups to `0..n-1`** in the same transaction. Without this, gaps accumulate on every move and two tasks eventually collide on the same index, at which point board order stops being stable across reloads.
2. **Clamp `orderIndex`** into range rather than erroring — the client sends an optimistically-computed index that a concurrent move by someone else can make stale before it lands. Clamping degrades to "close to where they dropped it", far better than a failed drop.
3. **Return every task it touched**, not just the moved one. The return type is a list for exactly this reason: Apollo normalizes by `id`, so one response reconciles the client's optimistic order in a single cache write.

Open question: is a separate reorder mutation wanted for same-column drags, or does `updateTaskStatus` with an unchanged `status` keep double-jobbing (in which case `moveTask(id, status, orderIndex)` would be a better name)?

**Concurrency is unhandled on purpose.** Two people dragging in the same column at once produce a last-write-wins order. If that matters, this needs a version field or an "insert after task X" formulation instead of a raw index — worth settling before it ships to real users.

### 1.10 Task dependencies — validation the frontend can't check itself

```graphql
addTaskDependency(taskId: ID!, dependsOnTaskId: ID!, type: DependencyType! = FINISH_TO_START): Task!
removeTaskDependency(id: ID!): Task!
```

The mock rejects four cases and the UI surfaces each message verbatim — please confirm the server does the same:

- a task depending on itself
- a duplicate edge
- a dependency crossing project boundaries
- **a cycle** — the mock walks existing edges forward from the proposed predecessor looking for a path back. Without this, the Gantt's arrow layer (and any future critical-path calculation) will loop.

Only `FINISH_TO_START` is offered in the UI; the other three `DependencyType` members are stored and displayed, but the Gantt only draws finish-to-start elbow geometry. Flagging so the backend doesn't assume the UI honours all four.

**`Task.dependencies` returns predecessors only** — there's no way to ask "what's waiting on this task", so a "marking this done unblocks 3 tasks" affordance has to be computed client-side from the whole task list. `Task.dependents: [Task!]!` would fix that.

### 1.11 `decideMilestoneApproval` — closes gap 2.7 — BLOCKING

```graphql
decideMilestoneApproval(id: ID!, decision: ApprovalDecision!): Milestone!
```

**`id` is the milestone id**, mirroring `decideChangeRequest` — that's what was asked for, but see §4.2 for why the approval id would be the stronger choice.

Four rules the mock enforces and the UI depends on:

1. **A caller may only decide their own approval row** (compares the session's contact/user against `Approval.approverName` — see §4.1 for why that's fragile). This was a live bug during development; worth an explicit server-side test.
2. **A rejection requires a comment.** Enforced client-side too, but the server is what actually matters — "changes requested" with no reason is useless to the delivery team.
3. **The milestone only completes when *every* client approver has approved.** One approval out of two leaves it pending.
4. **A rejection reopens the milestone** (back to `IN_PROGRESS`, `approvedAt` cleared) rather than failing it. Confirm that matches the intended state machine.

### 1.12 The org-wide change-request queue — closes gap 2.6 — BLOCKING

The original `changeRequests(projectId, status)` returns an unpaginated flat list with two filters, which can't serve a real queue screen — it needs a company filter, a PM filter, an "awaiting me" filter, an overdue flag, sorting by age, and pagination. The stub adds a second query alongside it (kept for compatibility) rather than reshaping the original:

```graphql
changeRequestQueue(filter: ChangeRequestFilter, page: PageInput): ChangeRequestConnection!

input ChangeRequestFilter {
  search: String
  status: [ChangeRequestStatus!]
  type: [ChangeRequestType!]
  priority: [Priority!]
  companyId: ID
  projectId: ID
  assignedPmId: ID
  overdueOnly: Boolean
  awaiting: AwaitingParty        # AGENCY | CLIENT | NOBODY
}
```

Three fields ride along on `ChangeRequest` itself because the queue, the internal detail view, and the portal all need to agree on the same answer to "whose turn is it, and are they late":

```graphql
awaitingParty: AwaitingParty!   # derived from status + outstanding approvals
responseDueAt: DateTime         # null once decided; see §4.5 for the SLA question
isOverdue: Boolean!
```

The mock computes these exactly the way `app/lib/change-requests.js` does client-side (`awaitingParty()`, `responseDueAt()`, `isOverdue()`) — deliberately duplicated so the two can be diffed, not because duplication is wanted long-term. **If the real API computes these itself, the client copy should be deleted**, not kept as a shadow implementation that can drift.

### 1.13 The change-request state machine is inferred, not specified — please confirm or correct

The lifecycle beyond "create → assess → decide" (the three mutations the original contract already named) is inferred from `ChangeRequestStatus`'s ten members, since the source material referencing the intended flow wasn't available. It lives in `app/lib/change-requests.js` (`TRANSITIONS`) and is mirrored in the mock resolver so the two can't disagree:

```
SUBMITTED → UNDER_REVIEW | ON_HOLD | CLOSED
UNDER_REVIEW → PENDING_IMPACT_ASSESSMENT | ON_HOLD | CLOSED
PENDING_IMPACT_ASSESSMENT → UNDER_REVIEW | ON_HOLD | CLOSED
PENDING_APPROVAL → ON_HOLD | CLOSED                    (decide via decideChangeRequest, not this)
ON_HOLD → UNDER_REVIEW | PENDING_IMPACT_ASSESSMENT | PENDING_APPROVAL | CLOSED
APPROVED → IN_PROGRESS | ON_HOLD | CLOSED
IN_PROGRESS → IMPLEMENTED | ON_HOLD
IMPLEMENTED → CLOSED
REJECTED → CLOSED
CLOSED → (terminal)
```

`assessChangeRequest` moves `SUBMITTED | UNDER_REVIEW | PENDING_IMPACT_ASSESSMENT | ON_HOLD` → `PENDING_APPROVAL` (or straight to `APPROVED` if neither internal nor client sign-off is required — §1.14). `decideChangeRequest` only accepts `PENDING_APPROVAL`. Everything else — parking, resuming, marking built, closing without a decision — goes through `updateChangeRequestStatus(id, status, note)`, which the mock rejects unless the transition is in the table above.

This is the piece most likely to be wrong, since it's inference rather than specification. If the backend has a different (or more permissive) state machine, `TRANSITIONS` in both places (client logic + mock resolver) is where to fix it.

### 1.14 `assessChangeRequest` creates the `Approval` rows — BLOCKING

The mock creates one `PENDING` approval per required approver at assessment time, not at submission:

- Internal approval names the assigned PM (falls back to a generic label if unassigned).
- Client approval names the contact who raised the request, or the company's primary contact if the request has no requester on file.
- If **neither** is required (an absorbed defect, e.g. a `BUGFIX` with no client-facing impact), the request goes straight to `APPROVED` with no approval rows at all.

Same "who does `Approval.approverName` refer to" problem as §4.1, applied here.

### 1.15 `decideChangeRequest` — four enforced rules — BLOCKING

```graphql
decideChangeRequest(id: ID!, decision: ChangeRequestDecision!): ChangeRequest!
```

`ChangeRequestDecisionPanel` is one component rendering for both `approverType: INTERNAL` and `CLIENT`; only the copy changes. Four rules the mock enforces, matching the milestone pattern:

1. **Internal sign-off gates the client's.** If both are required, a client attempting to decide while internal is still `PENDING` is rejected — deciding out of order would let a client approve something the agency hasn't actually agreed to deliver.
2. **A portal caller may only record `approverType: CLIENT`.** Enforced server-side (`FORBIDDEN` otherwise), not just hidden in the UI.
3. **A rejection requires a comment.**
4. **The request only reaches `APPROVED` once every required approval has landed.** One of two sign-offs approving leaves it `PENDING_APPROVAL`; `awaitingParty` moves to whoever's left.

Same open design question as §1.11: **`id` is the change-request id, not the approval id** — see §4.2.

### 1.16 `createRetentionSequence` / `updateRetentionSequence` — BLOCKING

```graphql
input RetentionSequenceStepInput {
  name: String!
  channel: SequenceChannel!
  offsetDays: Int!
  assigneeRole: UserRole
  templateId: ID
}

input RetentionSequenceInput {
  name: String!
  description: String
  triggerType: SequenceTriggerType!
  isActive: Boolean
  steps: [RetentionSequenceStepInput!]!
}

createRetentionSequence(input: RetentionSequenceInput!): RetentionSequence!
updateRetentionSequence(id: ID!, input: RetentionSequenceInput!): RetentionSequence!
```

Two things the mock enforces that the UI depends on:

1. **`steps` is a full-replace list, ordered by array position** — no separate index to send, no partial-update semantics. Step ids are regenerated on every save, which is safe only because nothing outside the sequence references a step by id (`SequenceEnrollment.currentStep` is a position, not a step id — confirm that stays true).
2. **Steps must be non-decreasing in `offsetDays`, in array order.** Enforced both client-side (live, while dragging, for instant feedback) and server-side (`toSequenceSteps()` in the mock resolver, which is what actually protects the data) — one of the few rules duplicated on purpose.

No delete/archive mutation for a sequence, deliberately not guessed at — `isActive: false` is the offered mechanism instead (blocks new enrollments, doesn't touch existing ones), avoiding the harder question of what happens to a sequence's history if it's deleted outright.

### 1.17 Enrollment behavior — BLOCKING, three guessed rules

`enrollInSequence` now generates the promised `Touchpoint` rows at enrollment time (`SCHEDULED`, dated `enrolledAt + step.offsetDays`) — the original contract created an enrollment row and nothing else, leaving nothing for a "touchpoint automation tool" to have automated. Three behaviours are guessed, none specified anywhere:

- **Duplicate active enrollment is rejected**; re-enrolling after `COMPLETED` or `CANCELLED` is allowed.
- **An inactive sequence can't be enrolled into**, checked at enrollment time, not just hidden in the UI.
- **Cancelling an enrollment** (`updateEnrollmentStatus(id, status)`) **skips its still-`SCHEDULED` touchpoints** rather than deleting them — they stay on the record as `SKIPPED`.

**Pausing does not stop already-scheduled touchpoints from showing as due** — whether pausing should shift the remaining steps' dates or just freeze progress and leave dates as they were is a genuine open product question, not guessed at.

### 1.18 `Touchpoint.status` derivation — BLOCKING, confirm the semantics

`OVERDUE` is a storable enum value, but nothing sweeps the database to flip `SCHEDULED` rows as their dates pass — there's no cron in a mock, and a real backend has the same problem unless overdue status is computed at write time by a scheduled job. The resolver derives it:

```
a SCHEDULED touchpoint reads as OVERDUE once
  now > scheduledAt + org.settings.touchpointOverdueDays
```

`touchpointOverdueDays` (3, in the fixtures) existed in `organization.settings` since Phase 1 but was unused until now. **The interpretation is a guess**: a grace period after the scheduled date, not the deadline itself — a touchpoint due yesterday isn't yet overdue if the grace period hasn't elapsed. This isn't naive "any past date is overdue" logic (verified against a fixture one day past due that correctly still reads `SCHEDULED`), but if `touchpointOverdueDays` is meant to configure something else entirely, this derivation needs correcting.

---

## 2. Gaps — features named in the plan with nothing to call

| # | Feature | Status |
|---|---|---|
| 2.1 | Org signup / workspace creation | **Open.** No `signUp` / `createOrganization` mutation — `/signup` is a validated but inert form |
| 2.2 | SSO / SAML | **Open.** No way to get an authorization redirect URL — `/sso` collects a domain and stops |
| 2.3 | Org KPI dashboard | **Open**, and now the most notable remaining gap (see the top of this doc). `/` still over-fetches and counts client-side. Phase 6 built a second, purpose-built aggregate (`atRiskCompanies`, §1 invented-fields) rather than wait on this one — the same server-side-aggregation approach should extend here |
| 2.4 | Global search | **Open.** No `search` query — `/search` is a placeholder |
| 2.5 | Notifications | **Open.** No `notifications` query, unread count, or mark-as-read mutation — the topbar bell is disabled, and the portal's "we'll email you" copy has nothing behind it |
| 2.6 | Org-wide change request queue | **Stubbed**, needs confirming — see §1.12 |
| 2.7 | Milestone approval | **Stubbed**, needs confirming — see §1.11 |
| 2.8 | Comments with @mentions | **Partially stubbed** — see §3 invented-fields / `addComment`. @mentions themselves are still missing |
| 2.9 | Document upload | **Stubbed** as a two-step presigned flow — see §4.6 |
| 2.10 | Contacts CRUD | **Stubbed**, needs confirming — see §1.6 |
| 2.11 | Project/task updates | **Stubbed**, needs confirming — see §1.8. Delete/archive still missing |
| 2.12 | Phases | **Stubbed**, needs confirming — see §1.8. Phase reordering still missing |
| 2.13 | Tags & saved views | Read side (`Query.tags`) **stubbed** — see §1.7. Tag *management* (create/rename/delete) still missing entirely |
| 2.14 | Approvals inbox query | **Open.** `/portal/approvals` is built by fetching every project → every milestone → every approval and flattening client-side, which over-fetches badly at real scale. Wants `pendingApprovals(scope: ApproverScope): [Approval!]!` returning the caller's own outstanding approvals across entity types with enough context to render a row — change requests will want the identical thing, worth designing once |
| 2.15 | Deep-link queries | **Open.** No `Task(id)`, `milestone(id)`, or equivalent single-entity lookups outside their parent list. Blocks task deep links, approval-from-email links, etc. — not urgent until notifications (2.5) exist to link *from* |

---

## 3. Invented fields (read-only conveniences)

All read-only. Added because computing the value client-side would be slow (needs the whole nested collection just to count it), wrong (depends on joining polymorphic rows the client can't see), or impossible from what the contract otherwise exposes.

| Type.field | Why |
|---|---|
| `Project.completionPercent: Int!` | Portal progress bars, project cards. **The formula is undefined** — see §4.7, this is also a BLOCKING-adjacent item |
| `Company.healthScoreTrend: [HealthScorePoint!]!` | The health-score sparkline the quality bar calls for |
| `Company.contactCount`, `.projectCount`, `.openChangeRequestCount`, `.primaryContact` | Avoids fetching three full nested arrays per row just to count them on the list screen. `openChangeRequestCount`'s definition of "open" (not `APPROVED \| REJECTED \| CLOSED \| IMPLEMENTED`) is a guess — please confirm, since it drives PM attention |
| `Contact.fullName`, `.activity` | Server-side name concatenation; `.activity` is a **merged, reverse-chronological feed** of audit rows plus touchpoints/change requests/projects scoped to one person — see §4.8, this is a bigger assumption than it looks |
| `Contact.updatedAt`, `.bestTimeToContact`, `.doNotContact` | "Last updated" column and communication-preference fields named in the plan's prose but missing from the table list |
| `ChangeRequest.reference: String!` | Human-readable "CR-1042" for client conversations, instead of a raw UUID |
| `ChangeRequest.decisionReason: String` | Rejection reason shown to the client |
| `ChangeRequest.awaitingParty`, `.responseDueAt`, `.isOverdue` | See §1.12 |
| `Approval.approverName: String` | "Waiting on Marcus Bell" — approvals are polymorphic so the client can't join a user/contact itself. **Should become a foreign key** — see §4.1 |
| `Comment.authorName`, `.authorAvatarUrl` | Same polymorphism as `Approval.approverName` |
| `Document.name`, `.mimeType`, `.sizeBytes` | The original contract only lists `file_url`; a file list needs a name and size without parsing a URL |
| `ActivityEntry.summary: String!` | Rendering a readable line from a raw `diff` jsonb would duplicate business logic in JS; the server should own the sentence |
| `Task.orderIndex`, `Milestone.orderIndex` | Kanban and plan ordering need to be stable and persistable — see §1.9 |
| `Task.dependents: [Task!]!` | Not yet added, but should be — see §1.10 |
| `Project.team: [User!]!` | "Project team assignment" is in the plan's prose with no backing table; the mock backs it with a `teamIds` list that needs a real join table |
| `Organization.settings: JSON` | Approval thresholds, SLA windows, `touchpointOverdueDays`, `retentionNoContactDays` — all the config the frontend currently hard-codes or infers; see §4.5 |
| `Address` as an object type | The plan stores `address` as jsonb; the stub types it structurally rather than treating it as opaque JSON |
| `RetentionSequence.activeEnrollmentCount: Int!` | Same "avoid fetching the whole collection to count it" pattern as the `Company` counts above |
| `AtRiskCompany` (aggregate type) | `reasons: [AtRiskReason!]!`, `overdueTouchpointCount`, `lastTouchpointAt`, `activeEnrollments` — backs `atRiskCompanies: [AtRiskCompany!]!`, the Phase 6 aggregate query built the way the org dashboard (gap 2.3) should be. Reasons, not a flag: a company can be flagged for low health score, overdue touchpoints, or going quiet, in any combination — this mattered in practice (a healthy 82-score company surfaced purely because nobody had logged a touchpoint in 82 days, a signal a single threshold would have missed). Three thresholds inside it are invented and belong in `organization.settings`, not hardcoded: `LOW_HEALTH_SCORE` (< 45, matching `getHealthBand()`), `OVERDUE_TOUCHPOINTS` (§1.18's derivation), `NO_RECENT_CONTACT` (30 days, via `retentionNoContactDays`) |

---

## 4. Design questions worth settling (recurring, not always strictly blocking)

### 4.1 Approver identity should be a foreign key, not a name string

Both milestone and change-request approval answer *"is this waiting on me?"* by comparing the signed-in user/contact's display name against `Approval.approverName`:

```js
const isYours = pending.approverName === viewerName;
```

That's fragile in ways a real deployment will hit: two people with the same name, a name changed after the approval was created, or any formatting difference. **`Approval.approverContactId` / `approverUserId`, or an `approver` union, would fix it properly.** Until then the comparison lives in exactly one place (`app/lib/approvals.js`), so there's exactly one line to change when this is resolved.

### 4.2 Decide-mutations take the entity id, not the approval id

Both `decideMilestoneApproval` and `decideChangeRequest` take the milestone/change-request id, mirroring what was asked for — but it's the weaker choice. The server has to infer *which* pending `Approval` row a decision belongs to from `approverType` plus the caller's identity. Taking the **approval id** instead would be unambiguous, would support several approvers on the same side cleanly (a second internal sign-off, a co-signing contact), and would make "this approval was already decided" a natural error rather than a lookup miss. Flagging as a design question, not a blocker — the mock works either way.

### 4.3 Several inputs are full-replace where a patch would serve better

The company header's status dropdown has to resend `name` alongside `status` to satisfy `CompanyInput.name: String!` — the one place the UI currently does something slightly dishonest to work around a full-replace input. Same shape problem as contacts (§1.6) and tasks/projects/milestones/phases (§1.8). A dedicated `updateCompanyStatus(id: ID!, status: CompanyStatus!)`, or all-optional patch inputs generally, would make optimistic updates much cleaner across the board.

### 4.4 Currency, raised independently in four modules

There is no currency field anywhere in the contract — `Contract.value`, `Project.budget` / `.actualCost`, and `ChangeRequest.impactCost` are all bare numbers. The frontend hard-codes GBP in `app/lib/format.js`. This was hit independently while building companies, projects, change requests, and — as a deliberate point of relief — was the *one* module (retention) with no monetary figures anywhere. An org-level currency, or a currency per contract, is needed before any of these numbers are shown to a client for real. Related: `app/lib/format.js` also pins `en-GB` and UTC for date rendering, deliberately, to avoid server/client hydration mismatches — real per-user or per-org locale would replace it.

### 4.5 SLA and threshold values are invented and belong in org settings

Two separate instances of the same shape of problem:

- **Change-request response SLA.** `org.settings.changeRequestSlaHours: 48` exists in the Phase 1 fixtures but only as one flat number. The mock instead uses a four-tier, per-status table (`RESPONSE_SLA_DAYS`, §1.12) as a guess at what "granular enough to be useful" looks like — not a real policy. Per-status may also be the wrong granularity: a `HIGH` priority request arguably deserves a shorter SLA than `LOW`, which the current shape can't express.
- **At-risk thresholds.** `LOW_HEALTH_SCORE`, `OVERDUE_TOUCHPOINTS`'s grace period, and `NO_RECENT_CONTACT`'s window (§3) are all hardcoded numbers duplicated from `app/lib/status.js` on purpose, so the two copies can be diffed.

Both should become `organization.settings` the backend owns and the frontend reads — this is a product conversation about what's configurable per-org, not just a schema one.

### 4.6 Document upload — open questions on the presigned flow

```graphql
requestUploadUrl(input: UploadRequestInput!): UploadTicket!
confirmUpload(input: ConfirmUploadInput!): Document!
```

Standard two-step presigned flow: ask where to PUT, transfer, then confirm. The mock issues a fake `uploadUrl` and the client explicitly skips the transfer (the branch is visible in `document-upload.jsx` and disappears once real URLs arrive) rather than faking a request that would 404.

- **Is `confirmUpload` needed at all?** Some backends have the storage service call a webhook instead — if so, the client needs something to poll or subscribe to.
- **Who may upload what?** The portal lets a client attach a file to their own company or project; server-side authorization for that is assumed, not implemented.
- **Versioning**: the mock bumps `Document.version` on same-name re-upload to the same entity. Confirm that's intended rather than a second row.
- No virus scanning, size limit, or MIME allowlist is expressed in the schema. The client caps at 25 MB; the server needs its own limit, and a `Document.scanStatus` would let the UI say "still being checked" instead of offering a download immediately.

### 4.7 `Project.completionPercent` formula is undefined

Shown on the project header, the project list, and — leading the page — the client portal, and currently a **stored** value that doesn't move when tasks change status. The board can say "6 of 17 done" while the header says 62% and disagrees with it. The frontend deliberately does not recompute this client-side — the weighting (task count? estimated hours? milestone completion?) is a business rule, not a presentation choice — but it needs a real formula, and it needs to update when tasks do, or a client will eventually ask why the two numbers don't match. `taskCompletion()` in `app/lib/project.js` derives an honest "N of M tasks done" count the UI shows alongside it as a stopgap.

### 4.8 `Contact.activity` / `Company.activity` — does the server merge, or does the client?

The plan asks for "all touchpoints, projects, change requests, notes in one feed." The stub resolves both as a **merged, reverse-chronological feed** of audit rows *plus* touchpoints, change requests, and projects — not just the raw activity-log table. This is the single biggest assumption in the companies module: if the real `activity` field returns only audit-log rows, every timeline needs three or four extra queries and client-side merging, and pagination becomes impossible. Strong preference for the server merging. Also currently unbounded (the UI shows the newest 12) — a real account will have thousands, so `activity(page: PageInput): ActivityConnection!` is the natural shape once this is confirmed.

`ActivityEntry.entityType` / `.entityId` are also now used for icon selection and (eventually) deep links, so they need to stay stable identifiers, not display strings.

### 4.9 No real audit trail — several screens reconstruct history from field presence

The change-request "History" timeline and the milestone approval history are both reconstructed from `createdAt`, whether `assessmentNotes` is populated, and approval `decidedAt` timestamps — not from a real event log. Right now "assessed" and "submitted" can only be told apart by which fields happen to be populated, not by an actual event. A real `ActivityEntry` feed (§4.8) would replace this outright and fix the ordering problem too.

### 4.10 Two mutations added without being asked for, because the flow had dead ends without them

- **`withdrawChangeRequest(id, reason)`** — a client with an open request they no longer want had no way to cancel it. Closes the request, rejects any outstanding approval rows, records the reason. Portal-only in practice.
- **`assignChangeRequest(id, assignedPmId)`** — a submitted request with no PM assigned had no path to get one, since `assignedPmId` only ever defaulted from the project at creation. Internal-only.

Both are guesses at what's needed, not confirmed requirements — flagging so they can be reconciled with the real workflow, particularly whether withdrawal should be soft (as built) or fully deletable.

---

## 5. Smaller items, by module

Grouped here rather than left scattered — none are blocking on their own, but each is a real question with no answer yet.

**Companies & contacts**
- `CompanyFilter.search` is assumed to match name **and** industry — confirm what the server actually searches so the UI's placeholder copy doesn't lie.
- Sortable columns (`name | status | healthScore | updatedAt`) — same "reject unknown sort keys" note as §1.4.

**Projects & planning**
- `ProjectFilter` has no date filters (`endsBefore` / `endsAfter` would cover "ending this quarter" / "overdue").
- `Milestone.tasks` includes subtasks as well as top-level tasks, so a milestone's "N of M" and its phase's "N of M" count differently. Confirm which is intended.
- Subtasks are assumed to be **one level deep** and to **belong to the same project as their parent** — the task form won't offer a subtask as a parent, but nothing stops the API from allowing it. Should be enforced server-side.

**Client portal & approvals**
- `Approval.createdAt` is used for "how long has this been sitting" — confirm it means "sent for approval", not "row created" (they can differ if approvals are pre-created).
- The portal shows raw `ProjectStatus` / `ProjectHealth` / `MilestoneStatus` to clients, including `AT_RISK` and `DELAYED`. Deliberate transparency call, but it's a **product** decision as much as a technical one — worth confirming clients are meant to see "Delayed" on their own project.
- Every contact with `portalAccessEnabled` currently sees every project for their company — there's no per-project or per-contact restriction in the schema. Fine for now; flagging before anyone assumes finer-grained access exists.

**Change requests**
- `revisionCount` increments on every `assessChangeRequest` call, including the first — a request assessed once shows revision 1, not 0. Confirm that matches intent.
- Reassessing a `PENDING_APPROVAL` request only tops up approval rows that don't already exist rather than resetting existing ones. Does revising mid-flight need to reset both approvals, or only add what's missing?
- No `ChangeRequestType`-specific validation — a `BUDGET_CHANGE` and a `BUGFIX` go through an identical form. The plan may want type-specific required fields eventually.
- `ChangeRequestInput.attachmentIds` exists but the portal submission form doesn't collect any yet — needs the presigned-upload flow (§4.6) wired in first.

**Retention**
- `assigneeRole: UserRole` on a sequence step is advisory only — nothing assigns the *generated* touchpoint to that role's user or anyone; `Touchpoint.createdBy` is null for every sequence-generated touchpoint. If steps should route to a specific person's queue, that needs its own field on `Touchpoint`.
- No email/task-sending side effect anywhere — enrolling books `Touchpoint` rows but nothing sends anything, same as every other "logged" record in the mock. Worth restating here since retention's entire premise is "this should happen automatically."

---

## 6. Not yet reviewed

Billing/invoicing, contracts & e-signature, workflow automation, and the public API have no representation in the contract yet. All Extended-tier in the master plan, so not urgent — flagging so they aren't forgotten at schema-freeze time.

---

## Appendix: a real bug this project found, unrelated to the schema

Worth keeping even though it's not a backend question, because it cost significant time and will bite anyone else generating GraphQL documents from hand-written `.graphql` files: **a backtick inside a GraphQL description string breaks the generated `documents.js`.**

A query description used `` `<Select>` `` — backtick-quoted, the way this codebase formats inline code in prose. GraphQL Code Generator embeds each operation's source text verbatim inside a JS template literal (`` export const XDocument = gql`...`; ``) and does **not** escape backticks when doing so. The stray backtick silently closed the JS template literal early, and everything after it in the generated file was reinterpreted as JS source until the next backtick happened to close it again — corrupting the file in a way that only surfaced as a downstream `GraphQLError: Syntax Error: Unterminated string` when some *other*, unrelated document was parsed.

The failure signature is worth recognising: it reproduced in `next build`'s "Collecting page data" step, blaming a different, seemingly random pre-existing route on every run, and in `vitest run` (unrelated tool, but the one that finally gave an unminified stack trace pointing at `readBlockString` and made the cause findable) — but **never** in `next dev`, and never replaying the same query directly against a running server with `curl`. It looks exactly like a build-tool race condition (different bundler, different worker, different route each time) right up until you check the generated output file for an unescaped backtick.

Fixed by removing the backtick from the description. Worth adopting project-wide: nothing currently stops this recurring, since backtick-quoted inline code is how the rest of this documentation is written. A codegen config flag to escape/reject backticks in descriptions, or a pre-commit check against backticks in `.graphql` files, would catch this before it reaches `documents.js`.
