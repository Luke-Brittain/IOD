## Application Overview

**Purpose:**
This application is a lightweight calendar for adding and tracking daily tasks. Users can open a day, add tasks, mark tasks done, and quickly scan month views where days are color-coded by completion status (grey = no tasks / none started, orange = some completed, green = all completed).

**Architecture Pattern:**
Next.js App Router (server-first) with a thin client bundle for interactive calendar UI. The initial implementation can be static (client-only) and progressively enhanced with server-backed APIs for persistence and multi-device sync.

**Key Capabilities:**
- Monthly calendar view with month navigation
- Per-day task CRUD (create, read, update, delete)
- Per-day status color-coding based on task completion
- Local persistence (browser `localStorage`) with optional API endpoints for server persistence

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | Server components for performance, routing and API routes for optional sync endpoints |
| Language | TypeScript | Type safety and clearer data models |
| Styling | Tailwind CSS or plain CSS | Fast UI iteration; the starter app uses plain CSS but upgrade to Tailwind recommended for scale |
| Persistence (client) | localStorage | Simple, zero-dependency local persistence for single-user use |
| Persistence (server) | Supabase or small REST service | Optional server persistence and auth for multi-device sync |
| State | React client components + Context | Minimal local state for open panel / active day; server components for static parts |
| Testing | Jest / Playwright | Unit tests for logic; E2E for UI flows |

---

## Project Folder Structure

```
project/
├── app/                      # Next.js app router
│   ├── page.tsx              # Calendar page (server component)
│   └── api/                  # Optional API routes for tasks
├── components/               # Reusable React components
│   ├── Calendar.tsx
│   ├── DayTile.tsx
│   └── TaskPanel.tsx
├── public/                   # Static assets
├── styles/                   # CSS/Tailwind files
├── lib/                      # Utilities (date helpers, storage)
├── services/                 # API client (if using server persistence)
├── docs/technical-description # This file
└── README.md
```

---

## Data Models (TypeScript)

```ts
/** A single task */
interface Task {
  id: string;           // stable id (client or server generated)
  text: string;         // task description
  done: boolean;        // completion flag
  createdAt: string;    // ISO date
}

/** Tasks grouped by ISO date yyyy-mm-dd */
interface DayTasks {
  date: string;         // '2026-02-07'
  tasks: Task[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
```

Notes: Keep `DayTasks` keyed by ISO date for deterministic lookup and easy calendar rendering.

---

## API Endpoint Specification (optional server-backed)

| Method | Endpoint | Description |
|---|---:|---|
| GET | `/api/tasks?month=YYYY-MM` | List tasks for a month (returns mapping date -> Task[])
| GET | `/api/tasks/:date` | Get tasks for a specific date (ISO yyyy-mm-dd)
| POST | `/api/tasks/:date` | Create a new task for date (body: { text })
| PATCH | `/api/tasks/:date/:id` | Update a task (toggle `done`, edit text)
| DELETE | `/api/tasks/:date/:id` | Delete a task

Request/Response examples should follow `ApiResponse<T>` wrapper above. Use HTTP 4xx/5xx codes for failure paths and include helpful error codes (e.g., `INVALID_PAYLOAD`, `NOT_FOUND`, `STORAGE_UNAVAILABLE`).

---

## Component Hierarchy

```
CalendarPage (app/page.tsx)
├─ Calendar (components/Calendar.tsx)
│  ├─ WeekdayHeader
│  ├─ Grid of DayTile (components/DayTile.tsx)
│  └─ MonthNavigation
└─ TaskPanel (components/TaskPanel.tsx)  # opens for selected day
   ├─ TaskForm (add)
   └─ TaskList (items with checkbox + delete)
```

Behavior notes:
- `DayTile` receives `date` and `DayTasks` and renders color class (`tile-grey|tile-orange|tile-green`) according to completion rules.
- `TaskPanel` is a client component (holds local input state and dispatches storage/API calls).

---

## Color-coding Rules

- Grey: no tasks OR tasks exist but none are marked done.
- Orange: at least one task done, but not all tasks done.
- Green: all tasks for the day are done.

Implementation: compute counts (total, done) for each day during render and apply CSS utility classes. Update immediately on task change to give live feedback.

---

## Persistence Strategy

Phase 1 (single-user): store `Record<string, Task[]>` in `localStorage` under a documented key (e.g., `calendar-tasks-v1`). Handle JSON parse errors and storage unavailability.

Phase 2 (multi-device): add `POST/GET` endpoints and authenticated user mapping (Supabase). Use optimistic UI updates in the client and reconcile on sync.

---

## Security & Edge Cases

- Validate task payloads (non-empty, reasonable length) both client- and server-side.
- If server persistence is added, protect endpoints with user auth and authorization checks.
- Graceful fallback when `localStorage` unavailable: use in-memory store and show a non-blocking notification.

---

## Testing & QA

- Unit tests for date helpers and task CRUD logic.
- Integration tests for calendar rendering (month boundaries, first-day offset).
- E2E tests for flows: add task, toggle done, delete task, and verify color changes.

---

## Design & Accessibility

- Follow the premium visual guidance in project instructions (clear spacing, accessible color contrast for the status badges). Provide a legend explaining colors.
- Ensure keyboard accessibility (day tiles focusable, `TaskPanel` usable without mouse) and ARIA labels for checkboxes and buttons.

---

## Next Steps / Implementation Plan

1. Scaffold Next.js page and small client components for calendar and task panel.
2. Implement `localStorage` persistence and wire up UI interactions.
3. Add tests (unit + E2E).
4. Optionally add server API and Supabase-backed storage for auth and sync.
