# 🚀 Deployment Guide for RentVsBuy.ai

This guide covers deploying your RentVsBuy.ai application to production with a custom domain.

## 📋 Prerequisites

- Domain name ready
- OpenAI API key
- GitHub account (for CI/CD)
- Hosting accounts (see options below)

## 🏗️ Architecture Overview

Your app has two parts:
1. **Frontend** (React/Vite) - Static files, can be hosted anywhere
2. **Backend** (FastAPI/Python) - Needs Python runtime, handles AI and calculations

## 🎯 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) ⭐ Recommended

**Why:** Easiest setup, great free tiers, automatic HTTPS

#### Frontend on Vercel:

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Build your frontend:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   vercel
   ```
   - Follow prompts
   - It will detect Vite automatically
   - Add environment variable: `VITE_BACKEND_URL=https://your-backend-url.railway.app`

4. **Connect your domain:**
   - Go to Vercel dashboard → Your project → Settings → Domains
   - Add your domain
   - Update DNS records as instructed

#### Backend on Railway:

1. **Go to [railway.app](https://railway.app)** and sign up
2. **Create new project** → "Deploy from GitHub repo"
3. **Select your repo** and set root directory to `backend/`
4. **Add environment variables:**
   ```
   OPENAI_API_KEY=your_openai_key_here
   CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```
5. **Set start command:**
   ```
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
6. **Railway will give you a URL** like `https://your-app.railway.app`
7. **Update frontend** `VITE_BACKEND_URL` to this Railway URL

---

### Option 2: Netlify (Frontend) + Render (Backend)

#### Frontend on Netlify:

1. **Go to [netlify.com](https://netlify.com)** and sign up
2. **Add new site** → "Import from Git" → Select your repo
3. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Environment variables:**
   - `VITE_BACKEND_URL=https://your-backend.onrender.com`
5. **Custom domain:** Settings → Domain management → Add custom domain

#### Backend on Render:

1. **Go to [render.com](https://render.com)** and sign up
2. **New** → "Web Service" → Connect GitHub repo
3. **Settings:**
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment variables:**
   ```
   OPENAI_API_KEY=your_key
   CORS_ORIGINS=https://yourdomain.com
   ```
5. **Get URL** and update frontend

---

### Option 3: All-in-One (Fly.io or AWS)

#### Fly.io (Both Frontend & Backend):

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Backend deployment:**
   ```bash
   cd backend
   fly launch
   # Follow prompts, create fly.toml
   ```
   
   Create `backend/fly.toml`:
   ```toml
   app = "rentvsbuy-backend"
   primary_region = "iad"
   
   [build]
   
   [http_service]
     internal_port = 8000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
     processes = ["app"]
   
   [[services]]
     http_checks = []
     internal_port = 8000
     processes = ["app"]
     protocol = "tcp"
     script_checks = []
   
     [services.concurrency]
       hard_limit = 25
       soft_limit = 20
       type = "connections"
   
     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80
   
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   
     [[services.tcp_checks]]
       grace_period = "1s"
       interval = "15s"
       restart_limit = 0
       timeout = "2s"
   ```
   
   Create `backend/Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```
   
   Deploy:
   ```bash
   fly deploy
   fly secrets set OPENAI_API_KEY=your_key
   fly secrets set CORS_ORIGINS=https://yourdomain.com
   ```

3. **Frontend deployment:**
   ```bash
   cd ..
   npm run build
   fly launch --name rentvsbuy-frontend
   ```
   
   Create `fly.toml` in root:
   ```toml
   app = "rentvsbuy-frontend"
   primary_region = "iad"
   
   [build]
     builder = "static"
   
   [http_service]
     internal_port = 8080
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
   
   [[services]]
     http_checks = []
     internal_port = 8080
     processes = ["app"]
     protocol = "tcp"
     script_checks = []
   
     [[services.ports]]
       force_https = true
       handlers = ["http"]
       port = 80
   
     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```
   
   Create `Dockerfile` in root:
   ```dockerfile
   FROM nginx:alpine
   COPY dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/conf.d/default.conf
   ```
   
   Create `nginx.conf`:
   ```nginx
   server {
       listen 8080;
       root /usr/share/nginx/html;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

---

## 🔧 Configuration Steps

### 1. Update Backend CORS Settings

In `backend/app/config.py`, ensure CORS allows your domain:

```python
cors_origins: list[str] = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    # Add any other domains you use
]
```

Or use environment variable:
```bash
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 2. Update Frontend API URL

Create `.env.production` in root:
```env
VITE_BACKEND_URL=https://your-backend-url.railway.app
```

Or set in your hosting platform's environment variables.

### 3. Environment Variables Checklist

**Backend:**
- ✅ `OPENAI_API_KEY` - Your OpenAI API key
- ✅ `CORS_ORIGINS` - Comma-separated list of allowed origins
- ✅ `PORT` - Usually set automatically by hosting platform

**Frontend:**
- ✅ `VITE_BACKEND_URL` - Your backend API URL

### 4. Build Optimization

Before deploying, optimize your build:

```bash
# Frontend
npm run build

# Check build size
du -sh dist/
```

Consider adding to `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
})
```

---

## 🔒 Security Checklist

- [ ] **Never commit `.env` files** - Already in `.gitignore` ✅
- [ ] **Use HTTPS everywhere** - Most platforms do this automatically
- [ ] **Set CORS origins** - Only allow your domain(s)
- [ ] **Rate limiting** - Consider adding to backend (optional)
- [ ] **API key security** - Keep OpenAI key in environment variables only
- [ ] **Error handling** - Don't expose sensitive info in error messages

---

## 📊 Monitoring & Analytics

### Add Error Tracking (Optional):

1. **Sentry** - Free tier available
   ```bash
   npm install @sentry/react
   ```

2. **Google Analytics** - Track usage
   ```bash
   npm install react-ga4
   ```

### Health Checks:

Your backend already has `/health` endpoint. Set up monitoring:
- UptimeRobot (free)
- Pingdom
- Your hosting platform's built-in monitoring

---

## 🚦 Post-Deployment Checklist

- [ ] Frontend loads at your domain
- [ ] Backend health check works: `https://your-backend.com/health`
- [ ] Frontend can communicate with backend (check browser console)
- [ ] OpenAI API calls work (test the chat)
- [ ] Charts render correctly
- [ ] PDF export works
- [ ] Mobile responsive design works
- [ ] HTTPS is enabled (check for 🔒 in browser)
- [ ] Domain redirects `www` to non-www (or vice versa)

---

## 🐛 Troubleshooting

### CORS Errors:
- Check `CORS_ORIGINS` includes your frontend domain
- Ensure no trailing slashes in URLs
- Check browser console for exact error

### API Not Found:
- Verify `VITE_BACKEND_URL` is set correctly
- Check backend is running and accessible
- Test backend URL directly in browser

### Build Fails:
- Check Node.js version (should be 20.19+ or 22.12+)
- Clear `node_modules` and reinstall
- Check for TypeScript errors: `npm run build`

### Backend Timeouts:
- Increase timeout in `src/lib/api/finance.ts` (currently 180s)
- Consider adding request queuing for heavy calculations

---

## 💰 Cost Estimates

**Free Tier Options:**
- Vercel: Free (generous limits)
- Railway: $5/month after free trial
- Render: Free tier available (sleeps after inactivity)
- Netlify: Free tier available
- Fly.io: Free tier available

**Expected Monthly Costs:**
- Hosting: $0-10/month (depending on traffic)
- OpenAI API: Pay-per-use (~$0.01-0.10 per conversation)
- Domain: $10-15/year

---

## 🎉 Quick Start (Vercel + Railway)

1. **Deploy Backend:**
   ```bash
   # Push to GitHub first
   git push origin main
   
   # Go to railway.app, connect repo, set root to backend/
   # Add OPENAI_API_KEY and CORS_ORIGINS
   # Get your Railway URL
   ```

2. **Deploy Frontend:**
   ```bash
   npm i -g vercel
   vercel
   # Add VITE_BACKEND_URL=https://your-app.railway.app
   # Connect your domain
   ```

3. **Update DNS:**
   - Add A/CNAME records as instructed by Vercel
   - Wait for propagation (5-30 minutes)

4. **Test:**
   - Visit your domain
   - Test chat functionality
   - Check browser console for errors

---

## 📞 Need Help?

- Check hosting platform docs
- Review error logs in hosting dashboard
- Test locally first: `npm run dev` and `cd backend && uvicorn app.main:app --reload`

Good luck with your launch! 🚀

