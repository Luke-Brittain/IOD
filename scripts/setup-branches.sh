#!/bin/bash
# Setup Script for OliveBranch Repository
# This script creates the main and feature/setup-github branches required for PR creation

set -e

REPO_PATH="${1:-.}"
DRY_RUN="${2:-false}"

echo -e "\033[36mOliveBranch Repository Setup Script\033[0m"
echo -e "\033[36m====================================\n\033[0m"

# Navigate to repository
cd "$REPO_PATH"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "\033[31mError: Not a git repository\033[0m"
    exit 1
fi

echo -e "\033[33mStep 1: Checking current branch...\033[0m"
current_branch=$(git branch --show-current)
echo -e "Current branch: $current_branch\n"

# Check if main branch exists on remote
echo -e "\033[33mStep 2: Checking if 'main' branch exists...\033[0m"
if git ls-remote --heads origin | grep -q "refs/heads/main"; then
    echo -e "\033[32m'main' branch already exists on remote\n\033[0m"
else
    echo -e "\033[33m'main' branch does not exist on remote\033[0m"
    echo -e "\033[33mCreating 'main' branch from current branch ($current_branch)...\n\033[0m"
    
    if [ "$DRY_RUN" != "true" ]; then
        # Fetch latest
        git fetch origin
        
        # Create main from current branch
        git checkout -b main 2>/dev/null || git checkout main
        
        # Push main to remote
        if git push -u origin main; then
            echo -e "\033[32m'main' branch created and pushed successfully\n\033[0m"
        else
            echo -e "\033[31mError: Failed to push 'main' branch\033[0m"
            exit 1
        fi
    else
        echo -e "\033[36m[DRY RUN] Would create and push 'main' branch\n\033[0m"
    fi
fi

# Check if feature/setup-github branch exists
echo -e "\033[33mStep 3: Checking if 'feature/setup-github' branch exists...\033[0m"
if git ls-remote --heads origin | grep -q "refs/heads/feature/setup-github"; then
    echo -e "\033[32m'feature/setup-github' branch already exists on remote\n\033[0m"
else
    echo -e "\033[33m'feature/setup-github' branch does not exist on remote\033[0m"
    echo -e "\033[33mCreating 'feature/setup-github' branch from 'main'...\n\033[0m"
    
    if [ "$DRY_RUN" != "true" ]; then
        # Ensure we're on main
        git checkout main
        git pull origin main
        
        # Create feature branch
        git checkout -b feature/setup-github 2>/dev/null || git checkout feature/setup-github
        
        # Add a marker file to ensure there's a difference
        marker_file="BRANCH_SETUP.txt"
        if [ ! -f "$marker_file" ]; then
            echo "This file marks the feature/setup-github branch setup." > "$marker_file"
            git add "$marker_file"
            git commit -m "chore: add branch setup marker"
        fi
        
        # Push feature branch to remote
        if git push -u origin feature/setup-github; then
            echo -e "\033[32m'feature/setup-github' branch created and pushed successfully\n\033[0m"
        else
            echo -e "\033[31mError: Failed to push 'feature/setup-github' branch\033[0m"
            exit 1
        fi
    else
        echo -e "\033[36m[DRY RUN] Would create and push 'feature/setup-github' branch\n\033[0m"
    fi
fi

# Verify setup
echo -e "\033[33mStep 4: Verifying branch setup...\033[0m"
if git ls-remote --heads origin | grep -q "refs/heads/main" && \
   git ls-remote --heads origin | grep -q "refs/heads/feature/setup-github"; then
    echo -e "\n\033[32mSetup Complete! ✓\033[0m"
    echo -e "\033[32mBoth 'main' and 'feature/setup-github' branches exist on remote.\n\033[0m"
    
    echo -e "\033[36mYou can now run your PR creation command:\033[0m"
    echo -e "gh pr create --repo Luke-Brittain/OliveBranch --base main --head feature/setup-github --title 'Your Title' --body 'Your Description' --reviewer Luke-Brittain\n"
else
    echo -e "\n\033[31mSetup incomplete. Please check errors above.\n\033[0m"
    exit 1
fi
