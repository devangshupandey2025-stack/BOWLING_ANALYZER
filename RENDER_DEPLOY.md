# Deploy to Render

Render is ideal for this app - no body size limits, better for file uploads, and longer execution times than Vercel.

## Quick Deploy (Recommended)

### Method 1: Blueprint (Automatic)

1. **Push to GitHub** (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy via Render Dashboard**:
   - Visit [dashboard.render.com/select-repo](https://dashboard.render.com/select-repo)
   - Connect your GitHub account
   - Select your repository
   - Render will auto-detect `render.yaml` and configure everything
   - Click "Apply"

3. **Add your Gemini API Key**:
   - After deployment starts, go to your service
   - Navigate to "Environment" tab
   - Find `GEMINI_API_KEY` and click "Generate Value"
   - Paste your API key from [Google AI Studio](https://aistudio.google.com/apikey)
   - Click "Save Changes"
   - Service will auto-redeploy

### Method 2: Manual Setup

1. **Create Web Service**:
   - Go to [dashboard.render.com](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your repo or choose "Deploy from Git URL"

2. **Configure**:
   - **Name**: bowlsense (or your choice)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

3. **Environment Variables**:
   Add these in the "Environment" section:
   ```
   NODE_ENV=production
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   RATE_LIMIT=10
   ```

4. **Deploy**: Click "Create Web Service"

## After Deployment

Your app will be live at:
```
https://bowlsense.onrender.com
```
(or your custom service name)

Test it:
```bash
curl https://YOUR_SERVICE_NAME.onrender.com/api/health
```

## Free Tier Limitations

✅ **Advantages over Vercel Free**:
- No body size limit (supports full 250MB videos)
- 15-minute timeout (plenty for video processing)
- Traditional server (not serverless cold starts)

⚠️ **Limitations**:
- **Spins down after 15 minutes of inactivity** (first request after wake takes ~30-60s)
- 512MB RAM (sufficient for this app)
- 750 hours/month free

### Keep Service Active

Add to your app or use a cron service to ping every 10 minutes:
```bash
# External service like cron-job.org
curl https://YOUR_SERVICE_NAME.onrender.com/api/health
```

Or upgrade to **Starter Plan ($7/month)** for:
- Always-on (no spin down)
- 512MB RAM
- Better performance

## Custom Domain

1. Go to service settings → "Custom Domain"
2. Add your domain
3. Configure DNS:
   ```
   CNAME record: your-domain.com → YOUR_SERVICE_NAME.onrender.com
   ```

## Monitoring

- View logs in real-time from your service dashboard
- Check "Metrics" tab for CPU/Memory usage
- "Events" tab shows deployment history

## Troubleshooting

### Service won't start
- Check "Logs" tab for errors
- Verify `GEMINI_API_KEY` is set correctly
- Ensure Node version >=18 (Render uses latest Node LTS by default)

### Video upload fails
- Check file size (250MB max in code)
- Verify video format is supported
- Check Render logs for detailed error

### Slow first request
- This is normal on free tier (service spins down after inactivity)
- Consider upgrading to Starter plan or use keep-alive ping

### Out of memory
- Free tier has 512MB RAM
- If processing very large videos, upgrade to Starter (512MB) or Standard (2GB)

## Comparison with Other Platforms

| Platform | Free Tier Body Limit | Timeout | Always-On | Best For |
|----------|---------------------|---------|-----------|----------|
| **Render** | ✅ Unlimited | 15 min | ❌ (sleeps) | Your app ✅ |
| Vercel | 4.5MB | 10s | ✅ | Static/API |
| Railway | ✅ Unlimited | ✅ No limit | ✅ ($5 credit) | Full apps |
| Fly.io | ✅ Unlimited | ✅ No limit | ✅ | Docker apps |

## Local Development

No changes needed - continue using:
```bash
npm run dev
```

## Need Help?

- [Render Docs](https://render.com/docs)
- [Render Community](https://community.render.com)
- [Contact Render Support](https://render.com/support)
