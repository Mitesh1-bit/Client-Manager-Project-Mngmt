# API integration runbook

Step-by-step wiring of the Next.js frontend to the FastAPI GraphQL backend.
Run tests after each phase before continuing.

## Prerequisites

1. PostgreSQL running; backend migrated (`alembic upgrade head`).
2. Seed admin: `python scripts/seed_phase1.py` from `backend/`.
3. Copy `frontend/.env.local.example` → `frontend/.env.local`.

## Start services (non-destructive)

```powershell
# Terminal 1 — backend
cd d:\agency-CRM\backend
.\scripts\start_dev.ps1

# Terminal 2 — frontend
cd d:\agency-CRM\frontend
npm run dev
```

## Phase 0 — Connectivity

| Check | Command |
|-------|---------|
| Backend unit tests | `cd backend && .\venv\Scripts\python.exe -m pytest tests\ -q` |
| GraphQL status | `node frontend/scripts/integration/phase0-connectivity.mjs` |

**Done when:** `{ status }` returns `ok` on backend and via `/api/backend/graphql`.

## Phase 2 — Companies & contacts

- Backend: `users` query, company `accountOwner`, counts, `primaryContact`
- Frontend: flat `companies` list + client-side pagination/filter (`app/lib/api/connection.js`)
- Status mapping: API lowercase ↔ UI enums (`app/lib/api/normalize.js`)
- GraphQL codegen uses `schema.backend.graphql` (exported from backend)

## Phases 3–7 — Projects, CRs, portal, retention, contracts/invoices

Operations aligned to backend in `app/lib/graphql/operations/*.graphql`.
Some UI features remain read-only until backend exposes matching mutations
(comments, assign PM, withdraw CR, log touchpoint, edit sequences).

```powershell
node scripts/integration/phase2-7-smoke.mjs
```

## Phase 1 — Auth bridge

| Area | Change |
|------|--------|
| Backend | `me` query (`app/graphql/viewer/schema.py`) |
| Frontend | GraphQL proxy, JWT `actor_type` → `scope`, login flow |
| Security | Invalid creds, anonymous `me`, auth-gated queries |

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest tests\test_viewer.py -q

cd ..\frontend
$env:SEED_ADMIN_EMAIL="..."; $env:SEED_ADMIN_PASSWORD="..."
node scripts/integration/phase1-auth.mjs
```

Manual: sign in at `/login` with seed admin → land on `/dashboard`.

## Phase 2 — Companies & contacts (next)

Backend exposes flat `companies: [CompanyType!]!` (no pagination). Frontend list pages
expect `CompanyConnection` — align GraphQL operations and UI incrementally.

## Phase 3+ — Projects, planning, change requests, portal, retention, invoices

Follow backend module order; run targeted pytest + smoke after each:

```powershell
cd backend
.\venv\Scripts\python.exe scripts\smoke_test_full.py
```

## Security checklist (each phase)

- [ ] Unauthenticated mutations/queries rejected
- [ ] Cross-tenant data not visible (RLS — backend tests)
- [ ] Tokens not exposed to client JS (httpOnly session cookie)
- [ ] CORS limited in production (`CORS_ALLOWED_ORIGINS`)
- [ ] `COOKIE_SECURE=false` only for local HTTP dev

## Mock vs real API

| Mode | `NEXT_PUBLIC_GRAPHQL_URL` |
|------|---------------------------|
| Fixtures (default) | `/api/graphql` |
| Real backend | `/api/backend/graphql` |

Demo account picker appears only in mock mode.
