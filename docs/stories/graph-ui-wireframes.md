<!--
Wireframe checklist and tasks for Graph Explorer UI
--> 

# Graph Explorer — Wireframe Checklist

Purpose: provide a minimal set of wireframes to validate layout, primary interactions, and responsive behavior before prototyping in `dev-playground`.

Pages / Views to produce
- Desktop: Full Graph Explorer layout (Left: Query/Connections, Center: Canvas, Right: Inspector, Top controls, Bottom results drawer)
- Tablet: Collapsible side panels and stacked controls
- Mobile: Query-first experience with canvas as secondary (simplified inspector)
- Modal states: Connect dialog, Node/Edge Edit modal, Export modal

Primary components to wireframe
- Top Bar: Connect, Run, Layout, Import/Export, Search
- Query Panel: `QueryEditor` with parameters, history, and Run button
- Graph Canvas: node labels, edges, selection state, mini-map placement
- Inspector Panel: properties, actions, related nodes list
- Results Drawer: table view toggle, export CSV, pagination

Interaction flows to illustrate (minimum set)
- Run query → results render on canvas → click node → inspector opens
- Double-click node → expand neighbors (show loading state) → new nodes add to canvas
- Drag node → re-position and pin → undo action
- Multi-select (shift/drag) → group action (export/delete)
- Keyboard shortcut: focus query (`/`), find (`F`), escape to close panels

Wireframe fidelity & annotations
- Low-fidelity wireframes for all views first (desktop + tablet + mobile)
- Annotate each wireframe with: component names, interactions, keyboard shortcuts, expected data shown, accessibility notes

Deliverables
- `docs/stories/graph-ui-wireframes.md` (this file)
- Figma/PNG exports or image files placed under `docs/stories/figures/graph-ui/`
- A checklist of components to implement in `dev-playground`

Next actions
1. Produce desktop low-fidelity wireframe and add PNG to `docs/stories/figures/graph-ui/`.
2. Add tablet and mobile variations.
3. Review with stakeholders; update PRD if layout or scope changes.
