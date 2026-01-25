# Debugging Checklist for Vercel + Render Integration

## 1. Verify Render Backend is Working
```bash
curl https://your-render-url.onrender.com/api/market/indices
```

## 2. Check Vercel Environment Variables
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Ensure `VITE_API_URL` is set correctly
- Value should be: `https://your-render-url.onrender.com/api`

## 3. Redeploy Vercel
After adding environment variables, redeploy manually:
- Go to Deployments tab
- Click "Redeploy"

## 4. Check Browser Console
Open your Vercel site and check console for:
- API calls going to correct URL
- Any CORS errors
- Network tab for failed requests

## 5. Common Issues
- ❌ Missing `/api` at the end of URL
- ❌ Wrong Render URL
- ❌ CORS not configured on backend
- ❌ Environment variable not set on Vercel

## 6. Expected Working URLs
Frontend: https://your-app.vercel.app
Backend: https://your-app.onrender.com/api
API Endpoint: https://your-app.onrender.com/api/market/stocks
