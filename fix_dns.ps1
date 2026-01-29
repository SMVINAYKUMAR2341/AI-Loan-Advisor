# Fix DNS resolution by switching to Google DNS
# Run as Administrator

Write-Host "Checking DNS Resolution..." -ForegroundColor Yellow

# Test with current DNS
$currentDNS = nslookup ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech 2>&1

Write-Host "`nCurrent DNS Result:" -ForegroundColor Cyan
$currentDNS

# Try with Google DNS
Write-Host "`n`nTrying with Google DNS (8.8.8.8)..." -ForegroundColor Yellow
nslookup ep-ancient-smoke-a1z5yh5g-pooler.ap-southeast-1.aws.neon.tech 8.8.8.8

Write-Host "`n`n=== FIX ===" -ForegroundColor Green
Write-Host "If Google DNS works, you can switch your DNS settings:" -ForegroundColor White
Write-Host "1. Open Network Connections (Win + R, type 'ncpa.cpl')" -ForegroundColor White
Write-Host "2. Right-click your active network adapter > Properties" -ForegroundColor White
Write-Host "3. Select 'Internet Protocol Version 4 (TCP/IPv4)' > Properties" -ForegroundColor White
Write-Host "4. Choose 'Use the following DNS server addresses':" -ForegroundColor White
Write-Host "   Preferred DNS: 8.8.8.8" -ForegroundColor Yellow
Write-Host "   Alternate DNS: 8.8.4.4" -ForegroundColor Yellow
Write-Host "5. Click OK and restart" -ForegroundColor White

Write-Host "`n`nOr check Neon Console: https://console.neon.tech" -ForegroundColor Cyan
Write-Host "Your database might be suspended (free tier limitation)" -ForegroundColor Yellow
