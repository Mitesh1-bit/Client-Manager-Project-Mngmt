# Client & Project Management Platform — Frontend

Next.js 16 (App Router, JavaScript, Turbopack) frontend for the multi-tenant client/project management platform. The FastAPI + Strawberry GraphQL backend is built separately; this app treats the GraphQL schema as a contract it consumes.

## Getting started

```bash
npm install
npm run codegen   # generate GraphQL documents from schema.graphql
npm run dev       # http://localhost:3000
```

Sign in with any of the demo accounts listed on the login page. Password: `meridian`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run codegen` | Regenerate `app/lib/graphql/generated/documents.js` from `schema.graphql`; **fails if any operation references a field the schema doesn't have** |
| `npm test` | Vitest unit tests |
| `npm run lint` | ESLint, including strict `jsx-a11y` |

There's no TypeScript compiler here, so codegen and ESLint are the two safety nets. CI should run `npm run codegen` and fail on an uncommitted diff — that's what catches contract drift.

## Layout

```
app/
├─ (auth)/            login, signup, sso — shared split-screen layout
├─ (dashboard)/       internal team, owns the authenticated root (/, /companies, /projects, …)
├─ (client-portal)/   external clients, all under /portal
├─ api/
│  ├─ graphql/        local mock endpoint (graphql-yoga) — delete with the mocks
│  └─ auth/session/   httpOnly session cookie plumbing — delete once the API sets it
├─ components/
│  ├─ ui/             shadcn primitives (JSX, owned by us)
│  └─ domain/         StatusBadge, PageHeader, EmptyState/ErrorState, UserMenu, …
└─ lib/
   ├─ auth/           token decoding, route protection rules
   ├─ graphql/        Apollo (RSC + browser), operations/*.graphql, generated documents
   ├─ mocks/          fixtures + resolvers
   └─ status.js       every status enum → label, tone, icon
proxy.js              route protection (Next 16's renamed middleware convention)
schema.graphql        local stub of the backend contract
```

Route groups don't add URL segments, so `(dashboard)` and `(client-portal)` would have collided on `/projects/[id]`. The portal is prefixed with `/portal`; the internal app owns the root.

## Design system

Tokens live in one place: `app/globals.css`. Spacing, radius, a named type scale (`text-caption` → `text-display`), elevation, and a six-tone status palette (`positive`, `caution`, `critical`, `info`, `neutral`, `accent`) with matching `-bg` / `-fg` / `-border` values for light and dark.

Status enums map to tones in `app/lib/status.js` — one registry, so `on-track / at-risk / delayed` and `approved / pending / rejected` are defined once and reused everywhere. `<StatusBadge>` always pairs the colour with an icon and a text label, so status never depends on colour alone.

The client portal re-scopes the palette under `[data-surface="portal"]`: teal instead of indigo, larger radii, a narrower measure, horizontal nav on desktop and a bottom tab bar on mobile. It is deliberately not a reskinned internal dashboard.

## Working without the backend

Everything runs against a local mock so screens are demoable before the API exists:

- `schema.graphql` — stub of the contract (Query/Mutation verbatim from the spec; object and input types inferred from the data model)
- `app/lib/mocks/data.js` — deterministic fixtures, dates anchored to "now" so overdue/at-risk states stay realistic
- `app/lib/mocks/resolvers.js` — resolvers over those fixtures, including portal scoping (a client token can only ever read its own company)
- `app/api/graphql/route.js` — graphql-yoga endpoint

**To switch to the real backend:** set `NEXT_PUBLIC_GRAPHQL_URL`, point `codegen.js` at the live schema, then delete `app/lib/mocks/`, `app/api/graphql/`, `app/api/auth/session/` and `schema.graphql`. No component changes.

Assumptions made about fields and types that weren't explicit in the spec are tracked in [NEEDED_SCHEMA_CHANGES.md](./NEEDED_SCHEMA_CHANGES.md).
