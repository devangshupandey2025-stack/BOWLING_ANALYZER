# Render CLI Deployment Guide

## Prerequisites

You need Git installed and your code pushed to GitHub/GitLab/Bitbucket.

### Install Git

Download from: https://git-scm.com/download/win

After installation, restart your terminal and verify:
```powershell
git --version
```

### Initialize Git Repository

```powershell
cd "c:\Users\DEVANGSHU\OneDrive\Desktop\Bowling Analysis"

# Initialize repo
git init

# Add files
git add .

# Commit
git commit -m "Initial commit - BowlSense app"
```

### Push to GitHub

1. Create a new repo on GitHub: https://github.com/new
2. Copy the repo URL
3. Push your code:

```powershell
git remote add origin YOUR_GITHUB_REPO_URL
git branch -M main
git push -u origin main
```

## Deploy with Render CLI

### 1. Login to Render

```powershell
render login
```

This opens your browser for authentication.

### 2. Deploy Blueprint

```powershell
cd "c:\Users\DEVANGSHU\OneDrive\Desktop\Bowling Analysis"
render blueprint launch
```

The CLI will:
- Detect your `render.yaml`
- Create the service
- Start deployment

### 3. Set API Key

```powershell
# List your services
render services list

# Set environment variable (replace SERVICE_ID with your service ID)
render env set GEMINI_API_KEY=your_api_key_here --service SERVICE_ID
```

Or use the dashboard: https://dashboard.render.com → Your Service → Environment

### 4. Check Status

```powershell
render services list
render logs --service SERVICE_ID --tail
```

## Alternative: Deploy via Dashboard (No CLI Needed)

If you prefer not to use CLI:

1. **Push to GitHub** (follow steps above)
2. **Visit**: https://dashboard.render.com/select-repo
3. **Connect** your GitHub account
4. **Select** your repository
5. **Click** "Apply" (it auto-detects render.yaml)
6. **Add** `GEMINI_API_KEY` in Environment tab
7. **Deploy** automatically starts

This is actually simpler than CLI for first deployment!

## Render CLI Commands Reference

```powershell
# Login
render login

# Deploy from blueprint
render blueprint launch

# List services
render services list

# View logs
render logs --service SERVICE_ID --tail

# Set environment variable
render env set KEY=value --service SERVICE_ID

# Get service info
render services get SERVICE_ID

# Redeploy
render services restart SERVICE_ID

# Help
render --help
```

## Without Git?

If you don't want to install Git, use **Render Dashboard with manual upload**:

1. Zip your project folder (exclude `node_modules`, `.tmp-uploads`)
2. Visit: https://dashboard.render.com
3. Create "Web Service" → "Deploy from Git URL" won't work
4. You'll need to use GitHub/GitLab/Bitbucket integration

**Bottom line**: Git + GitHub is required for Render. It's worth the 5-minute setup!

## Quick Git Setup (Windows)

```powershell
# Install Git via winget (Windows Package Manager)
winget install --id Git.Git -e --source winget

# Or download installer
# https://git-scm.com/download/win

# After install, restart terminal
git --version

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Need Help?

- Git not working? Restart your terminal after installation
- GitHub auth? Use personal access token: https://github.com/settings/tokens
- Render CLI docs: https://render.com/docs/cli
