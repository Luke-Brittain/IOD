# Technical Description — Olive Branch

## Application Overview

**Purpose:** Olive Branch is a manual-first data lineage and data catalogue that treats governance as a first-class part of the model and UI. It centers on a lineage canvas, role-scoped landing view, CSV-first ingestion for the MVP, and a right-hand details panel for node metadata and governance.

**Architecture Pattern:** Next.js (App Router) with Server Components for server-first rendering, client components where interactivity is required (canvas, details panel, chat), and a thin API/service layer for data access and graph queries.

**Key Capabilities:**
- Role-scoped landing view (Person-in-Role centric subgraph expansion).
- Visual lineage canvas with add-node/add-edge, filtering, and CSV import.
- Right-hand details panel showing metadata, relationship summary, and governance (owners/stewards).
- CSV-based upsert import (merge-preserving, no blank overwrite).
- Graph-backed relationship model with Supabase for transactional data and a graph DB for relationship queries and traversals.

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 15 (App Router) | Server components for fast SSR, built-in routing and API routes. |
| Language | TypeScript | Static types, clearer contracts, and JSDoc support (per Documentation Rules). |
| Styling | Tailwind CSS (design tokens) | Utility-first styling and easy theming to achieve the premium aesthetic. |
| Graph DB | Neo4j or Memgraph | Efficient relationship queries and traversals for lineage and ownership graphs. |
| Relational DB | Supabase (Postgres) | Lightweight transactional storage for node attributes, audit logs, CSV uploads, auth integration. |
| Auth | Supabase Auth | Simple integration with Supabase and secure session management. |
| State | React Server Components + local client state | Minimize client bundle; canvas and detail panel use client components. |
| Tests | Vitest + jsdom | Fast unit and DOM testing during CI. |
| CI / Packaging | pnpm (workspaces), GitHub Actions | Reproducible installs (`--frozen-lockfile`) and workspace-aware installs. |
| AI / LLM (future) | OpenAI / Anthropic | Suggested for explainable lead scoring, chat assistant, and annotations. |

---

## Project Folder Structure (recommended)

```
OliveBranch/
├── app/                          # Next.js App Router (pages & server components)
│   ├── (auth)/                   # Auth routes
│   ├── (app)/                     # Main app routes (canvas, details)
│   ├── api/                      # API route handlers (server-only)
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── ui/                       # Base UI (Button, Card, Input)
│   ├── canvas/                   # Lineage canvas & helpers
│   └── details/                  # Details panel components
├── lib/                          # Utilities (supabase client, graph client)
├── services/                     # Business services (import, validation, graph queries)
├── types/                        # TypeScript definitions and interfaces
├── docs/
│   ├── stories/                  # User stories
│   └── technical-description/    # This file
├── .github/
│   └── instructions/             # Documentation Rules and other AI guidance
└── prototype/                    # Optional Vite prototype (local dev)
```

---

## Data Models

All exported interfaces must include JSDoc comments and avoid `any` (see Documentation Rules).

```typescript
/**
 * System-level object (top-level container for datasets/tables)
 */
export interface System {
  id: string;
  name: string;
  description?: string;
  ownerId?: string; // PersonInRole id (inherited by child assets)
  createdAt: string;
  updatedAt?: string;
}

/**
 * Dataset container (contains tables or tables may be directly under System)
 */
export interface Dataset {
  id: string;
  name: string;
  systemId: string;
  stewards?: string[]; // PersonInRole ids
  createdAt: string;
  updatedAt?: string;
}

/**
 * Table within a dataset
 */
export interface Table {
  id: string;
  name: string;
  datasetId: string;
  stewards?: string[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * Field (column) metadata
 */
export interface Field {
  id: string;
  name: string;
  tableId: string;
  pii: boolean; // mandatory Yes/No in MVP
  dataType?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Calculated metric or report
 */
export interface CalculatedMetric {
  id: string;
  name: string;
  primarySystemId?: string; // Option A: Primary System anchor
  derivedFromIds: string[]; // node ids it derives from
  createdAt: string;
  updatedAt?: string;
}

/**
 * Person-in-Role representing governance contacts
 */
export interface PersonInRole {
  id: string;
  fullName: string;
  role: 'Data Governance Lead' | 'System Administrator' | 'Data Owner' | 'Data Steward' | string;
  email?: string;
  createdAt: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
```

Notes:
- Ownership model: System -> Datasets/Tables inherit Owner (System.ownerId).
- Stewardship applies to Datasets and Tables only in MVP.
- Field-level PII is a required boolean flagged on `Field.pii`.

---

## API Endpoint Specification (suggested)

- `GET /api/nodes?roleScoped=true` — List nodes visible to a Person-in-Role (role scoped landing view) with optional graph expansion params.
- `GET /api/nodes/:id` — Get node details (metadata + relationships summary).
- `POST /api/import/csv` — Upload CSV template; server merges per stable keys. Blank values do not overwrite existing values.
- `POST /api/nodes` — Create node (System/Dataset/Table/Field/Metric).
- `PATCH /api/nodes/:id` — Update node metadata (honour merge & blank rules).
- `GET /api/graph/traverse` — Graph traversal endpoint (upstream/downstream) with depth/cap parameters.
- `GET /api/graph/expand` — Expand subgraph from a seed Person-in-Role with configurable cap and pagination.
- `POST /api/graph/edge` — Add edge (contains/derived_from/owns/stewards).
- `GET /api/csv/template` — Download canonical CSV template for imports.

Request/response examples, status codes, and validation rules should be added inline to each route implementation (see Documentation Rules for API doc formatting suggestions).

---

## Component Hierarchy

```
App (layout)
├─ Header
├─ LeftToolbar
│  ├─ Select/Pan
│  ├─ Add Node
│  ├─ Add Edge
│  └─ Import CSV
├─ Canvas (client component)
│  ├─ Node
│  ├─ Edge
│  └─ GraphRenderer
└─ DetailsPanel (client component, opened on double-click)
   ├─ Core metadata (global + business fields)
   ├─ Relationship summary (upstream/downstream)
   └─ Governance section (Owner, Stewards)
```

Implementation notes:
- Default to Server Components for pages; make `Canvas` and `DetailsPanel` `use client` components.
- Co-locate hooks for canvas interactions under `components/canvas/hooks`.

---

## CSV Import Behaviour (MVP)

- Upsert by stable keys (configured per node type).
- Additive edges: imports add edges; deletions are not supported in MVP unless explicit behaviour is introduced.
- Blank cells do not overwrite existing values.
- Import API should return per-row status with error codes for conflicts or validation failures.

---

## Design Guidelines & Tokens

Follow the premium aesthetic and Documentation Rules for accessible contrast and typography.

- Primary colors: deep navy, teal/cerulean accent, warm gold for highlights.
- Backgrounds: white / off-white surfaces.
- Typography: refined serif for headings and Inter for body.
- Spacing: generous whitespace for clarity.
- Animations: subtle entrance transitions for panels.

Include a shared `design-tokens.css` or Tailwind config with color variables and spacing scale to enforce consistency.

---

## Security & Governance

- Never expose secrets to the client; use server-only environment vars for DB/graph credentials.
- Use parameterized queries for graph/SQL operations and sanitize CSV inputs.
- Implement role-based access checks on API routes (owner/steward visibility rules).
- Log import operations and keep an audit trail for CSV merges.

---

## Testing & CI

- Unit tests with Vitest and DOM tests via jsdom for small canvas interactions.
- Integration tests for API import flows.
- CI: GitHub Actions with pnpm workspaces and `--frozen-lockfile`; commit pnpm lockfiles to repo for reproducible builds.

---

## Documentation Checklist (required before merge)

- [ ] All exported functions and data models include JSDoc comments (see Documentation Rules).
- [ ] API endpoints include request/response examples and error codes.
- [ ] Component hierarchy reflects actual page structure.
- [ ] Types are explicit (no `any`).
- [ ] README updated with developer setup and lockfile policy.
- [ ] CHANGELOG entry for this architecture draft.

---

## Sources & References

- Transcript: [OliveBranch/Transcript](OliveBranch/Transcript)
- Documentation Rules: [.github/instructions/Documentation Rules.instructions.md](.github/instructions/Documentation%20Rules.instructions.md)

---

## Next steps

- Review this draft against the repository-specific constraints and CI policies; I can iterate to add route-level examples, OpenAPI schemas, or a TypeScript types package.
- Optional: generate API route stubs and TypeScript types under `types/` and `services/`.
