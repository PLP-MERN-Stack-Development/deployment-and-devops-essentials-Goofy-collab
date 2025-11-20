# 📊 Monitoring & Maintenance Setup

## Overview

This document covers the monitoring and maintenance strategy for the Socket.io Chat Application.

---

## 🏥 Health Check Endpoints

### Backend Health Check

**Endpoint:** `/api/health`

**Already implemented in server.js!** ✅

```javascript
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    users: userCount,
    rooms: rooms.length,
    messages: messageCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb: isMongoConnected() ? 'connected' : 'disconnected',
  });
});
```

**Test it:**
```bash
curl https://your-app.up.render.app/api/health
```

---

## 📈 Uptime Monitoring

### Option 1: UptimeRobot (Free, Recommended)

1. **Sign up at [UptimeRobot](https://uptimerobot.com)**
2. **Add New Monitor:**
   - Monitor Type: HTTP(s)
   - Friendly Name: Chat App Backend
   - URL: `https://your-app.up.render.app/api/health`
   - Monitoring Interval: 5 minutes
   - Alert When: Down

3. **Add Frontend Monitor:**
   - Monitor Type: HTTP(s)
   - Friendly Name: Chat App Frontend
   - URL: `https://your-app.vercel.app`
   - Monitoring Interval: 5 minutes

4. **Set up Alerts:**
   - Email notifications
   - Webhook notifications (optional)

**Features:**
- ✅ Free for up to 50 monitors
- ✅ 5-minute check intervals
- ✅ Email alerts
- ✅ Public status page

### Option 2: Better Uptime (Alternative)

1. **Sign up at [BetterUptime](https://betteruptime.com)**
2. Add monitors similar to above
3. More features but limited free tier

---

## 🐛 Error Tracking with Sentry

### Setup Sentry (Optional but Recommended)

#### 1. Create Sentry Account

1. Go to [Sentry.io](https://sentry.io)
2. Sign up with GitHub
3. Create new project:
   - Platform: Node.js (for backend)
   - Platform: React (for frontend)

#### 2. Install Sentry - Backend

```bash
cd server
npm install @sentry/node @sentry/profiling-node
```

**Add to server.js (at the top):**

```javascript
const Sentry = require("@sentry/node");
const { ProfilingIntegration } = require("@sentry/profiling-node");

// Initialize Sentry BEFORE any other code
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new ProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  
  console.log('✅ Sentry error tracking initialized');
}

// Add error handler BEFORE other error handlers
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Add Sentry error handler AFTER routes, BEFORE other error handlers
app.use(Sentry.Handlers.errorHandler());
```

**Add to render environment variables:**
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### 3. Install Sentry - Frontend

```bash
cd client
npm install @sentry/react
```

**Add to client/src/main.jsx:**

```javascript
import * as Sentry from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}
```

**Add to Vercel environment variables:**
```
VITE_SENTRY_DSN=https://your-frontend-sentry-dsn@sentry.io/project-id
```

---

## 📊 Performance Monitoring

### Backend Performance (render Built-in)

**render provides:**
- ✅ CPU usage metrics
- ✅ Memory usage metrics
- ✅ Network traffic
- ✅ Deployment logs

**Access:**
1. render Dashboard → Your Project
2. Click "Metrics" tab
3. View real-time performance

### Frontend Performance (Vercel Analytics)

**Enable Vercel Analytics:**

1. Go to Vercel Dashboard
2. Click your project
3. Go to "Analytics" tab
4. Click "Enable Analytics"

**Features:**
- Page load times
- Core Web Vitals
- Visitor insights
- Real User Monitoring

**Or use Google Lighthouse:**

```bash
npm install -g lighthouse

lighthouse https://your-app.vercel.app
```

---

## 🗄️ Database Monitoring

### MongoDB Atlas Built-in Monitoring

**MongoDB Atlas provides:**

1. **Real-time Metrics:**
   - Operations per second
   - Network traffic
   - Connection count
   - Query performance

2. **Access:**
   - MongoDB Atlas → Your Cluster
   - Click "Metrics" tab

3. **Set up Alerts:**
   - Click "Alerts"
   - Add alert for:
     - High connection count (> 80% of max)
     - High CPU usage (> 80%)
     - Low disk space (< 20%)
     - Replication lag

4. **Performance Advisor:**
   - Suggests indexes
   - Identifies slow queries
   - Recommends optimizations

---

## 🔄 Database Backups

### MongoDB Atlas Automatic Backups

**Already enabled on free tier!** ✅

**Features:**
- Continuous backups
- Point-in-time recovery
- Automatic snapshots

**Access:**
1. MongoDB Atlas → Your Cluster
2. Click "Backup" tab
3. View backup history

**To restore:**
1. Click "Restore" on a backup
2. Choose restore point
3. Create new cluster from backup

---

## 📝 Maintenance Plan

### Regular Updates Schedule

#### Weekly (Automated via Dependabot)

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/server"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "npm"
    directory: "/client"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
```

#### Monthly Manual Checks

- [ ] Review Sentry errors
- [ ] Check database performance
- [ ] Review uptime reports
- [ ] Update dependencies
- [ ] Test all features
- [ ] Review logs for anomalies

#### Quarterly

- [ ] Security audit
- [ ] Performance optimization
- [ ] Database cleanup
- [ ] Backup verification
- [ ] Documentation updates

---

## 🚨 Incident Response Plan

### When Something Goes Wrong

1. **Check Monitoring:**
   - UptimeRobot alerts
   - Sentry error reports
   - render/Vercel logs

2. **Identify Issue:**
   - Backend down?
   - Frontend down?
   - Database issue?
   - Network problem?

3. **Quick Fixes:**
   - Restart service (render/Vercel redeploy)
   - Check environment variables
   - Verify MongoDB connection
   - Check CORS settings

4. **Rollback if Needed:**
   - render: Click "Deployments" → Select previous version → "Redeploy"
   - Vercel: Click "Deployments" → Select previous version → "Promote to Production"

5. **Post-Mortem:**
   - Document what happened
   - What caused it?
   - How was it fixed?
   - How to prevent next time?

---

## 📋 Deployment Checklist

Before every deployment:

- [ ] All tests pass locally
- [ ] Build succeeds
- [ ] Environment variables updated
- [ ] Database migrations run (if any)
- [ ] Backup taken
- [ ] Staging tested (if available)
- [ ] Rollback plan ready
- [ ] Team notified

---

## 🔄 Rollback Procedures

### Backend Rollback (render)

1. Go to render Dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "⋮" → "Redeploy"
5. Wait for deployment (2-3 min)
6. Verify with health check

### Frontend Rollback (Vercel)

1. Go to Vercel Dashboard
2. Click "Deployments"
3. Find last working deployment
4. Click "⋮" → "Promote to Production"
5. Wait for rollback (1-2 min)
6. Verify site works

### Database Rollback (MongoDB)

1. Go to MongoDB Atlas
2. Click "Backup" tab
3. Select backup point before issue
4. Click "Restore"
5. Choose restore method
6. Update connection string if needed

---

## 📊 Monitoring Dashboard

### Key Metrics to Track

| Metric | Tool | Threshold | Action |
|--------|------|-----------|--------|
| Uptime | UptimeRobot | < 99% | Investigate |
| Response Time | UptimeRobot | > 2s | Optimize |
| Error Rate | Sentry | > 1% | Fix bugs |
| CPU Usage | render | > 80% | Scale up |
| Memory | render | > 80% | Optimize |
| DB Connections | MongoDB Atlas | > 80 | Investigate |
| Active Users | Socket.io | Monitor | Plan scaling |

---

## ✅ Setup Checklist

Task 5 Requirements:

- [x] **Health check endpoints** - Already in server.js ✅
- [ ] **Uptime monitoring** - Set up UptimeRobot
- [ ] **Error tracking** - Set up Sentry (optional)
- [x] **Server monitoring** - render built-in ✅
- [x] **API performance** - render metrics ✅
- [ ] **Frontend monitoring** - Vercel Analytics
- [x] **Database backups** - MongoDB Atlas automatic ✅
- [x] **Maintenance plan** - Documented above ✅
- [x] **Rollback procedures** - Documented above ✅

---

## 🎯 Quick Setup Actions

**Minimum required (10 minutes):**

1. Set up UptimeRobot for uptime monitoring
2. Enable Vercel Analytics
3. Configure MongoDB Atlas alerts
4. Create dependabot.yml for auto-updates

**Recommended (30 minutes):**

5. Set up Sentry for error tracking
6. Configure performance alerts
7. Test rollback procedures
8. Document in README

---

## 📚 Additional Resources

- [UptimeRobot Docs](https://uptimerobot.com/help/)
- [Sentry Docs](https://docs.sentry.io/)
- [render Monitoring](https://docs.render.app/reference/monitoring)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [MongoDB Atlas Monitoring](https://www.mongodb.com/docs/atlas/monitoring/)

---

