# Vercel Environment Variables Setup

## Required Environment Variables

### GOOGLE_API_KEY
The Google Gemini API key is now configured at the project level in Vercel, not in user settings.

## Setup Instructions

### 1. Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `GOOGLE_API_KEY`
   - **Value**: Your Gemini API key (get from https://aistudio.google.com/app/apikey)
   - **Environments**: Select all (Production, Preview, Development)
4. Click **Save**
5. Redeploy your application for changes to take effect

### 2. Via Vercel CLI

```bash
# Add environment variable
vercel env add GOOGLE_API_KEY

# When prompted:
# - Enter your Gemini API key
# - Select environments: Production, Preview, Development
# - Confirm

# Pull environment variables to local
vercel env pull .env.local
```

### 3. For Local Development

Create a `.env.local` file in your project root (already gitignored):

```bash
# Google Gemini AI API Key
GOOGLE_API_KEY=your_api_key_here

# Optional: Vercel Blob Storage
# BLOB_READ_WRITE_TOKEN=

# Optional: Vercel API Key for deployments
# VERCEL_API_KEY=
```

**Note**: The `.env` file is for local development only and should never be committed to Git.

## Security Best Practices

✅ **DO:**
- Store API keys in Vercel environment variables
- Use different keys for production and development
- Rotate API keys regularly
- Monitor API usage in Google AI Studio

❌ **DON'T:**
- Commit API keys to Git
- Share API keys in code or logs
- Use the same key across multiple projects
- Store keys in localStorage or client-side code

## Verification

After setting up the environment variable:

1. Check that the key is set:
   ```bash
   vercel env ls
   ```

2. Test locally:
   ```bash
   npm run dev
   # Try creating a wellness plan
   ```

3. Test on Vercel (after deployment):
   - Visit your deployed app
   - Try creating a wellness plan
   - Check Vercel logs for any errors

## Troubleshooting

### "API key not configured" error
- Verify the environment variable name is exactly `GOOGLE_API_KEY`
- Redeploy after adding environment variables
- Check that the key is available in the correct environment (Production/Preview)

### "403 Forbidden" or "API key leaked" error
- Your API key may have been compromised
- Generate a new key at https://aistudio.google.com/app/apikey
- Delete the old key
- Update the environment variable in Vercel

### Local development not working
- Ensure `.env.local` or `.env` file exists with `GOOGLE_API_KEY`
- Restart your dev server after adding the key
- Check the key is valid at Google AI Studio

## Current Configuration

- **Model**: `gemini-2.5-pro`
- **Max Output Tokens**: 16,384
- **Location**: Server-side only (API routes)
- **Access**: Environment variable `process.env.GOOGLE_API_KEY`

## Related Files

- `/app/api/lifeengine/generate/route.ts` - Plan generation API (uses the key)
- `/.env` - Local development (gitignored)
- `/.gitignore` - Ensures `.env` files are not committed
- `/app/lifeengine/settings/page.tsx` - Settings page (API key input removed)
