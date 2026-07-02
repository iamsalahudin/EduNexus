$baseUrl = 'http://localhost:4000/api'

# Wait for server
$tries = 0
while($tries -lt 20) {
  try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/api/health" -Method Get -ErrorAction Stop
    Write-Host "Server is ready"
    break
  } catch {
    Start-Sleep -Seconds 1
    $tries++
    Write-Host "Waiting for server... attempt $tries"
  }
}

# Step 1: Login
Write-Host "STEP 1: Login"
try {
  $loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -Body (@{ email='hussain@gmail.com'; password='123456' } | ConvertTo-Json) `
    -ContentType 'application/json' -ErrorAction Stop
  $token = $loginResp.accessToken
  Write-Host "OK - Token obtained"
} catch {
  Write-Host "FAILED - $($_.Exception.Message)"
  exit 1
}

# Step 2: GET /api/fees
Write-Host "STEP 2: GET /api/fees"
try {
  $feesResp = Invoke-RestMethod -Uri "$baseUrl/fees" -Method Get `
    -Headers @{ Authorization="Bearer $token" } -ErrorAction Stop
  Write-Host "OK - Fees count: $($feesResp.fees.Count)"
} catch {
  Write-Host "FAILED - $($_.Exception.Message)"
}

# Step 3: POST /api/complaints
Write-Host "STEP 3: POST /api/complaints"
try {
  $complaintBody = @{
    subject = 'Smoke test complaint'
    message = 'Testing complaint API'
    relatedToStudent = $null
  } | ConvertTo-Json
  $complaintResp = Invoke-RestMethod -Uri "$baseUrl/complaints" -Method Post `
    -Body $complaintBody `
    -ContentType 'application/json' `
    -Headers @{ Authorization="Bearer $token" } -ErrorAction Stop
  $complaintId = $complaintResp.complaint._id
  Write-Host "OK - Complaint ID: $complaintId"
} catch {
  Write-Host "FAILED - $($_.Exception.Message)"
  exit 1
}

# Step 4: GET /api/complaints
Write-Host "STEP 4: GET /api/complaints"
try {
  $complaintListResp = Invoke-RestMethod -Uri "$baseUrl/complaints" -Method Get `
    -Headers @{ Authorization="Bearer $token" } -ErrorAction Stop
  Write-Host "OK - Complaints count: $($complaintListResp.complaints.Count)"
} catch {
  Write-Host "FAILED - $($_.Exception.Message)"
}

Write-Host ""
Write-Host "All smoke-tests completed!"
