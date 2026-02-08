# Setup Script for OliveBranch Repository
# This script creates the main and feature/setup-github branches required for PR creation

param(
    [string]$RepoPath = ".",
    [switch]$DryRun
)

Write-Host "OliveBranch Repository Setup Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Navigate to repository
Push-Location $RepoPath

try {
    # Check if we're in a git repository
    git rev-parse --git-dir 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Not a git repository" -ForegroundColor Red
        exit 1
    }

    Write-Host "Step 1: Checking current branch..." -ForegroundColor Yellow
    $currentBranch = git branch --show-current
    Write-Host "Current branch: $currentBranch`n" -ForegroundColor White

    # Check if main branch exists on remote
    Write-Host "Step 2: Checking if 'main' branch exists..." -ForegroundColor Yellow
    $remoteBranches = git ls-remote --heads origin
    $mainExists = $remoteBranches -match "refs/heads/main"

    if ($mainExists) {
        Write-Host "'main' branch already exists on remote`n" -ForegroundColor Green
    } else {
        Write-Host "'main' branch does not exist on remote" -ForegroundColor Yellow
        Write-Host "Creating 'main' branch from current branch ($currentBranch)...`n" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            # Fetch latest
            git fetch origin
            
            # Create main from current branch
            git checkout -b main 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                # Branch might already exist locally
                git checkout main 2>&1 | Out-Null
            }
            
            # Push main to remote
            git push -u origin main
            if ($LASTEXITCODE -eq 0) {
                Write-Host "'main' branch created and pushed successfully`n" -ForegroundColor Green
            } else {
                Write-Host "Error: Failed to push 'main' branch" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "[DRY RUN] Would create and push 'main' branch`n" -ForegroundColor Cyan
        }
    }

    # Check if feature/setup-github branch exists
    Write-Host "Step 3: Checking if 'feature/setup-github' branch exists..." -ForegroundColor Yellow
    $featureExists = $remoteBranches -match "refs/heads/feature/setup-github"

    if ($featureExists) {
        Write-Host "'feature/setup-github' branch already exists on remote`n" -ForegroundColor Green
    } else {
        Write-Host "'feature/setup-github' branch does not exist on remote" -ForegroundColor Yellow
        Write-Host "Creating 'feature/setup-github' branch from 'main'...`n" -ForegroundColor Yellow
        
        if (-not $DryRun) {
            # Ensure we're on main
            git checkout main 2>&1 | Out-Null
            git pull origin main 2>&1 | Out-Null
            
            # Create feature branch
            git checkout -b feature/setup-github 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                # Branch might already exist locally
                git checkout feature/setup-github 2>&1 | Out-Null
            }
            
            # Add a marker file to ensure there's a difference
            $markerFile = "BRANCH_SETUP.txt"
            if (-not (Test-Path $markerFile)) {
                "This file marks the feature/setup-github branch setup." | Out-File -FilePath $markerFile -Encoding UTF8
                git add $markerFile
                git commit -m "chore: add branch setup marker"
            }
            
            # Push feature branch to remote
            git push -u origin feature/setup-github
            if ($LASTEXITCODE -eq 0) {
                Write-Host "'feature/setup-github' branch created and pushed successfully`n" -ForegroundColor Green
            } else {
                Write-Host "Error: Failed to push 'feature/setup-github' branch" -ForegroundColor Red
                exit 1
            }
        } else {
            Write-Host "[DRY RUN] Would create and push 'feature/setup-github' branch`n" -ForegroundColor Cyan
        }
    }

    # Verify setup
    Write-Host "Step 4: Verifying branch setup..." -ForegroundColor Yellow
    $remoteBranches = git ls-remote --heads origin
    $mainExists = $remoteBranches -match "refs/heads/main"
    $featureExists = $remoteBranches -match "refs/heads/feature/setup-github"

    if ($mainExists -and $featureExists) {
        Write-Host "`nSetup Complete! ✓" -ForegroundColor Green
        Write-Host "Both 'main' and 'feature/setup-github' branches exist on remote.`n" -ForegroundColor Green
        
        Write-Host "You can now run your PR creation command:" -ForegroundColor Cyan
        Write-Host "gh pr create --repo Luke-Brittain/OliveBranch --base main --head feature/setup-github --title 'Your Title' --body 'Your Description' --reviewer Luke-Brittain`n" -ForegroundColor White
    } else {
        Write-Host "`nSetup incomplete. Please check errors above.`n" -ForegroundColor Red
        exit 1
    }

} finally {
    Pop-Location
}
