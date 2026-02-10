<!--
ID: 01
Feature: Graph Explorer UI (Neo4j Aura style)
Author: Team
Created: 2026-02-09
-->

# 01 Graph Explorer UI - Implementation Plan & PRD

## Project Context
**Technical Stack:** Next.js 14 (App Router), React 18, TypeScript, TailwindCSS (design-system tokens + CSS Modules), Vite dev-playground for prototypes

**Backend / Infra:** Existing backend (NestJS / Postgres / Redis) or mocked local services for the dev preview. CI: GitHub Actions. Deploy: Vercel (FE) / Fly.io (BE).

**Goal:** Provide an interactive graph exploration UI inspired by Neo4j Aura that enables users to connect to a graph source, run queries, explore nodes/relationships visually, inspect metadata, and iterate quickly. The UI must be performant with medium-large graphs, accessible, and extensible from the existing `design-system`.

## User Story
As an analyst or product engineer, I want an interactive Graph Explorer so that I can visually explore relationships, run ad-hoc queries, inspect node/edge details, and quickly derive insights from graph data.

## Pre-conditions
- Graph API or mock service available exposing nodes/relationships and Gremlin/Cypher-like query endpoint (or a JSON-based graph export).
- User is authenticated and authorized to query and view the requested graphs.
- `design-system` tokens, `Badge`, `Modal`, and `ThemeProvider` are available in the monorepo and consumable by `dev-playground`.

## Business Requirements
- R1: Enable visual graph exploration workflows (connect → query → explore → inspect) with 90% of core flows completable within 3 minutes for an experienced user. (Metric: task completion time)
- R2: Support query-run-to-visualize cycle with results rendered as nodes/edges and as a tabular fallback. (Metric: 95% of queries render without UI errors)
- R3: Provide property inspection and edit capability for nodes/edges with role-based permissions. (Metric: 100% of edit attempts validated by backend)

## Technical Specifications

### Integration Points
- Authentication: reuse existing auth (session or JWT) and pass credentials to graph endpoints.
- Graph API: abstract adapter layer that supports at least JSON graph export and one query protocol (Cypher or parameterized JSON queries).
- Telemetry: emit events (query-run, node-click, expand) to existing analytics pipeline.
- Storage: optional local caching (IndexedDB) for large result sets and offline exploration.

### Security Requirements
- Enforce RBAC: queries and edits gated by permission checks server-side.
- Sanitize and limit query execution on server-side to prevent heavy/evil queries; provide a query preview and estimated cost where possible.
- Do not embed credentials in client bundles. Use short-lived tokens / ephemeral session for graph API access.

## Design Specifications

### Visual Layout & Components

Overall layout (Desktop primary):
- Left: Connection & Query Console pane (collapsible, 320–420px)
- Center: Graph Canvas (fluid, primary interaction area)
- Right: Inspector / Details Panel (collapsible, 320–420px)
- Top bar: Primary actions (Connect, Run, Import, Export, Layout, Settings)
- Bottom: Query results / timeline / logs (collapsible drawer)

Component list (to live in `design-system` and the feature folder):
- `GraphCanvas` — Pan/zoom surface (canvas or WebGL layer)
- `Node` / `Edge` primitives — Render styles and interaction states
- `InspectorPanel` — Node/edge properties, actions (edit, link, expand)
- `QueryEditor` — CodeMirror/Monaco with parameter/variable UI and run controls
- `ResultsTable` — Tabular fallback for query results
- `LayoutControls` — Force, hierarchical, radial presets
- `MiniMap` — Small overview + camera control

Design tokens & behaviors:
- Provide distinct node color palette per entity type in `design-system/tokens.ts`.
- Motion: subtle scale/fade transitions for node entry/exit; animate camera pan/zoom.
- Accessibility: keyboard navigation, ARIA on interactive panels, color contrast meeting WCAG 2.1 AA.

### Interaction Patterns
- Single-click: select node and open inspector
- Double-click: expand/egress (load neighbors)
- Drag: reposition node (local layout override)
- Lasso/multi-select: group operations (delete, export, add edge)
- Keyboard: Esc to close panels, / to focus query editor, F to find, Ctrl/Cmd+Z undo

## Technical Architecture

Project layout (suggested):
```
app/graph-explorer/
  ├─ page.tsx
  ├─ layout.tsx
  └─ components/
     ├─ GraphCanvas/
     │   ├─ index.tsx
     │   ├─ GraphCanvas.tsx
     │   ├─ useForceLayout.ts
     │   └─ styles.module.css
     ├─ QueryEditor/
     └─ InspectorPanel/
```

Rendering approach options (evaluate in prototype):
- React + SVG for small graphs (< 1k nodes)
- react-konva (Canvas) for medium graphs
- pixi.js / regl / WebGL for larger graphs (10k+ nodes) with level-of-detail

Layout & performance:
- Use `d3-force` or worker-based layout for physics
- Offload heavy layout to WebWorker; stream incremental layout updates to UI
- Implement node/edge virtualization & LOD (simpler rendering when zoomed out)

State management:
- Local component state for ephemeral UI
- Shared state via React Context or small Zustand store for selection, query history, and layout settings

API adapter pattern:
- `lib/graphAdapters/*` exposing a unified client: `connect()`, `runQuery()`, `fetchNeighbors(nodeId, depth)`

## Acceptance Criteria
- AC1: User can connect to a graph source and run a query; results render on the canvas.
- AC2: Clicking a node opens the Inspector with complete properties and actions.
- AC3: Query Editor supports parameterized queries, run, cancel, and result toggle (graph/table).
- AC4: Canvas supports pan/zoom, node drag, and selection for graphs up to 1,000 nodes with acceptable interactivity (<200ms response for core interactions).
- AC5: All interactive controls are keyboard accessible and pass a11y automated checks for the primary flows.

## Non-Functional Requirements
- Initial load < 2s for demo datasets
- Interaction latency < 200ms for select/pan/zoom on 500-node dataset
- Bundle size increase for new feature < 150KB (use dynamic imports for heavy libs)
- WCAG 2.1 AA compliance for key flows

## Milestones & Timeline (iterative)
- Week 0: Discovery, PRD (this doc), wireframes, core API adapters
- Week 1: Prototype GraphCanvas in `dev-playground` (react-konva) + QueryEditor scaffold
- Week 2: InspectorPanel + node/edge visuals + basic layout controls
- Week 3: Query integration, results table, and export/import
- Week 4: Interactions (drag, multi-select), accessibility fixes, and perf tuning
- Week 5: Tests (unit, integration, Playwright), docs, and demo polish

## Deliverables
- `docs/implementation-plans/01-graph-ui-plan.md` (this document)
- Wireframes & design tokens updates (in `docs/stories/`)
- Prototype demo in `dev-playground` (GraphCanvas + QueryEditor)
- Component library updates in `design-system` (Graph primitives, tokens)
- Tests and CI jobs to validate build and interactions

## Risks & Mitigations
- Risk: Heavy layout and rendering performance for large graphs.
  - Mitigation: Start with Canvas-based prototype and WebWorker layout; adopt WebGL only if needed.
- Risk: Query execution can be expensive/hazardous.
  - Mitigation: Server-side safeguards, query caps, timeouts and explain/preview features.
- Risk: Accessibility gaps for custom canvas elements.
  - Mitigation: Provide keyboard-first fallbacks, ARIA live regions, and tabular fallbacks for query results.

## Testing & QA
- Unit tests for `GraphCanvas` utilities and `lib/graphAdapters`.
- Integration tests for query → render workflows (React Testing Library).
- E2E Playwright tests for main flows: connect, run query, inspect node, expand neighbor.
- Visual regression snapshots for node/edge styles.

## Rollout & Monitoring
- Feature-flag the Graph Explorer for staged rollout.
- Instrument telemetry for key events: `connect`, `query.run`, `node.select`, `inspect.open`.
- Monitor client-side errors and slow interactions; create alert thresholds.

## Next Steps (actionable)
1. Review PRD with stakeholders and sign off on minimal viable dataset and query set.
2. Create wireframes for the desktop primary flow and a simplified mobile fallback.
3. Prototype `GraphCanvas` in `dev-playground` using a small sample graph and confirm rendering choice.
4. Implement API adapter and unit tests for `runQuery()`.

---
Date: 2026-02-09
