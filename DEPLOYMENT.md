# NeuraForge UI — Deployment Guide

## Prerequisites

- Node.js 22+ installed
- npm account (create at [npmjs.com/signup](https://www.npmjs.com/signup))
- GitHub account (you already have this)
- Docker Desktop (optional, for self-hosting)

---

## Step 1: Login to npm

```powershell
npm login
```

Follow the prompts — enter your npm username, password, email, and OTP if 2FA is enabled.

Verify you're logged in:
```powershell
npm whoami
```

---

## Step 2: Set Version to 0.1.0

Run this from the `plan/` directory:

```powershell
cd D:\2026_Online_work\Startups-2026\NeuraForge\plan

# Set version on all packages
node -e "const fs=require('fs');const path=require('path');['package.json','packages/schemas/package.json','packages/catalog-core/package.json','packages/tokens/package.json','packages/components/package.json','packages/motion/package.json','packages/three-d/package.json','packages/compositions/package.json','packages/registry-builder/package.json','packages/mcp-core/package.json','packages/cli/package.json','packages/conformance/package.json','packages/telemetry/package.json','packages/self-hosting/package.json','packages/release-policy/package.json','services/public-api/package.json','services/hosted-gateway/package.json'].forEach(f=>{const p=JSON.parse(fs.readFileSync(f,'utf8'));p.version='0.1.0';fs.writeFileSync(f,JSON.stringify(p,null,2)+'\n')})"
```

---

## Step 3: Publish All Packages to npm

On Windows PowerShell, use `;` instead of `&&`:

```powershell
cd D:\2026_Online_work\Startups-2026\NeuraForge\plan

# Publish in dependency order (important!)
cd packages/schemas ; npm publish --access public ; cd ../..
cd packages/catalog-core ; npm publish --access public ; cd ../..
cd packages/tokens ; npm publish --access public ; cd ../..
cd packages/components ; npm publish --access public ; cd ../..
cd packages/motion ; npm publish --access public ; cd ../..
cd packages/three-d ; npm publish --access public ; cd ../..
cd packages/compositions ; npm publish --access public ; cd ../..
cd packages/registry-builder ; npm publish --access public ; cd ../..
cd packages/mcp-core ; npm publish --access public ; cd ../..
cd packages/cli ; npm publish --access public ; cd ../..
cd packages/conformance ; npm publish --access public ; cd ../..
cd packages/telemetry ; npm publish --access public ; cd ../..
cd packages/self-hosting ; npm publish --access public ; cd ../..
cd packages/release-policy ; npm publish --access public ; cd ../..
```

### Alternative: Publish All at Once (npm workspaces)

```powershell
cd D:\2026_Online_work\Startups-2026\NeuraForge\plan
npm publish --workspaces --access public
```

---

## Step 4: Set Up GitHub Secrets for CI Publishing

1. Go to: https://github.com/aqeel-spec/neuraforge/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `NPM_TOKEN`
4. Value: Your npm automation token (get from https://www.npmjs.com/settings/tokens → Generate New Token → Automation)
5. Click **"Add secret"**

Now the GitHub Actions release workflow can publish automatically.

---

## Step 5: Deploy Documentation Site

### Option A: Vercel (Recommended — Free)

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import `aqeel-spec/neuraforge`
4. Configure:
   - **Root Directory**: `plan/apps/docs`
   - **Framework Preset**: Other
   - **Build Command**: `echo "Static site"`
   - **Output Directory**: `src/pages`
5. Click **Deploy**

### Option B: GitHub Pages

Add this to `.github/workflows/ci.yml` (after the check job):

```yaml
  deploy-docs:
    runs-on: ubuntu-latest
    needs: check
    if: github.ref == 'refs/heads/main'
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: plan/apps/docs/src/pages
      - uses: actions/deploy-pages@v4
```

Then enable Pages in repo settings → Pages → Source: GitHub Actions.

---

## Step 6: Deploy Public API

### Option A: Vercel Serverless (Free)

Create `plan/services/public-api/vercel.json`:
```json
{
  "buildCommand": "",
  "outputDirectory": ".",
  "functions": {
    "src/serverless.ts": {
      "runtime": "@vercel/node@3"
    }
  },
  "routes": [
    { "src": "/(.*)", "dest": "src/serverless.ts" }
  ]
}
```

Deploy:
```powershell
cd D:\2026_Online_work\Startups-2026\NeuraForge\plan\services\public-api
npx vercel deploy --prod
```

### Option B: Railway (Free tier)

1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Set root directory: `plan`
4. It will use the Dockerfile automatically

### Option C: Render (Free tier)

1. Go to [render.com](https://render.com)
2. New → Web Service → Connect your repo
3. Root directory: `plan`
4. Docker runtime
5. Free instance type

---

## Step 7: Docker Hub (for self-hosting users)

```powershell
cd D:\2026_Online_work\Startups-2026\NeuraForge\plan

# Build
docker build -t aqeelspec/neuraforge:0.1.0 .
docker tag aqeelspec/neuraforge:0.1.0 aqeelspec/neuraforge:latest

# Login to Docker Hub
docker login

# Push
docker push aqeelspec/neuraforge:0.1.0
docker push aqeelspec/neuraforge:latest
```

Now anyone can run:
```bash
docker pull aqeelspec/neuraforge:latest
docker compose up -d
```

---

## Step 8: Custom Domain (Optional)

1. Buy `neuraforge.dev` (or similar) from Namecheap/Cloudflare (~$12/year)
2. Add custom domain in Vercel project settings
3. Update DNS records (Vercel will tell you what to add)
4. Update `plan/apps/docs/astro.config.mjs`:
   ```js
   site: 'https://neuraforge.dev'
   ```

---

## After Going Live — What Users See

| Channel | URL | Command |
|---------|-----|---------|
| **GitHub** | github.com/aqeel-spec/neuraforge | — |
| **npm** | npmjs.com/org/neuraforge | `npm install @neuraforge-ui/components` |
| **Docs** | neuraforge.vercel.app (or custom domain) | — |
| **API** | api.neuraforge.dev/v1/components | `curl https://api.neuraforge.dev/v1/components` |
| **Docker** | hub.docker.com/r/aqeelspec/neuraforge | `docker pull aqeelspec/neuraforge` |
| **MCP** | — | See MCP config in README |
| **CLI** | — | `npx @neuraforge-ui/cli search "pricing"` |

---

## Troubleshooting

### "npm error need auth"
You're not logged in. Run `npm login` first.

### "&&" not valid in PowerShell
Use `;` instead of `&&` on Windows PowerShell:
```powershell
# Wrong (bash/cmd syntax):
cd packages/schemas && npm publish

# Correct (PowerShell):
cd packages/schemas ; npm publish ; cd ../..
```

### Package version is 0.0.0
Set the version before publishing:
```powershell
npx json -I -f package.json -e "this.version='0.1.0'"
```

### "repository" warning on publish
This is harmless. npm auto-corrects the string format to an object. You can fix it permanently:
```powershell
npm pkg fix
```

### CI fails with "Missing from lock file"
Run locally and push:
```powershell
cd D:\2026_Online_work\Startups-2026\NeuraForge\plan
npm install
git add package-lock.json
git commit -m "fix: sync package-lock.json"
git push
```
