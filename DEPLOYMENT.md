# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Gemini API Key**: Get yours from [Google AI Studio](https://aistudio.google.com/apikey)

## Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Deploy via CLI

```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? bowling-analysis (or your choice)
# - Directory? ./
# - Override settings? No
```

### 3. Configure Environment Variables

After initial deployment, add your environment variables:

```bash
vercel env add GEMINI_API_KEY
# Paste your API key when prompted
# Select: Production, Preview, Development (all)

vercel env add GEMINI_MODEL
# Enter: gemini-2.5-flash
# Select: Production, Preview, Development (all)
```

**OR** via Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - `GEMINI_API_KEY` = your_gemini_api_key
   - `GEMINI_MODEL` = gemini-2.5-flash (optional, defaults to this)

### 4. Redeploy

```bash
vercel --prod
```

**OR** via GitHub Integration (Recommended):

1. Push your code to GitHub
2. Import project in Vercel Dashboard
3. Add environment variables
4. Deploy automatically on every push

## Alternative: Deploy via Vercel Dashboard

1. Visit [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: ./
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
4. Add environment variables (see step 3 above)
5. Click "Deploy"

## Important Notes

### Vercel Limits

- **Hobby Plan**: 10s serverless function timeout
- **Pro Plan**: 60s timeout (recommended for video processing)
- **File Upload**: Max 4.5MB body size on Hobby (you may hit this with large videos)

For large video files (>50MB), consider upgrading to Pro or using a different hosting solution (Railway, Render, Fly.io, Digital Ocean).

### Testing

After deployment, your app will be available at:
```
https://your-project-name.vercel.app
```

Test the health endpoint:
```bash
curl https://your-project-name.vercel.app/api/health
```

### Custom Domain (Optional)

1. Go to project settings → Domains
2. Add your custom domain
3. Configure DNS as instructed

## Troubleshooting

### "API key not configured"
- Verify environment variables are set in Vercel Dashboard
- Redeploy after adding env vars

### "Function timeout"
- Upgrade to Vercel Pro for 60s timeout
- Or try a shorter video clip

### "Body size limit exceeded"
- Vercel Hobby has 4.5MB limit
- Use Vercel Pro (100MB body limit)
- Or compress videos before upload

### Static files not loading
- Check `vercel.json` routes configuration
- Ensure `public/` folder structure is correct

## Local Development

Your existing setup works locally:

```bash
npm install
npm run dev
```

## Alternative Hosting Options

If Vercel's serverless limits are too restrictive:

- **Railway.app** - Better for long-running processes
- **Render.com** - Free tier with longer timeouts
- **Fly.io** - Better video upload handling
- **Digital Ocean App Platform** - Good for larger files

Would you like help setting up on any of these platforms instead?
