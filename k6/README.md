# k6 concurrency test

This folder contains a k6 test that validates optimistic locking for appointment booking.

## Files
- seed-k6.js: Creates one nutritionist, one slot, and N patients. Exports NUTRI_ID, SLOT_ID, SLOT_VERSION, and PATIENT_TOKENS for k6.
- race-condition.js: Runs 5 concurrent attempts to book the same slot and reports 201 vs 409 counts.

## Local run (Windows)
1) Ensure the backend stack is up (api-gateway, identity-service, clinical-service, agenda-service, mongodb).
2) Run the seed script and k6:

One-liner:

```powershell
$env:GITHUB_ENV = "k6\k6.env" ; node k6\seed-k6.js ; Get-Content k6\k6.env | ForEach-Object { if ($_ -and $_.Contains('=')) { $parts = $_ -split '=', 2; if ($parts.Length -eq 2) { Set-Item -Path "env:$($parts[0])" -Value $parts[1] } } } ; & "C:\Program Files\k6\k6.exe" run k6\race-condition.js
```

```powershell
$env:GITHUB_ENV = "k6\k6.env"
node k6\seed-k6.js
Get-Content k6\k6.env | ForEach-Object {
  if ($_ -and $_.Contains('=')) {
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) { Set-Item -Path "env:$($parts[0])" -Value $parts[1] }
  }
}
& "C:\Program Files\k6\k6.exe" run k6\race-condition.js
```

You should see a summary line like:

```
Appointment results: 201=1 409=4
```

## GitHub Actions
In CI, `seed-k6.js` writes to the special `GITHUB_ENV` file automatically, so no local `k6.env` is required.

## Optional env vars
- BASE_URL: Override default http://localhost:80
- SEED_PASSWORD: Override default SecureP@ss123
- PATIENT_COUNT: Override default 5
