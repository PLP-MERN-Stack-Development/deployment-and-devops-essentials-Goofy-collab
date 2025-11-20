# 🚀 Deployment Guide - Render + Netlify

Complete guide for deploying your Socket.io chat application with Render (backend) and Netlify (frontend).

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment (Render)](#backend-deployment-render)
3. [Frontend Deployment (Netlify)](#frontend-deployment-netlify)
4. [Environment Configuration](#environment-configuration)
5. [Testing Deployment](#testing-deployment)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### 1. Prepare Your Code

- [ ] All features working locally
- [ ] `.env` files configured correctly
- [ ] `.gitignore` includes `node_modules/`, `.env`, and `dist/`
- [ ] No console errors in browser
- [ ] Server starts without errors
- [ ] Code committed to GitHub

### 2. Create Accounts

Create free accounts on:
- [ ] [GitHub](https://github.com) (you probably have this)
- [ ] [Render](https://render.com) for backend
- [ ] [Netlify](https://netlify.com) for frontend
- [ ] [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database

### 3. Test Builds

```bash
# Test server
cd server
npm install
npm start

# Test client build
cd ../client
npm install
npm run build
```

---

## 🎨 Backend Deployment (Render)

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Web Service on Render

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub repository:**
   - Click "Connect account" if needed
   - Select your repository
   - Click "Connect"

### Step 3: Configure Render Service

**Basic Settings:**

| Setting | Value |
|---------|-------|
| **Name** | `socketio-chat-backend` (or your choice) |
| **Region** | Select closest to your users |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

**Environment:**
- **Node Version**: `18` (or higher)

### Step 4: Add Environment Variables

In Render dashboard, scroll to **"Environment"** section and add:

```
PORT
Value: 10000
(Render uses port 10000 by default)

NODE_ENV
Value: production

CLIENT_URL
Value: https://your-app.netlify.app
(Update after deploying frontend)

MONGODB_URI
Value: mongodb+srv://username:password@cluster.mongodb.net/chatapp?retryWrites=true&w=majority
(Your MongoDB connection string)

ALLOWED_ORIGINS
Value: https://your-app.netlify.app
(Update after deploying frontend)

RATE_LIMIT_WINDOW_MS
Value: 900000

RATE_LIMIT_MAX_REQUESTS
Value: 100
```

### Step 5: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes for first deploy)
3. **Watch the logs** - you should see:
   ```
   ✅ MongoDB connected successfully
   🚀 Server running on port 10000
   ```

### Step 6: Get Your Render URL

After deployment succeeds:
- Your URL will be: `https://your-service-name.onrender.com`
- **Copy this URL** - you'll need it for frontend!

### Step 7: Test Backend

Visit in browser:
```
https://your-service-name.onrender.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "environment": "production"
}
```

**✅ If you see this, backend is working!**

---

## ⚡ Frontend Deployment (Netlify)

### Step 1: Prepare Frontend

Make sure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Netlify deployment"
git push origin main
```

### Step 2: Deploy to Netlify

1. **Go to [Netlify Dashboard](https://app.netlify.com)**
2. **Click "Add new site"** → **"Import an existing project"**
3. **Connect to Git:**
   - Click "GitHub"
   - Authorize Netlify
   - Select your repository

### Step 3: Configure Build Settings

**Site settings:**

| Setting | Value |
|---------|-------|
| **Branch to deploy** | `main` |
| **Base directory** | `client` |
| **Build command** | `npm run build` |
| **Publish directory** | `client/dist` |

**Advanced build settings:**

Click "Show advanced" and add environment variable:

```
VITE_SOCKET_URL
Value: https://your-service-name.onrender.com
(Your Render URL from earlier)
```

### Step 4: Deploy

1. **Click "Deploy site"**
2. **Wait for build** (2-3 minutes)
3. **Watch build logs** for any errors

### Step 5: Get Your Netlify URL

After deployment:
- Netlify generates a URL like: `https://random-name-123456.netlify.app`
- **Click "Domain settings"** to customize
- **Copy your final URL**

### Step 6: Configure Custom Domain (Optional)

1. Click "Domain settings"
2. Click "Options" → "Edit site name"
3. Change to: `your-app-name.netlify.app`
4. Or add a custom domain

---

## 🔄 Update CORS Settings

### Go Back to Render

**Important:** Now that you have your Netlify URL, update backend CORS:

1. **Open Render Dashboard**
2. **Click your web service**
3. **Go to "Environment" tab**
4. **Update these variables:**

```
CLIENT_URL
New Value: https://your-app.netlify.app

ALLOWED_ORIGINS
New Value: https://your-app.netlify.app
```

5. **Click "Save Changes"**
6. **Render will automatically redeploy** (2-3 minutes)

---

## 🧪 Testing Deployment

### Test 1: Backend Health

```bash
curl https://your-service-name.onrender.com/api/health
```

✅ Should return JSON with `"status": "ok"`

### Test 2: Frontend Loads

Visit: `https://your-app.netlify.app`

✅ Should show login page

### Test 3: Socket.io Connection

1. Open browser console (F12)
2. Visit your Netlify URL
3. Login with username
4. Check console for: `Connected to server`
5. Should **NOT** see CORS errors

### Test 4: Real-time Messaging

1. Login on your Netlify URL
2. Send a test message
3. Open in incognito/another browser
4. Login with different username
5. ✅ Messages should appear in real-time

### Test 5: Database Persistence

1. Send some messages
2. Go to MongoDB Atlas
3. Browse Collections
4. ✅ Check messages are saved

---

## 🐛 Troubleshooting

### Issue 1: Render Service Won't Start

**Check Render Logs:**
1. Render Dashboard → Your Service
2. Click "Logs" tab
3. Look for errors

**Common Issues:**
- ❌ Missing `package.json` in server folder
- ❌ Wrong Root Directory (should be `server`)
- ❌ MongoDB connection failed
- ❌ Wrong Start Command

**Fix:**
- Verify `server/package.json` exists
- Check Root Directory = `server`
- Verify MongoDB URI is correct
- Start Command should be `npm start`

### Issue 2: Netlify Build Fails

**Check Netlify Build Logs:**
1. Netlify Dashboard → Your Site
2. Click "Deploys"
3. Click failed deploy → "Deploy log"

**Common Issues:**
- ❌ Base directory not set to `client`
- ❌ Build command wrong
- ❌ Missing dependencies
- ❌ Environment variable missing

**Fix:**
- Set Base directory to `client`
- Build command: `npm run build`
- Publish directory: `client/dist`
- Add `VITE_SOCKET_URL` environment variable

### Issue 3: CORS Errors

**Error in browser console:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix:**
1. Go to Render Dashboard
2. Update `CLIENT_URL` to exact Netlify URL
3. Update `ALLOWED_ORIGINS` to exact Netlify URL
4. Save and wait for redeploy
5. Hard refresh browser (Ctrl+Shift+R)

### Issue 4: WebSocket Connection Failed

**Error:**
```
WebSocket connection to 'wss://...' failed
```

**Check:**
1. Is `VITE_SOCKET_URL` in Netlify correct?
2. Does it point to your Render URL?
3. Does it use `https://` (not `http://`)?
4. No trailing slash?

**Fix:**
1. Netlify Dashboard → Site Settings
2. Build & Deploy → Environment
3. Update `VITE_SOCKET_URL`
4. Trigger redeploy

### Issue 5: Render Service Spins Down

**Problem:** Render free tier sleeps after 15 min of inactivity

**Symptoms:**
- First request takes 30-60 seconds
- Service "wakes up" then works fine

**Solutions:**
1. **Use UptimeRobot** to ping every 14 minutes (keeps it awake)
2. **Upgrade to paid plan** ($7/month for always-on)
3. **Accept the spin-down** (acceptable for hobby projects)

**Set up keep-alive with UptimeRobot:**
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add Monitor:
   - Type: HTTP(s)
   - URL: `https://your-service-name.onrender.com/api/health`
   - Interval: 14 minutes
3. This keeps your service awake!

---

## 📊 Deployment URLs

**After successful deployment, record your URLs:**

```
Backend (Render):   https://_____________________.onrender.com
Frontend (Netlify): https://_____________________.netlify.app
MongoDB Atlas:      https://cloud.mongodb.com/
```

**Add these to your README.md!**

---

## 🔄 Making Updates

### Update Backend

```bash
# Make changes to server code
git add server/
git commit -m "Update backend feature"
git push origin main

# Render auto-deploys from GitHub
# Check deploy status in Render Dashboard
```

### Update Frontend

```bash
# Make changes to client code
git add client/
git commit -m "Update frontend feature"
git push origin main

# Netlify auto-deploys from GitHub
# Check deploy status in Netlify Dashboard
```

---

## 🔄 Rollback Procedures

### Backend Rollback (Render)

1. **Render Dashboard** → Your Service
2. Click **"Manual Deploy"** dropdown
3. Select **"Clear build cache & deploy"**
4. Or go to previous commit in GitHub
5. Trigger redeploy

### Frontend Rollback (Netlify)

1. **Netlify Dashboard** → Your Site
2. Click **"Deploys"**
3. Find last working deployment
4. Click **"⋯"** → **"Publish deploy"**
5. Confirm rollback

---

## 🎯 Auto-Deploy Configuration

### Render Auto-Deploy (Already Configured)

✅ Render automatically deploys when you push to `main` branch

**To disable:**
- Render Dashboard → Service → Settings
- Scroll to "Build & Deploy"
- Toggle "Auto-Deploy" off

### Netlify Auto-Deploy (Already Configured)

✅ Netlify automatically deploys when you push to `main` branch

**To disable:**
- Netlify Dashboard → Site settings
- Build & deploy → Continuous Deployment
- Click "Edit settings" → Disable

---

## 🎉 Deployment Complete!

Once all tests pass, your app is live! 🚀

### ✅ Success Checklist

- [ ] Backend URL returns 200 OK
- [ ] `/api/health` shows "ok" status
- [ ] Frontend loads login page
- [ ] Can login without errors
- [ ] Messages send in real-time
- [ ] No CORS errors in console
- [ ] No WebSocket errors
- [ ] MongoDB saves messages
- [ ] Multiple users can chat

---

## 📝 Next Steps

1. ✅ Set up monitoring (UptimeRobot)
2. ✅ Enable analytics (Netlify Analytics)
3. ✅ Add custom domain (optional)
4. ✅ Set up error tracking (Sentry)
5. ✅ Update README with URLs
6. ✅ Take screenshots
7. ✅ Submit assignment

