# Developer Setup — Olive Branch

This file documents local setup, environment variables, and workspace conventions for contributors.

## Prerequisites
- Node.js 18+ (LTS preferred)
- pnpm 10+
- Git

## Install

```powershell
pnpm install
```

## Environment variables
Create a `.env.local` at the repository root (ignored by git). The following placeholders are used by the application and services.

# Supabase / Postgres
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # server-only, do NOT commit
DATABASE_URL=

# Graph DB (Neo4j / Memgraph)
GRAPH_DB_URL=
GRAPH_DB_USER=
GRAPH_DB_PASSWORD=

# Storage (optional)
STORAGE_URL=
STORAGE_KEY=

# Optional AI placeholders (disabled by default for MVP)
# These are placeholders to make future integration easier. Leave empty or unset for MVP.
OPENAI_API_KEY=
AI_PROVIDER=                # e.g. openai, anthopic
AI_USAGE_ENABLED=false

## Running locally
- Prototype (if used):

```powershell
pnpm --filter ./prototype dev
```

- Main app (Next.js app):

```powershell
pnpm dev
```

## Tests & lint

```powershell
pnpm -w lint
pnpm -w test
```

## Lockfile policy
- This repository uses `pnpm` workspaces with committed `pnpm-lock.yaml` files.
- CI enforces `pnpm install --frozen-lockfile`. When changing dependencies, update lockfiles locally and commit them.

## Secrets & Safety
- Never commit `.env.local` or secret values. Use environment management for CI and production.
- Audit logs and import operations may include PII; treat exported logs accordingly.

## Notes on AI/LLM
- The MVP intentionally does not enable runtime AI calls. The following placeholders exist only to make later integration easier:
  - `OPENAI_API_KEY` and `AI_USAGE_ENABLED` are optional and not required for MVP.
- If/when AI is enabled, ensure prompt sanitization, PII redaction, and cost controls are implemented.

## Contributing
Follow `CONTRIBUTING.md` for branch naming, commit messages, and PR procedures.
