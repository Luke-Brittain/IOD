# OliveBranch

A data governance and metadata management system for tracking dataset ownership, stewardship, and compliance.

## Overview

OliveBranch provides a visual canvas-based interface for managing data assets, relationships, and governance policies across your organization.

## Quick Start

### For PR Creation Workflow

If you're here to set up branches for creating pull requests:

1. **Run the setup script**: `.\scripts\setup-branches.ps1` (PowerShell) or `./scripts/setup-branches.sh` (Bash)
2. **Create your PR**: See [PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md) for the exact command
3. **Need help?**: See [SETUP.md](SETUP.md) for detailed instructions

### Repository Setup

This repository follows a standard Git workflow. For detailed instructions on setting up branches for PR creation, see [SETUP.md](SETUP.md).

### Quick Setup for PR Creation

To enable the GitHub CLI PR creation workflow:

1. Ensure `main` branch exists on remote (see [SETUP.md](SETUP.md) for details)
2. Create `feature/setup-github` branch from `main`
3. Make commits on the feature branch
4. Run the PR creation command:

```bash
gh pr create --repo Luke-Brittain/OliveBranch \
  --title "Your PR Title" \
  --body "Your PR Description" \
  --base main \
  --head feature/setup-github \
  --reviewer Luke-Brittain
```

### Branches

- `main` - Protected release branch containing stable code
- `feature/*` - Feature development branches
- `fix/*` - Bug fix branches

### Getting Started with GitHub CLI

1. **Authentication**: Ensure you're logged into GitHub CLI
   ```bash
   gh auth login --hostname github.com --web
   gh auth status --hostname github.com
   ```

2. **Creating a Pull Request**: Use the GitHub CLI to create PRs (after completing setup in [SETUP.md](SETUP.md))
   ```bash
   gh pr create --repo Luke-Brittain/OliveBranch \
     --title "Your PR Title" \
     --body "Your PR Description" \
     --base main \
     --head feature/your-branch \
     --reviewer Luke-Brittain
   ```

## Documentation

User stories and requirements are located in `OliveBranch/docs/stories/`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## Current Stories

The repository includes 18 user stories covering:
- Landing page and role-scoped views (Story 01)
- Canvas interaction and tooling (Story 02)
- CSV import with merge/preserve logic (Stories 03, 10)
- Details panel functionality (Stories 04, 11-18)
- System-level ownership and inheritance (Story 05)
- Stewardship and governance (Story 06)
- Field-level PII flags (Story 07)
- Filters and toggles (Story 08)
- Primary system metrics anchor (Story 09)
