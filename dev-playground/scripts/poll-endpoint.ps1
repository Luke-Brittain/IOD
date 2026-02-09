$addresses = @('127.0.0.1','localhost','::1')
foreach ($a in $addresses) {
  Write-Output "--- Trying $a"
  try {
    $r = Invoke-WebRequest -Uri "http://${a}:5174/api/nodes/n1/neighbors?depth=2" -UseBasicParsing -TimeoutSec 2
    Write-Output "Invoke-WebRequest OK:"
    $r.Content
    break
  } catch {
    Write-Output "Invoke-WebRequest ERR: $($_.Exception.Message)"
  }
}

Write-Output '--- curl attempts'
foreach ($a in $addresses) {
  Write-Output "--- curl $a"
  try {
    & curl "http://${a}:5174/api/nodes/n1/neighbors?depth=2" --silent --show-error
  } catch {
    Write-Output 'curl ERR'
  }
}

Write-Output '--- node fetch attempts'
foreach ($a in $addresses) {
  Write-Output "--- node $a"
  node -e "(async()=>{try{const r=await fetch('http://${a}:5174/api/nodes/n1/neighbors?depth=2'); const t=await r.text(); console.log(t);}catch(e){console.error('ERR',e.message);} })()"
}
