# Developing on OliveBranch Prototype

This guide contains the minimum steps and conventions for developers working on the repository.

## Repo layout (important paths)
- `prototype/` — Vite + React + TypeScript prototype app (main dev target)
- `OliveBranch/docs/` — documentation and user stories
- `.github/workflows/ci.yml` — CI pipeline (lint, install, test)
- `pnpm-lock.yaml` (root) and `prototype/pnpm-lock.yaml` — commit lockfiles for reproducible CI

## Prerequisites
- Node.js 18.x (tested with v18.18.x)
- pnpm (v10.x recommended)
- Git and GitHub account with push rights for the repo
- Optional: GitHub CLI (`gh`) for PR and Actions commands

Install pnpm (if needed):
```bash
npm install -g pnpm
```

## Initial setup (first time)
From the repo root:
```bash
pnpm -v              # confirm pnpm is available (10.x recommended)
pnpm -w install      # install workspace dependencies
```

To install only the prototype dependencies:
```bash
cd prototype
pnpm install
```

## Common scripts (prototype)
Run the dev server:
```bash
pnpm --filter ./prototype dev
```
Build:
```bash
pnpm --filter ./prototype build
```
Lint (ESLint + Prettier):
```bash
pnpm --filter ./prototype run lint
```
Format:
```bash
pnpm --filter ./prototype run format
```
Tests (Vitest):
```bash
pnpm --filter ./prototype run test
```

## Lockfile policy
- Keep `pnpm-lock.yaml` (root) and `prototype/pnpm-lock.yaml` committed.
- CI uses `pnpm install --frozen-lockfile` to ensure reproducible installs. If CI fails with an "outdated lockfile" error, update lockfiles locally then commit.

To update lockfiles (example):
```bash
# from repo root
pnpm -w install
git add pnpm-lock.yaml prototype/pnpm-lock.yaml
git commit -m "chore: update pnpm lockfiles"
git push
```

## CI expectations
- The workflow `.github/workflows/ci.yml` runs on PRs and checks:
  - `pnpm -w install` (frozen-lockfile)
  - lint
  - tests
- Ensure local `lint` and `test` pass before opening a PR.

## Git & PR workflow
- Branch naming: `feature/<short-description>` or `fix/<short-description>`
- Open a PR to `main` and wait for CI to pass before merging.
- Preferred merge strategy: merge commit (team preference). Keep PRs small and self-contained.

## Pre-commit hooks
- Husky is configured in `package.json` prepare script; hooks are installed via `pnpm prepare`.
- `lint-staged` runs ESLint and Prettier on staged files.

## Troubleshooting (common issues)
- `ERR_PNPM_OUTDATED_LOCKFILE`: lockfile differs from `package.json`; run `pnpm -w install` and commit the lockfile.
- ESLint glob patterns failing on Windows PowerShell: script uses double-quoted globs. If you see pattern mismatch, run ESLint with a quoted glob suitable for your shell (e.g., `eslint "src/**/*.{ts,tsx}"`).
- Prettier warnings: run `pnpm --filter ./prototype exec prettier --write "src/**/*.{ts,tsx,css,md,json}"` and commit the changes.
- TypeScript eslint warnings: if `@typescript-eslint` warns about unsupported TS versions, consider pinning the supported TS range or upgrading ESLint plugin packages.

## Contacts & Ownership
- CI and infra: repo owner / maintainers (use PR reviewers list)
- For build or infra failures, open an issue and tag the maintainers.

---
Add this file to `docs/DEVELOPING.md` and update as project conventions change.
