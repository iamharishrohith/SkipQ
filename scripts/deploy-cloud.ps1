# ==========================================================
# SkipQ v2 — Multi-Cloud Deployment Automation Script
# ==========================================================
# Automatically deploys the Elysia Bun API backend container to
# Google Cloud Run (asia-south1) and compiles/pushes the Next.js
# client portal to Firebase Hosting.

$ErrorActionPreference = "Stop"

Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "  SkipQ v2 Cloud Deployment Orchestration" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Cyan

# 1. Verify Prerequisites
Write-Host "🔍 Verifying developer toolchains..." -ForegroundColor Yellow
$prereqs = @("gcloud", "firebase", "bun")
foreach ($tool in $prereqs) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Error "❌ Missing required tool: $tool. Please install and add to PATH before deploying."
    }
}
Write-Host "✅ Toolchains active: gcloud, firebase, bun." -ForegroundColor Green

# 2. Local Verification Build
Write-Host "`n🔨 Running local monorepo validation build..." -ForegroundColor Yellow
& bun run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Local monorepo compilation failed. Fix typescript/lint errors before pushing to cloud."
}
Write-Host "✅ Local verification build complete." -ForegroundColor Green

# 3. Deploy Backend to Google Cloud Run
Write-Host "`n📡 Deploying Elysia Bun API to Google Cloud Run..." -ForegroundColor Yellow
$gcloudProject = "skipq-ai"
$region = "asia-south1"

Write-Host "   Pinging Google Cloud registry and initializing source compiler..." -ForegroundColor DarkGray
& gcloud run deploy skipq-api `
    --source ../apps/api `
    --project $gcloudProject `
    --platform managed `
    --region $region `
    --allow-unauthenticated `
    --set-env-vars "NODE_ENV=production,DATA_DIR=/data"

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Google Cloud Run deployment failed."
}

# Fetch active API URL
$apiUrl = $(gcloud run services describe skipq-api --project $gcloudProject --region $region --format 'value(status.url)')
Write-Host "✅ Elysia API deployed successfully to Google Cloud Run!" -ForegroundColor Green
Write-Host "🔗 API URL: $apiUrl" -ForegroundColor Green

# 4. Deploy Next.js Frontend to Firebase Hosting
Write-Host "`n📦 Provisioning Next.js production portal variables..." -ForegroundColor Yellow

# Set API env for production build
$env:NEXT_PUBLIC_API_URL = $apiUrl
Write-Host "   API endpoint configured: $env:NEXT_PUBLIC_API_URL" -ForegroundColor DarkGray

Write-Host "   Compiling static bundles..." -ForegroundColor DarkGray
& bun run build

Write-Host "🚀 Launching client to Firebase Hosting..." -ForegroundColor Yellow
& firebase deploy --only hosting --project $gcloudProject

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Firebase Hosting deployment failed."
}

Write-Host "`n─────────────────────────────────────────" -ForegroundColor Green
Write-Host "  🎉 SKIPQ V2 MULTI-CLOUD DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "─────────────────────────────────────────" -ForegroundColor Green
Write-Host "  API (Cloud Run): $apiUrl" -ForegroundColor Cyan
Write-Host "  Client (Firebase): https://skipq-ai.web.app" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────" -ForegroundColor Green
