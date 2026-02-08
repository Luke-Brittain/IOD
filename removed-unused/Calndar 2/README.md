# Daily Tasks Calendar (Next.js)

This workspace contains a minimal calendar app for adding daily tasks. There are two ways to run it:

- Static demo: open the `calendar idea/index.html` file in a browser.
- Next.js app (recommended): run the Next.js App Router application added to this repo.

Run the Next.js app:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 to view the app.

Notes:
- The Next.js app uses a client component for the calendar and stores tasks in `localStorage` under `calendar-tasks-v1`.
- To add server persistence, see `docs/implementation-plans/01-calendar-daily-tasks-implementation-plan.md`.
