# SkipQ (v2) — Multi-Cloud Technical Deployment Guide

This guide details the technical steps to deploy the SkipQ v2 monorepo to production using:
1. **Google Cloud Run**: To host the high-performance, serverless Elysia API backend container running on Bun.
2. **Firebase Hosting**: To host the Next.js static production frontend client.

---

## 🛠️ Step 1: Deploy Elysia Bun Backend to Google Cloud Run

Google Cloud Run is a managed serverless platform that automatically scales container images. The monorepo has a configured production [Dockerfile](file:///d:/Projects/Web-Apps/skipq-v2/apps/api/Dockerfile) that bundles all backend and shared monorepo modules into a single optimized Bun compiled bundle.

### Prerequisites:
1. Make sure you have the [Google Cloud CLI](https://cloud.google.com/sdk/gcloud) installed.
2. Authenticate and log in:
   ```bash
   gcloud auth login
   ```
3. Set your active Google Cloud project ID (e.g. `skipq-ai`):
   ```bash
   gcloud config set project skipq-ai
   ```

### Command Execution:
Navigate to the workspace root and run the GCP compiler to build and deploy your container source directly to Cloud Run:
```bash
gcloud run deploy skipq-api \
    --source apps/api \
    --platform managed \
    --region asia-south1 \
    --allow-unauthenticated
```
*GCP will compile the image remotely using Cloud Build, upload it to the Artifact Registry, and launch a serverless service.*

### Cloud Environment Variables Configuration:
After deployment, configure environment variables in the Cloud Run Dashboard or via CLI:
* `NODE_ENV`: `production`
* `DATA_DIR`: `/data` (We use a persistent volume mount here to store `db.json` and `transactions.aof` safely).
* `REDIS_URL`: URL to your production Redis/Upstash database for token scheduling queues (e.g. `redis://default:password@your-redis.upstash.io:6379`).
* `GEMINI_API_KEY`: Your live Google AI Studio API key.
* `JWT_SECRET`: A secure cryptographic signature for user token sessions.

---

## 🚀 Step 2: Deploy Next.js Frontend to Firebase Hosting

Firebase Hosting is highly optimized for fast static frontend pages. Since we are building an visual, lightning-fast landing page and client desks, we compile Next.js in static export mode.

### Prerequisites:
1. Make sure you have the [Firebase CLI](https://firebase.google.com/docs/cli) installed:
   ```bash
   npm install -g firebase-tools
   ```
2. Authenticate and log in:
   ```bash
   firebase login
   ```

### Compile & Deploy:
1. Direct the Next.js builder to point to your live Google Cloud Run URL (the active URL returned during Step 1):
   ```bash
   export NEXT_PUBLIC_API_URL=https://skipq-api-xxxx-as.a.run.app
   ```
2. Compile optimized production bundles:
   ```bash
   bun run build
   ```
3. Launch to Firebase Hosting:
   ```bash
   firebase deploy --only hosting --project skipq-ai
   ```

---

## ⚙️ CORS & Domain White-labeling

Once deployed, ensure the Elysia API backend CORS configurations allow operations coming from your hosting domain:
* Inside [index.ts](file:///d:/Projects/Web-Apps/skipq-v2/apps/api/src/index.ts), the server is pre-configured with open CORS filters `origin: true` allowing full flexibility for custom custom domains and local web access.

---

## ⚡ Automated Deployment
You can run the pre-configured PowerShell orchestration script to automatically build, compile, and push both stacks in a single command:
```powershell
./scripts/deploy-cloud.ps1
```
