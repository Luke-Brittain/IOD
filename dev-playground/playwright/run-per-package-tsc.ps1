# Run per-package TypeScript checks and save to per-package-tsc.log
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptPath '..\..')
$repoRoot = $repoRoot.Path
$out = Join-Path $repoRoot 'dev-playground\playwright\per-package-tsc.log'
if (Test-Path $out) { Remove-Item $out }
Write-Output "Repository root: $repoRoot"
$files = Get-ChildItem -Path $repoRoot -Filter tsconfig.json -Recurse -File `
  | Where-Object { $_.FullName -notmatch '\\removed-unused\\' -and $_.FullName -notmatch '\\node_modules\\' }
foreach ($f in $files) {
  $rel = $f.FullName.Substring($repoRoot.Length+1).Replace('\\','/')
  $dir = Split-Path $f.FullName -Parent
  Write-Output "Typechecking project in: $rel"
  Push-Location $dir
  try {
    pnpm dlx --package typescript -- tsc -p tsconfig.json --noEmit 2>&1 | Tee-Object -FilePath $out -Append
  } catch {
    Write-Output "tsc invocation failed in $dir" | Tee-Object -FilePath $out -Append
  }
  Pop-Location
}
Write-Output 'Done';
if (Test-Path $out) { Write-Output 'Tail of per-package log:'; Get-Content $out -Tail 200 } else { Write-Output 'No per-package tsc log found' }
