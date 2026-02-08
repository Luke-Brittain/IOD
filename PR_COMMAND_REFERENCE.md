# Quick Reference: PowerShell PR Creation Command

This file contains the exact PowerShell command from your script, ready to use after completing the repository setup.

## Prerequisites

Before running this command, ensure:

1. ✓ Both `main` and `feature/setup-github` branches exist on remote (run `.\scripts\setup-branches.ps1` if needed)
2. ✓ You are authenticated with GitHub CLI (`gh auth login --hostname github.com --web`)
3. ✓ The `feature/setup-github` branch has commits that differ from `main`

## The Command

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
if ($LASTEXITCODE -eq 0) {
    echo 'pr-created-successfully'
} else {
    echo 'pr-failed'
}
Pop-Location
```

## Breakdown

- `Push-Location '...'` - Navigates to your local repository directory
- `gh auth login` - Ensures you're authenticated with GitHub
- `gh auth status` - Displays your authentication status
- `gh pr create` - Creates a pull request with:
  - `--repo` - Target repository
  - `--title` - PR title (follows conventional commits format)
  - `--body` - PR description
  - `--base main` - Branch to merge into (base)
  - `--head feature/setup-github` - Branch with changes (source)
  - `--reviewer Luke-Brittain` - Assigns a reviewer
- Error handling to check if PR was created successfully
- `Pop-Location` - Returns to the previous directory

## Customization

To use this for other PRs, modify:
- `--title "Your PR title here"`
- `--body "Your PR description here"`
- `--head feature/your-branch-name`

Keep `--base main` and `--repo Luke-Brittain/OliveBranch` the same unless you're targeting a different branch or repository.

## Troubleshooting

### "Base branch 'main' not found"
Run: `.\scripts\setup-branches.ps1`

### "Head branch 'feature/setup-github' not found"
Run: `.\scripts\setup-branches.ps1`

### "No commits between main and feature/setup-github"
Make sure you have commits on the feature branch:
```powershell
git checkout feature/setup-github
# Make changes
git add .
git commit -m "your commit message"
git push origin feature/setup-github
```

### Authentication errors
Run: `gh auth login --hostname github.com --web`

## Alternative: Simplified Version

If you're already in the repository directory and authenticated:

```powershell
gh pr create `
  --repo Luke-Brittain/OliveBranch `
  --title "docs(stories): add/refine details-panel stories (01-18)" `
  --body "Add 18 targeted user stories; split details-panel ACs into stories 11–18." `
  --base main `
  --head feature/setup-github `
  --reviewer Luke-Brittain
```
