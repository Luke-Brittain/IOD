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
