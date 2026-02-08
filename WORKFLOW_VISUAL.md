# Visual Workflow Guide

This document provides a visual overview of the repository setup and PR creation workflow.

## Setup Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Clone/Navigate to Repository                       │
│  cd "c:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2"     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Run Setup Script                                   │
│  .\scripts\setup-branches.ps1                               │
│                                                              │
│  Script does:                                                │
│  ✓ Creates 'main' branch                                    │
│  ✓ Creates 'feature/setup-github' branch                    │
│  ✓ Adds marker commit                                       │
│  ✓ Pushes both branches to remote                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Authenticate with GitHub CLI                       │
│  gh auth login --hostname github.com --web                  │
│  gh auth status --hostname github.com                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Create Pull Request                                │
│  gh pr create --repo Luke-Brittain/OliveBranch \            │
│    --base main \                                             │
│    --head feature/setup-github \                             │
│    --title "..." --body "..." --reviewer Luke-Brittain      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  ✓ Pull Request Created Successfully!                       │
│  → Review PR on GitHub                                       │
│  → Request additional reviews if needed                      │
│  → Merge when approved                                       │
└─────────────────────────────────────────────────────────────┘
```

## Branch Structure

```
GitHub Remote (origin)
│
├─ main                       [Base Branch]
│   │
│   ├─ .gitignore
│   ├─ CONTRIBUTING.md
│   ├─ README.md
│   ├─ SETUP.md
│   ├─ SETUP_SUMMARY.md
│   ├─ PR_COMMAND_REFERENCE.md
│   ├─ scripts/
│   │   ├─ setup-branches.ps1
│   │   ├─ setup-branches.sh
│   │   └─ README.md
│   └─ OliveBranch/
│       └─ docs/
│           └─ stories/
│               ├─ 01-landing-role-scoped-view.md
│               ├─ 02-canvas-interaction-tooling.md
│               ├─ ... (03-10)
│               └─ 11-18: Details panel stories
│
└─ feature/setup-github       [Feature Branch - Your changes]
    │
    └─ (Contains all main branch content + your additions)
```

## Pull Request Flow

```
┌──────────────┐         ┌──────────────┐
│   feature/   │         │     main     │
│setup-github  │         │              │
│              │         │              │
│ (Your       │  ──PR──▶ │  (Target)    │
│  changes)    │         │              │
│              │         │              │
└──────────────┘         └──────────────┘
     Source                   Base
     (--head)              (--base)
```

## Decision Tree: Which Setup Method to Use?

```
Do you have Git and GitHub CLI installed?
│
├─ YES ──▶ Can you run PowerShell or Bash scripts?
│          │
│          ├─ YES ──▶ Use Automated Setup ✓
│          │         │
│          │         ├─ Windows? ──▶ .\scripts\setup-branches.ps1
│          │         └─ Linux/Mac? ──▶ ./scripts/setup-branches.sh
│          │
│          └─ NO ──▶ Use Manual Setup
│                   Follow SETUP.md instructions
│
└─ NO ──▶ Install Prerequisites First
          1. Install Git: https://git-scm.com/
          2. Install GitHub CLI: https://cli.github.com/
          Then return to start
```

## File Reference Map

```
For This Task...                 → See This File
────────────────────────────────────────────────────────────
Quick start guide                → README.md
Automated setup                  → scripts/setup-branches.ps1
                                   scripts/setup-branches.sh
Manual setup steps               → SETUP.md
PowerShell command reference     → PR_COMMAND_REFERENCE.md
Complete overview               → SETUP_SUMMARY.md
Script documentation            → scripts/README.md
Contribution guidelines         → CONTRIBUTING.md
Visual workflows (you are here) → WORKFLOW_VISUAL.md
```

## Common Issues & Solutions Map

```
Issue                           → Solution
────────────────────────────────────────────────────────────
"Branch 'main' not found"       → Run setup script
"Branch 'feature/...' not found" → Run setup script
"No commits between branches"   → Make changes & commit
"Authentication failed"         → Run: gh auth login
"Permission denied" (script)    → Run: chmod +x scripts/*.sh
"Not a git repository"          → cd to correct directory
General help needed             → See SETUP.md or SETUP_SUMMARY.md
```

## Your PowerShell Script Explained

```powershell
# Original script with annotations:

Push-Location 'c:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2'
# ↑ Navigate to repository directory

gh auth login --hostname github.com --web
# ↑ Ensure GitHub authentication

gh auth status --hostname github.com
# ↑ Verify authentication status

gh pr create --repo Luke-Brittain/OliveBranch `
  --title "docs(stories): add/refine details-panel stories (01-18)" `
  --body "Add 18 targeted user stories; split details-panel ACs into stories 11–18." `
  --base main `                      # ← Base branch (must exist!)
  --head feature/setup-github `      # ← Feature branch (must exist!)
  --reviewer Luke-Brittain
# ↑ Create pull request with specified parameters

echo 'pr-failed'
# ↑ This runs regardless of success/failure
# See PR_COMMAND_REFERENCE.md for improved version

Pop-Location
# ↑ Return to previous directory
```

## Timeline: Expected Duration

```
Task                        Duration    Notes
────────────────────────────────────────────────────────────
Read documentation          5-10 min    Skim README.md & SETUP_SUMMARY.md
Run setup script           1-2 min     Automated (scripts/setup-branches.ps1)
Authenticate with GitHub   1-2 min     One-time setup (gh auth login)
Create PR                  <1 min      Run command from PR_COMMAND_REFERENCE.md
────────────────────────────────────────────────────────────
Total (first time)         7-15 min
Total (subsequent)         <2 min      If already authenticated & set up
```

## Success Checklist

Before running your PR creation command, verify:

- [ ] Repository cloned locally
- [ ] `main` branch exists on GitHub (check: `git ls-remote --heads origin | grep main`)
- [ ] `feature/setup-github` branch exists on GitHub (check: `git ls-remote --heads origin | grep feature`)
- [ ] Authenticated with GitHub CLI (check: `gh auth status`)
- [ ] In correct directory (check: `pwd` or `cd`)
- [ ] Feature branch has commits different from main (check: `git log main..feature/setup-github`)

If all boxes checked → Run your PR creation command! ✓

## Need More Help?

- 📖 **Comprehensive guide**: [SETUP.md](SETUP.md)
- 🎯 **Quick summary**: [SETUP_SUMMARY.md](SETUP_SUMMARY.md)
- 💻 **Command reference**: [PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md)
- 🤖 **Script docs**: [scripts/README.md](scripts/README.md)
- 📝 **Contributing**: [CONTRIBUTING.md](CONTRIBUTING.md)
