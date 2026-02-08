# User Story: 3 - Persist Tasks Locally

**As a** user,
**I want** my tasks to be saved locally in my browser,
**so that** my tasks remain available after I refresh the page or close and reopen the browser.

## Acceptance Criteria

* Tasks added for any date persist across page reloads and browser restarts.
* A stable, documented storage key is used for local persistence (e.g., `calendar-tasks-v1`).
* Updating or deleting tasks updates the persisted data accordingly.
* If storage is unavailable (private mode/full), the app fails gracefully and shows a clear message or fallback.

## Notes

* This story targets local persistence only; server or multi-device sync is out of scope for this story.
