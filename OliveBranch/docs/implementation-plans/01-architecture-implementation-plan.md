# 01 Architecture & Technical Foundation - Implementation Planning

## Project Context
**Technical Stack:** Next.js 15 (App Router), React, TypeScript, Tailwind CSS, pnpm workspaces

**Backend:** Graph database (Neo4j/Memgraph) for lineage, Supabase (Postgres) for transactional attributes and auth

**Infrastructure:** GitHub Actions CI, pnpm workspaces, deploy targets TBD (Vercel/Render)

**References:**
- Technical description: `docs/technical-description/technical-description.md`
- Documentation rules: `.github/instructions/Documentation Rules.instructions.md`
- Code quality: `.github/instructions/Code Quality Standards.instructions.md`
- Architecture & design: `.github/instructions/Architecture & Design Guidelines.instructions.md`
- Contributing guide: `CONTRIBUTING.md`

---

## User Story
As a Data Governance Lead, I want a reliable, auditable lineage application where governance (Person-in-Role) is visible and editable so my team can assign ownership and stewardship and import metadata via CSV without destroying manual edits.

**Acceptance criteria (high-level):**
- Role-scoped landing view returns subgraph seeded at a Person-in-Role.
- Double-click on a node opens an editable details panel.
- CSV imports upsert by stable keys; blank cells do not overwrite existing values; import returns per-row status.
- System ownership is inherited by child assets; stewardship limited to Datasets/Tables in MVP.

---

## Pre-conditions
- Repository contains `docs/technical-description/technical-description.md` and the Documentation Rules.
- Team has decided to use pnpm workspaces and to commit pnpm lockfiles to repo (CI requires `--frozen-lockfile`).
- Provisioned credentials (server-only env vars) for Supabase and Graph DB for development/testing.

---

## Business Requirements
- Governance objects (Person-in-Role) must be editable and discoverable from lineage canvas.
- CSV import must be merge-preserving and provide actionable errors.
- UI must clearly show Owner (inherited) and Stewards (dataset/table-level).
- Access controls must enforce visibility by role (owner/steward/admin).

---

## Technical Specifications

### Data & Models
- Implement TypeScript interfaces (JSDoc for each) per `docs/technical-description` (System, Dataset, Table, Field, CalculatedMetric, PersonInRole, ApiResponse).
- Enforce `Field.pii: boolean` as mandatory; validations on import and edit.

### Persistence
- Node attributes and audit logs: Supabase (Postgres).
- Graph topology & traversal: Neo4j or Memgraph (use bolt/http client in `lib/graph/client.ts`).
- CSV upload storage: Supabase Storage or temporary server upload processing.

### API
- REST endpoints under `app/api/` (Next.js route handlers) following spec in technical description.
- Responses should follow `ApiResponse<T>` structure and include error codes.
- Implement server-side RBAC checks using Supabase auth/JWT.

### UI
- Server components for pages; `Canvas` and `DetailsPanel` as client components (`'use client'`).
- Left toolbar actions (select/pan, add node/edge, import CSV) implemented as accessible controls.
- Details panel supports read + edit modes; edits PATCH to `PATCH /api/nodes/:id` respecting blank-value merge rules.

### CSV Import Behaviour
- Parse CSV server-side with row-level validation using Zod (or similar). Errors returned per row.
- Upsert rules: configured stable keys per node type; blank cells ignored for existing nodes.
- Edges are additive; deletion unsupported in MVP.

---

## Design & UX
- Follow color tokens and spacing from Architecture & Design Guidelines; add `design-tokens.css` or Tailwind config.
- Headings use Merriweather (or similar) and body Inter.
- Keep interactions subtle and performant; canvas pan/zoom performant for ~500 nodes.

---

## Implementation Plan (phased)

Phase 0 — Repo & CI prep (1-2 days)
- Ensure `packageManager` set to `pnpm@10` and `pnpm-workspace.yaml` exists.
- Commit root `pnpm-lock.yaml` and ensure CI `--frozen-lockfile` passes locally.
- Add CI job to run lint, type-check, test (vitest).

Phase 1 — Core models & services (2-3 days)
- Add TypeScript interfaces under `types/` with JSDoc comments.
- Implement database clients: `lib/supabase/client.ts`, `lib/graph/client.ts`.
- Implement service layer: `services/nodeService.ts` (CRUD + import logic), `services/graphService.ts` (traversals).

Phase 2 — API routes & validation (3-4 days)
- Create Next.js route handlers in `app/api/` for nodes, graph, import CSV.
- Add validation schemas (Zod) and per-row error reporting.
- Add RBAC middleware and tests.

Phase 3 — Canvas & DetailsPanel (4-6 days)
- Implement `components/canvas/Canvas.tsx` (client), `components/details/DetailsPanel.tsx` (client).
- Wire events: double-click node -> open details panel; edit -> PATCH.
- Implement left toolbar and import CSV UI with progress/error UI.

Phase 4 — CSV import & audit (2-3 days)
- Implement server-side CSV parsing and import endpoint.
- Record audit logs (who imported, when, rows modified) in Supabase.
- Return per-row import status to UI and render results.

Phase 5 — Testing, polish & docs (2-4 days)
- Unit tests for services and components (Vitest + jsdom).
- Integration tests for import flows and RBAC checks.
- Update `docs/DEVELOPING.md` with exact setup steps, lockfile policy, and run commands.

Total estimated MVP implementation time: 2–4 weeks depending on team size and parallelization.

---

## API Examples (minimal)

**Get node details**

Request: `GET /api/nodes/rdx_123`

Response (200):
```json
{
  "success": true,
  "data": {
    "id": "rdx_123",
    "name": "orders.transactions",
    "type": "Table",
    "systemId": "sys_1",
    "stewards": ["pir_21"],
    "createdAt": "2026-02-01T12:00:00Z"
  }
}
```

**CSV import**

Request: `POST /api/import/csv` (multipart/form-data file upload)

Response (200):
```json
{
  "success": true,
  "data": {
    "summary": { "processed": 10, "created": 2, "updated": 6, "errors": 2 },
    "rows": [
      { "row": 1, "status": "updated" },
      { "row": 2, "status": "error", "code": "INVALID_PII", "message": "PII value missing" }
    ]
  }
}
```

(Implement full request/response examples for each route during Phase 2.)

---

## Testing Strategy
- Unit tests: services, validation, helpers (Vitest).
- DOM tests: `Canvas` and `DetailsPanel` interactions (jsdom).
- Integration tests: import CSV flow and RBAC enforcement.
- CI: run `pnpm -w install --frozen-lockfile`, `pnpm -w lint`, `pnpm -w test`.

---

## Security & Compliance
- Server-only secrets in env vars (`DATABASE_URL`, `GRAPH_DB_URL`, `API_SECRET_KEY`).
- Parameterized queries and input sanitization for CSV and API payloads.
- Audit logging for imports and metadata edits.
- Enforce least-privilege roles for operations.

---

## Risks & Mitigation
- Graph DB choice/time to provision: start with Memgraph (developer-friendly) or a hosted Neo4j trial; mock graph responses for early UI development.
- CSV import edge-cases (bad data): implement row-level validation and a robust preview + dry-run mode.
- CI reproducibility: require `pnpm-lock.yaml` commits and use CI caching keys; test cold-cache runs.

---

## Files To Add / Modify
- `types/` — add interfaces with JSDoc
- `lib/supabase/client.ts`, `lib/graph/client.ts`
- `services/nodeService.ts`, `services/graphService.ts`
- `app/api/nodes/route.ts`, `app/api/import/csv/route.ts`, `app/api/graph/*`
- `components/canvas/*`, `components/details/*`
- `docs/DEVELOPING.md` — update with precise commands and lockfile policy

---

## Developer Commands

Install & dev (root workspace):

```powershell
pnpm install
pnpm --filter ./prototype dev   # prototype only (if using prototype)
pnpm dev                        # run main Next app (if configured)
```

Run tests/lint:

```powershell
pnpm -w lint
pnpm -w test
pnpm -w build
```

---

## Acceptance Criteria (detailed)
- [ ] `GET /api/nodes?roleScoped=true&seedPir=pir_21&cap=100` returns a subgraph expanded to the cap.
- [ ] Double-clicking a canvas node opens editable details panel and `PATCH /api/nodes/:id` persists changes.
- [ ] `POST /api/import/csv` returns row-level statuses and does not overwrite existing non-blank values with blanks.
- [ ] Owner inheritance: creating a System with `ownerId` results in child assets returning that owner when requested.
- [ ] Tests covering import flow, node CRUD, and RBAC exist and pass in CI.

---

## Next Steps
1. Review this plan and approve scope for MVP.
2. Create a feature branch `feature/impl/architecture-mvp` and commit this plan.
3. Implement Phase 0 tasks (CI and types) and open PR with CI passing.

---

**Prepared by:** Implementation Planner
**Date:** 2026-02-08
