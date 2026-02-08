# Setup Scripts

This directory contains automation scripts to help set up the OliveBranch repository for PR creation.

## Scripts

### setup-branches.ps1 (PowerShell)

Automates the creation of `main` and `feature/setup-github` branches required for PR creation.

**Usage:**

```powershell
# Run from repository root
.\scripts\setup-branches.ps1

# Run from a different directory
.\scripts\setup-branches.ps1 -RepoPath "C:\path\to\repo"

# Dry run (see what would happen without making changes)
.\scripts\setup-branches.ps1 -DryRun
```

### setup-branches.sh (Bash)

Bash equivalent of the PowerShell script for Linux/Mac users.

**Usage:**

```bash
# Run from repository root
./scripts/setup-branches.sh

# Run from a different directory
./scripts/setup-branches.sh /path/to/repo

# Dry run
./scripts/setup-branches.sh . true
```

## What These Scripts Do

1. **Check Repository**: Verify you're in a git repository
2. **Create Main Branch**: If `main` doesn't exist on remote, create it from the current branch
3. **Create Feature Branch**: If `feature/setup-github` doesn't exist, create it from `main`
4. **Add Marker File**: Ensure feature branch has at least one commit different from main
5. **Push to Remote**: Push both branches to the remote repository
6. **Verify Setup**: Confirm both branches exist on remote

## After Running the Script

Once the script completes successfully, you can run your PR creation command:

```bash
gh pr create --repo Luke-Brittain/OliveBranch \
  --base main \
  --head feature/setup-github \
  --title "docs(stories): add/refine details-panel stories (01-18)" \
  --body "Add 18 targeted user stories; split details-panel ACs into stories 11–18." \
  --reviewer Luke-Brittain
```

## Manual Setup

If you prefer to set up branches manually, see [../SETUP.md](../SETUP.md) for detailed instructions.

## Troubleshooting

### Permission Denied

If you get "Permission denied" when running the bash script:
```bash
chmod +x scripts/setup-branches.sh
```

### Authentication Failed

The scripts use `git push`, which requires authentication. Ensure you're logged in:
```bash
gh auth login
# or configure git credentials
git config --global credential.helper store
```

### Branch Already Exists Locally

If a branch already exists locally but not on remote, the script will use the existing local branch.

### Conflicts

If you have uncommitted changes, commit or stash them before running the script:
```bash
git stash
./scripts/setup-branches.sh
git stash pop
```
