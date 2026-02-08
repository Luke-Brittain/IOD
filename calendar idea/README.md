# Simple Calendar - Daily Tasks

This is a minimal, single-file web app to add daily tasks to calendar days. Tasks are saved in your browser's `localStorage`.

How to run

1. Open `index.html` in a browser (double-click or right-click → Open with).

Features

- Click a day to open the tasks panel.
- Add tasks, check them as done, or delete them.
- Days are colored by status:
  - Grey: no tasks or none started
  - Orange: some tasks completed
  - Green: all tasks completed

Persistence

Data is stored in `localStorage` under the key `calendar-tasks-v1`.

Files

- `index.html` — UI and structure
- `styles.css` — styles and color rules
- `app.js` — calendar logic and storage

Notes

This is intentionally small and dependency-free. If you want a server-backed version or multi-user support, I can add an API and sync layer.
