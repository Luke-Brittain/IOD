# Repository Setup Instructions for PR Creation

This document provides step-by-step instructions to set up the OliveBranch repository so that the PowerShell PR creation script works successfully.

## TL;DR - Quick Setup

If you just want to make the script work quickly:

1. Go to GitHub repository settings and set the default branch to `main` (or create it from the current default branch)
2. Create a `feature/setup-github` branch from `main`
3. Make at least one commit on `feature/setup-github`
4. Run your PowerShell script

## Current Repository State

The repository currently has:
- 18 user stories in `OliveBranch/docs/stories/` covering landing page, canvas interaction, CSV import, details panel, governance, and more
- A `.gitignore` file configured for Node.js, Next.js, and common build artifacts
- A `CONTRIBUTING.md` with workflow guidelines and branching strategy
- A `README.md` with project overview and getting started instructions

## Prerequisites for the PowerShell Script

Your PowerShell script attempts to create a PR with these parameters:
```powershell
gh pr create --repo Luke-Brittain/OliveBranch \
  --base main \
  --head feature/setup-github
```

For this command to succeed, you need:

1. **GitHub Authentication**: You must be logged in via `gh auth login`
2. **Base Branch (`main`)**: Must exist on the remote repository
3. **Head Branch (`feature/setup-github`)**: Must exist on the remote repository
4. **Divergent Content**: The head branch must have at least one commit that differs from the base branch

## Recommended Setup Steps

### Step 1: Set Up the Base Branch (`main`)

Choose one of these approaches:

**Option A: Via GitHub Web Interface** (Easiest)
1. Go to https://github.com/Luke-Brittain/OliveBranch
2. Click "Settings" > "Branches"
3. Change the default branch to `main` (GitHub may prompt you to rename or create it)
4. If `main` doesn't exist, create it from the current default branch

**Option B: Via Git Commands** (If you have push access)
```bash
cd "c:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2"

# Fetch all remote branches
git fetch origin

# If main doesn't exist, create it from current default branch
git checkout -b main origin/copilot/setup-github-repo
# OR if main exists, just check it out
git checkout main

# Push to ensure it exists on remote
git push -u origin main
```

**Option C: Use Current Branch as Main**
```bash
# If copilot/setup-github-repo should be the main branch:
git checkout copilot/setup-github-repo
git branch -m main  # Rename locally
git push -u origin main  # Push as main
```

### Step 2: Create Feature Branch (`feature/setup-github`)

Once `main` is set up:

```bash
# Ensure you're starting from main
git checkout main
git pull origin main

# Create the feature branch
git checkout -b feature/setup-github

# Make a change to have something to PR
# For example, add a new file or update documentation
echo "# Feature Setup" > FEATURE_NOTES.md
git add FEATURE_NOTES.md
git commit -m "docs: add feature setup notes"

# Push the feature branch
git push -u origin feature/setup-github
```

### Step 3: Verify Branch Setup

Before running your PowerShell script, verify both branches exist:

```bash
# Check remote branches
git ls-remote --heads origin

# You should see both:
# refs/heads/main
# refs/heads/feature/setup-github
```

### Step 4: Run Your PowerShell Script

Now you can run the script successfully:

```powershell
Push-Location 'c:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2'
gh auth login --hostname github.com --web
gh auth status --hostname github.com
gh pr create --repo Luke-Brittain/OliveBranch `
  --title "docs(stories): add/refine details-panel stories (01-18)" `
  --body "Add 18 targeted user stories; split details-panel ACs into stories 11–18." `
  --base main `
  --head feature/setup-github `
  --reviewer Luke-Brittain
echo 'pr-created-successfully'
Pop-Location
```

Note: The script currently has `echo 'pr-failed'` which will run regardless of success. You may want to change it to:
```powershell
if ($LASTEXITCODE -eq 0) {
    echo 'pr-created-successfully'
} else {
    echo 'pr-failed'
}
```

## Alternative: Using Existing Copilot Branch

If you want to use the existing `copilot/setup-github-repo` branch as the base:

```bash
cd "c:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2"

# Option 1: Make copilot branch into main
git checkout copilot/setup-github-repo
git branch -m copilot/setup-github-repo main
git push -u origin main

# Option 2: Update PowerShell script to use copilot branch as base
# Change --base main to --base copilot/setup-github-repo
```

## Troubleshooting

### "Could not resolve to a Repository"
- Ensure you're authenticated: `gh auth status`
- Verify repository exists: https://github.com/Luke-Brittain/OliveBranch

### "Base branch 'main' not found"
- The `main` branch must exist on the remote
- Check: `git ls-remote --heads origin | grep main`

### "Head branch 'feature/setup-github' not found"  
- The `feature/setup-github` branch must exist on the remote
- Check: `git ls-remote --heads origin | grep feature/setup-github`

### "No commits between main and feature/setup-github"
- The feature branch must have at least one commit that differs from main
- Make a change on the feature branch and commit it before creating the PR

## Notes

- The PR title uses conventional commit format: `docs(stories):`
- The PR includes a reviewer assignment: `--reviewer Luke-Brittain`
- The PR base is `main` (must be the default or protected branch)
- The PR head is `feature/setup-github` (must have changes to merge)
