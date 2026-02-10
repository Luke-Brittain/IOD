# Playwright runner

How to run the Playwright drag smoke test locally:

```powershell
cd "C:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2\dev-playground"
pnpm exec playwright install --with-deps
pnpm dev -- --host 127.0.0.1
# in a separate terminal:
node playwright/run-drag.js > playwright/run-drag.log 2>&1
```

Artifacts (if produced):
- `playwright/screenshot.png`
- `playwright/trace.zip`
- `playwright/run-drag.log`

CI: the repository contains `.github/workflows/playwright-ci.yml` which runs this script on push and on manual dispatch and uploads artifacts.

Environment/CI behavior
-----------------------

- `PLAYWRIGHT_MIN_DRAG_PIXELS` (default: `20`) — numeric threshold (in pixels) the script uses to assert the drag actually moved the target. Set this to a lower value for fragile runs or higher for stricter checks. The CI workflow exports a default value, and you can override it when dispatching the workflow or by setting an environment variable in the runner.

- The CI job runs the runner which starts the dev server, executes the Playwright script, and will fail the job if the script exits with a non-zero code (the script sets a non-zero exit when the drag delta is below the threshold). Artifacts (`screenshot.png`, `trace.zip`, `run-drag.log`) are uploaded even on failure.

Recommended local run (uses the included runner which handles server lifecycle):

```powershell
cd "C:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2\dev-playground"
pnpm exec playwright install --with-deps
# optional: override threshold for this run
$env:PLAYWRIGHT_MIN_DRAG_PIXELS = '15'
node playwright/run-drag-runner.js | tee playwright/run-drag.log
```
