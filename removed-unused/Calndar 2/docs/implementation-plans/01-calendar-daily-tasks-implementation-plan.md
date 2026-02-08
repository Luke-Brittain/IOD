# 01 Calendar - Daily Tasks - Implementation Planning

## Project Context
**Technical Stack:** Next.js 15 (App Router), React, TypeScript, plain CSS (starter) / Tailwind recommended

**Backend (optional):** Supabase (Postgres) or small REST service for multi-device sync

**Deployment:** Vercel (frontend), optional backend on Fly/Render

## User Story
As a user, I want to add, view, and manage daily tasks on a calendar so that I can track what I need to complete each day and quickly see days that need attention.

Stories referenced:
- `docs/stories/01-add-tasks-to-day.md`
- `docs/stories/02-view-calendar-and-navigate.md`
- `docs/stories/03-persist-tasks-locally.md`
- `docs/stories/04-day-status-color-coding.md`

## Pre-conditions

- Browser environment with `localStorage` available for Phase 1 (single-user mode).
- Development environment: Node.js 18+, pnpm/npm, editor.
- For Phase 2 (sync): Supabase project or equivalent API and Auth configured.

## Business Requirements

- Fast, zero-install calendar accessible by opening `index.html` or as a Next.js page.
- Immediate visual feedback when tasks change (color-coded day tiles).
- Reliable local persistence; optional server sync for multi-device use.

Success metrics:
- Add/modify/delete tasks latency < 200ms in common browsers.
- Visual status updates happen instantly after user actions.

## Technical Specifications

### Core Components

- `CalendarPage` (Next.js page) — Renders month view and provides month navigation.
- `Calendar` / `CalendarGrid` — Computes month layout and produces `DayTile`s.
- `DayTile` — Shows date number and summary (task count / done fraction) and applies CSS status classes `tile-grey|tile-orange|tile-green`.
- `TaskPanel` — Client component showing task CRUD UI for selected day.
- `storage` utility — Single responsibility module wrapping `localStorage` access and JSON parsing with graceful fallback.

### Data model

Use ISO date keys with structure:

```ts
type Task = { id: string; text: string; done: boolean; createdAt: string }
type TasksByDate = Record<string, Task[]> // keyed by 'YYYY-MM-DD'
```

### Persistence

Phase 1 (MVP): `localStorage` under key `calendar-tasks-v1` with helpers:
- `load(): TasksByDate`
- `save(data: TasksByDate): void`
- `safeInit()` to handle parse/storage errors

Phase 2 (optional): API endpoints to GET/POST/PATCH/DELETE tasks for authenticated users; use optimistic UI and reconcile on fetch.

### Color Coding Logic

For each day compute `total = tasks.length`, `done = tasks.filter(t=>t.done).length`:
- if total === 0 || done === 0 -> grey
- if done > 0 && done < total -> orange
- if done === total -> green

Apply classes and update on each mutation.

### Accessibility

- Ensure keyboard focus on day tiles and panel fields.
- Provide ARIA labels for form controls and checkboxes.
- Ensure color is not sole means of conveying state — include text like `All done` or `2/3 done`.

## Implementation Plan & Tasks

Phase A — Foundation (1-2 days)

1. Initialize project (or use existing folder): add `app/page.tsx` or keep `index.html` for static variant.
2. Create `components/Calendar.tsx`, `components/DayTile.tsx`, `components/TaskPanel.tsx`.
3. Implement `lib/storage.ts` wrapper for `localStorage`.
4. Wire up basic CSS classes and responsive grid.

Deliverable: functional month view that shows day tiles and opens a blank task panel.

Phase B — Core interactions (1-2 days)

1. Implement task CRUD in `TaskPanel` with local state and calls to `storage`.
2. Implement day status computation and apply `tile-*` classes.
3. Add month navigation and correct month start alignment.
4. Add simple input validation (non-empty task text).

Deliverable: Add/edit/delete tasks per day; persisted to `localStorage`; color updates immediately.

Phase C — Quality, Accessibility & Tests (1-2 days)

1. Add unit tests for date helpers and storage wrapper.
2. Add integration/E2E test for adding tasks and verifying color changes (Playwright preferred).
3. Add keyboard navigation and ARIA attributes.
4. Add legend and minor UI polish.

Phase D — Optional Server Sync (2-4 days)

1. Design simple REST API (per `docs/technical-description`) and deploy to a small host (Fly/Render) or use Supabase functions.
2. Add authentication (Supabase or other) and map tasks to user IDs.
3. Implement API client in `services/tasks.ts` with methods mirroring local `storage` API.
4. Implement sync strategy: on sign-in, fetch remote tasks and merge (server authoritative or last-write-wins); use optimistic updates for mutations.

## Acceptance Criteria

Functional:

- Users can open a calendar month and click any day to open a task panel.
- Users can add a task; it appears in the list and persists after reload.
- Users can toggle a task done/undone and delete tasks.
- Day tiles color updates correctly (grey, orange, green) immediately after changes.

Non-functional:

- App runs offline for local persistence flows.
- UI works on mobile and desktop (responsive grid).
- Basic unit and E2E tests cover the critical flows.

## Risks & Mitigations

- Risk: `localStorage` unavailability (private mode) — Mitigation: detect and fall back to in-memory store with user-visible non-blocking warning.
- Risk: Timezone inconsistencies with ISO date keys — Mitigation: use local date (year-month-day) derived from user's local time and store only date string, not full timestamp.

## Estimates (Rough)

- Phase A: 1-2 days
- Phase B: 1-2 days
- Phase C: 1-2 days
- Phase D (optional): 2-4 days

Total (MVP): 3-6 days

## Deliverables

- Production-ready `Calendar` components and `TaskPanel` with `localStorage` persistence.
- Tests (unit + E2E) and basic accessibility improvements.
- Documentation: `README.md`, `docs/stories/*`, and this plan in `docs/implementation-plans/`.

---

If you'd like, I can now:
- Convert the current static `index.html` app into a Next.js `app/page.tsx` scaffold, or
- Implement the optional server-backed sync using Supabase.
