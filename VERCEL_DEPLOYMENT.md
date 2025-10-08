# Vercel Deployment Guide

## Prerequisites
- GitHub account with this repository
- Vercel account (free tier works)
- HubSpot access token

## Step-by-Step Deployment

### 1. Push Latest Changes to GitHub
```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `ank2828/CosentusWeb`
4. Vercel will auto-detect it's a Next.js project

### 3. Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required:**
- `HUBSPOT_ACCESS_TOKEN` = Your HubSpot private app access token
  - Get it from: https://app.hubspot.com/private-apps

**Optional:**
- `N8N_WEBHOOK_URL` = Your n8n webhook URL (if different from default)
  - Default: `https://cosentus.app.n8n.cloud/webhook/8d3ea813-b1bb-46f6-ba02-2f62775524b8`
- `HUBSPOT_OWNER_ID` = HubSpot user ID to assign contacts to

### 4. Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Your site will be live at: `https://your-project-name.vercel.app`

### 5. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain: `cosentusweb.com` or `app.cosentus.com`
3. Follow DNS configuration instructions

## What Gets Deployed

✅ **Included:**
- Next.js frontend
- API routes (chat, HubSpot integration)
- Static assets (images, audio files)
- Spline 3D components

❌ **Excluded (see `.vercelignore`):**
- `/backend` Python FastAPI server
- Test files
- PHP files
- Local env files

## Backend Consideration

The Python FastAPI backend in `/backend` is **not deployed** with this Vercel project.

**Options:**
1. **Deploy separately** on Railway, Render, or another Vercel project
2. **Use Next.js API routes** instead (current setup)
3. **Keep it local** for development only

Currently, all backend functionality is handled by Next.js API routes, so the Python backend is optional.

## Monitoring & Logs

- View deployment logs: Vercel Dashboard → Your Project → Deployments
- Runtime logs: Vercel Dashboard → Your Project → Logs
- Analytics: Built-in Vercel Analytics available

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

### API Routes Return 500
- Check environment variables are set correctly
- View runtime logs in Vercel dashboard
- Verify HubSpot token is valid

### Images Not Loading
- Check `next.config.ts` has correct image domains
- Verify images are in `/public` directory
- Check browser console for CORS errors

## Post-Deployment Checklist

- [ ] Visit deployed site and test navigation
- [ ] Test Spline 3D avatar loads correctly
- [ ] Click play on Cindy/Chris cards - verify waveforms animate
- [ ] Open chatbot and send a test message
- [ ] Verify HubSpot integration creates contacts
- [ ] Test on mobile devices
- [ ] Set up custom domain (if desired)
- [ ] Enable Vercel Analytics (optional)

## Updating the Site

Every push to `main` branch will automatically trigger a new deployment.

```bash
# Make changes locally
git add .
git commit -m "Your changes"
git push

# Vercel automatically deploys
```

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Support: https://vercel.com/support
