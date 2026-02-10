Start-Process -FilePath 'cmd.exe' -ArgumentList '/c pnpm dev -- --host 127.0.0.1' -NoNewWindow -PassThru | Out-Null
 $max = 20
 $urls = @('http://127.0.0.1:5174/','http://localhost:5174/','http://[::1]:5174/')
 $ready = $false
 for ($i = 0; $i -lt $max; $i++) {
  foreach ($u in $urls) {
    try {
      Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 2 | Out-Null
      Write-Output "HTTP_OK $u"
      $ready = $true
      break
    } catch {
      # ignore
    }
  }
  if ($ready) { break }
  Start-Sleep -s 1
 }
 if (-not $ready) {
  Write-Error 'server did not become ready on any address'
  exit 2
 } else {
  node playwright/run-drag.js
 }
