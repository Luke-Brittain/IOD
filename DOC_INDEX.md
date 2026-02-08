# Documentation Index

Welcome to the OliveBranch repository! This index helps you find the right documentation quickly.

## 🚀 Getting Started (Start Here!)

**New to this repository?** Start with these in order:

1. **[README.md](README.md)** - Repository overview and quick start (3 min read)
2. **[WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md)** - Visual guide with diagrams (5 min read)
3. **[PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md)** - The exact command you need (2 min read)

## 📚 Complete Documentation Set

### Core Documentation

| File | Purpose | When to Use |
|------|---------|-------------|
| [README.md](README.md) | Repository overview and quick start | First time visiting the repo |
| [SETUP.md](SETUP.md) | Comprehensive setup instructions | Need detailed manual setup steps |
| [SETUP_SUMMARY.md](SETUP_SUMMARY.md) | Complete setup summary | Want overview of what's configured |
| [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md) | Visual workflows and diagrams | Visual learner or need quick reference |
| [PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md) | PowerShell PR command guide | Ready to create the PR |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines | Want to contribute to the project |

### Script Documentation

| File | Purpose | When to Use |
|------|---------|-------------|
| [scripts/README.md](scripts/README.md) | Script usage guide | About to run automation scripts |
| [scripts/setup-branches.ps1](scripts/setup-branches.ps1) | PowerShell automation | Windows user, want automated setup |
| [scripts/setup-branches.sh](scripts/setup-branches.sh) | Bash automation | Linux/Mac user, want automated setup |

## 🎯 Quick Links by Task

### "I want to create a PR"

1. Run: `.\scripts\setup-branches.ps1` (or `.sh` for Linux/Mac)
2. Run: Command from [PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md)
3. Done! ✓

### "I want to understand the setup"

1. Read: [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Quick overview
2. Read: [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md) - Visual diagrams
3. Read: [SETUP.md](SETUP.md) - Detailed instructions

### "I want to set up manually"

1. Read: [SETUP.md](SETUP.md) - Step-by-step manual instructions
2. Reference: [PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md) - Final command

### "I'm having issues"

1. Check: [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md) - Common issues map
2. Check: [SETUP.md](SETUP.md) - Troubleshooting section
3. Check: [scripts/README.md](scripts/README.md) - Script-specific issues

### "I want to contribute"

1. Read: [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
2. Read: [README.md](README.md) - Repository overview
3. Review: User stories in `OliveBranch/docs/stories/`

## 📖 Documentation by Format

### Quick Reference Guides
- [README.md](README.md) - 2-3 min read
- [PR_COMMAND_REFERENCE.md](PR_COMMAND_REFERENCE.md) - 2 min read
- [scripts/README.md](scripts/README.md) - 3 min read

### Visual Guides
- [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md) - Diagrams, flowcharts, decision trees

### Comprehensive Guides
- [SETUP.md](SETUP.md) - Detailed step-by-step instructions
- [SETUP_SUMMARY.md](SETUP_SUMMARY.md) - Complete overview of what's configured

### Automation
- [scripts/setup-branches.ps1](scripts/setup-branches.ps1) - PowerShell script
- [scripts/setup-branches.sh](scripts/setup-branches.sh) - Bash script

## 🗂️ Repository Structure

```
OliveBranch/
│
├── 📄 Documentation (You are here: DOC_INDEX.md)
│   ├── README.md                    # Start here
│   ├── SETUP.md                     # Detailed setup
│   ├── SETUP_SUMMARY.md             # Setup overview
│   ├── WORKFLOW_VISUAL.md           # Visual guide
│   ├── PR_COMMAND_REFERENCE.md      # Command reference
│   ├── CONTRIBUTING.md              # How to contribute
│   ├── DOC_INDEX.md                 # This file
│   └── .gitignore                   # Git ignore rules
│
├── 🤖 Automation Scripts
│   └── scripts/
│       ├── README.md                # Script documentation
│       ├── setup-branches.ps1       # PowerShell automation
│       └── setup-branches.sh        # Bash automation
│
└── 📚 User Stories
    └── OliveBranch/
        └── docs/
            └── stories/
                ├── 01-landing-role-scoped-view.md
                ├── 02-canvas-interaction-tooling.md
                ├── 03-csv-import-merge-preserve.md
                ├── 04-details-panel-on-double-click.md
                ├── 05-system-level-ownership-inheritance.md
                ├── 06-stewardship-for-dataset-table.md
                ├── 07-field-level-pii-flag.md
                ├── 08-filters-and-toggles.md
                ├── 09-primary-system-anchor-for-metrics.md
                ├── 10-csv-import-edges-additive-and-preview.md
                ├── 11-details-panel-open-view.md
                ├── 12-details-panel-metadata-display.md
                ├── 13-details-panel-relationship-navigation.md
                ├── 14-details-panel-governance-display.md
                ├── 15-details-panel-edit-metadata.md
                ├── 16-details-panel-edit-permissions.md
                ├── 17-details-panel-merge-preserve-on-save.md
                └── 18-details-panel-audit-trail.md
```

## 🔍 Search by Keyword

| Keyword | Relevant Files |
|---------|----------------|
| PowerShell | PR_COMMAND_REFERENCE.md, scripts/setup-branches.ps1, scripts/README.md |
| Bash | scripts/setup-branches.sh, scripts/README.md |
| Setup | SETUP.md, SETUP_SUMMARY.md, scripts/README.md |
| PR creation | PR_COMMAND_REFERENCE.md, README.md, SETUP.md |
| Branches | SETUP.md, scripts/README.md, WORKFLOW_VISUAL.md |
| Troubleshooting | SETUP.md, scripts/README.md, WORKFLOW_VISUAL.md |
| Visual guide | WORKFLOW_VISUAL.md |
| Automation | scripts/setup-branches.ps1, scripts/setup-branches.sh, scripts/README.md |
| Contributing | CONTRIBUTING.md |
| Stories | OliveBranch/docs/stories/*.md |

## ⏱️ Estimated Reading Times

| Document | Time | Type |
|----------|------|------|
| README.md | 3 min | Quick start |
| SETUP.md | 10-15 min | Comprehensive |
| SETUP_SUMMARY.md | 5-7 min | Overview |
| WORKFLOW_VISUAL.md | 5-8 min | Visual reference |
| PR_COMMAND_REFERENCE.md | 2-3 min | Command guide |
| CONTRIBUTING.md | 3-5 min | Guidelines |
| scripts/README.md | 3-5 min | Script docs |
| DOC_INDEX.md | 2-3 min | Navigation (this file) |

## 💡 Pro Tips

1. **First time here?** Read README.md → WORKFLOW_VISUAL.md → Run setup script
2. **Need a specific command?** Go straight to PR_COMMAND_REFERENCE.md
3. **Prefer manual setup?** Follow SETUP.md step by step
4. **Visual learner?** Start with WORKFLOW_VISUAL.md
5. **Want full context?** Read SETUP_SUMMARY.md

## 🆘 Getting Help

1. **Common issues**: See "Common Issues & Solutions Map" in [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md)
2. **Troubleshooting**: Check troubleshooting sections in [SETUP.md](SETUP.md) and [scripts/README.md](scripts/README.md)
3. **Decision tree**: See "Decision Tree: Which Setup Method to Use?" in [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md)

## ✅ Quick Success Path

For the fastest path to success:

```
1. DOC_INDEX.md (you are here) ✓
2. ↓
3. scripts/setup-branches.ps1 (run this)
4. ↓
5. PR_COMMAND_REFERENCE.md (copy & run command)
6. ↓
7. Done! PR created ✓
```

Total time: ~5-10 minutes (first time)

---

**Questions?** Check the relevant documentation above or see [WORKFLOW_VISUAL.md](WORKFLOW_VISUAL.md) for visual guides and decision trees.
