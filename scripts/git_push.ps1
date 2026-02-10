Set-Location 'C:\Users\KayaBread\Documents\Luke Docs\IOD\IOD-2'
Write-Output 'Git status (porcelain):'
$s = git status --porcelain
if ($s) { Write-Output $s } else { Write-Output '<clean>' }

# Stage all changes
git add -A

# Commit if there are staged changes
if ($s -ne $null -and $s -ne '') {
    git commit -m 'chore(playwright): add run-drag Playwright script, runner, retries, tracing; add TODO list'
} else {
    Write-Output 'No changes to commit'
}

# Get current branch
$branch = git rev-parse --abbrev-ref HEAD
Write-Output "Current branch: $branch"

# Push to origin
Write-Output 'Attempting push to origin...'
try {
    git push --set-upstream origin $branch -v
} catch {
    Write-Output 'Git push failed:'
    Write-Output $_.Exception.Message
    exit 1
}
