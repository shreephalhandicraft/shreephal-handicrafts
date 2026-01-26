# 🚀 VERCEL DEPLOYMENT CONFIGURATION GUIDE

## ⚠️ IMPORTANT: Monorepo Setup

This project has a **monorepo structure** where the frontend code is in the `frontend/` subdirectory. Vercel needs special configuration for this.

---

## 🛠️ VERCEL DASHBOARD SETTINGS

### **Step 1: Project Settings Overview**

Go to: **Vercel Dashboard** → **Your Project** → **Settings** → **General**

---

### **Step 2: Build & Development Settings**

Navigate to: **Settings** → **Build & Development Settings**

📌 **Configure these EXACT values:**

#### **Framework Preset**
```
Vite
```
✅ Vercel will auto-detect, but ensure it says "Vite" (not "Other")

---

#### **Root Directory**
```
frontend
```

⚠️ **CRITICAL:** 
- Click "Edit" → Enable **"Include source files outside of the Root Directory in the Build Step"**
- This allows Vercel to access the entire repo while building from `frontend/`

**Why?** Your code is in `frontend/` subdirectory, not the repo root.

---

#### **Build Command**
```
npm run build
```

✅ **Override:** Yes (toggle ON)

**Why?** Vite's default build command. Vercel runs this from the `frontend/` directory.

---

#### **Output Directory**
```
dist
```

✅ **Override:** Yes (toggle ON)

**Why?** Vite outputs built files to `frontend/dist/`. Since we set Root Directory to `frontend`, we only specify `dist`.

---

#### **Install Command**
```
npm install
```

🟢 **Override:** Optional (Vercel auto-detects correctly)

---

### **Step 3: Environment Variables (If Needed)**

Navigate to: **Settings** → **Environment Variables**

Add these if you have a `.env` file:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase URL | Production |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary name | Production |

⚠️ **Note:** Only add if your app uses these. Check `frontend/.env.example`.

---

### **Step 4: Redeploy**

After changing settings:

1. Go to **Deployments** tab
2. Click **⋮** (three dots) on the latest failed deployment
3. Click **"Redeploy"**

**OR**

Just push a new commit (already done with the vercel.json fix)

---

## 📝 WHAT'S IN `vercel.json` (Already Fixed)

The `vercel.json` file in the repo root handles **routing configuration only**:

```json
{
  "rewrites": [
    {
      "source": "/((?!sitemap\\.xml|robots\\.txt|...).*)$",
      "destination": "/index.html"
    }
  ],
  "headers": [...]
}
```

✅ **What it does:**
- **Rewrites:** Routes all SPA requests to `index.html` (except static files)
- **Headers:** Sets caching for assets, proper MIME types for SEO files

❌ **What it DOESN'T do:**
- Build configuration (use Vercel dashboard for that)
- Environment variables (use Vercel dashboard)
- Root directory (use Vercel dashboard)

---

## ✅ EXPECTED VERCEL BUILD OUTPUT

### **Successful Build Logs Should Show:**

```bash
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...

> build
> vite build

vite v5.0.4 building for production...
✓ 1234 modules transformed.
dist/index.html                   1.23 kB
dist/assets/index-abc123.css     45.67 kB
dist/assets/index-def456.js     234.89 kB
✓ built in 12.34s

Build Completed in /vercel/output [23s]
Deployed to production. https://shreephalhandicrafts.vercel.app
```

---

## 🐛 TROUBLESHOOTING DEPLOYMENT ERRORS

### **Error: "No Output Directory named 'dist' found"**

**Cause:** Root Directory is set to repo root instead of `frontend`

**Fix:**
1. Settings → Build & Development Settings
2. Root Directory = `frontend` (not empty)
3. Redeploy

---

### **Error: "Command failed: npm run build"**

**Cause:** Node version mismatch or missing dependencies

**Fix:**
1. Check `frontend/package.json` has `"engines": { "node": ">=20" }`
2. Vercel uses Node 20 by default (should work)
3. Check build logs for specific error (usually missing package)

---

### **Error: "ENOENT: no such file or directory, open 'index.html'"**

**Cause:** Output Directory is wrong

**Fix:**
1. Settings → Output Directory = `dist` (not `frontend/dist`)
2. Since Root Directory = `frontend`, paths are relative to that
3. Redeploy

---

### **Error: "All checks have failed" (like in your screenshot)**

**Cause:** Build command or paths misconfigured

**Fix (Already Applied):**
1. ✅ Removed `buildCommand`, `outputDirectory`, `installCommand` from `vercel.json`
2. ✅ These should ONLY be in Vercel dashboard for monorepos
3. Latest commit [7d19e45](https://github.com/shreephalhandicraft/shreephal-handicrafts/commit/7d19e450ab5b2ede0e833d6623a999d874a5664b) fixes this
4. Vercel will auto-deploy, or click "Redeploy" in dashboard

---

## 📊 VERIFICATION AFTER DEPLOYMENT

### **1. Check Deployment Status**

Vercel dashboard should show:
- ✅ **Status:** Ready
- ✅ **Duration:** ~20-40 seconds
- ✅ **Domains:** Your production URL

---

### **2. Test These URLs**

Once deployed, test in browser:

```bash
✅ https://shreephalhandicrafts.com/
✅ https://shreephalhandicrafts.com/sitemap.xml
✅ https://shreephalhandicrafts.com/robots.txt
✅ https://shreephalhandicrafts.com/shop
✅ https://shreephalhandicrafts.com/category/trophies/products
✅ https://shreephalhandicrafts.com/trophy-shop-jabalpur
```

**Expected:**
- All pages load (no 404)
- sitemap.xml shows XML content (not HTML)
- robots.txt shows plain text (not HTML)
- Static assets load (images, CSS, JS)

---

### **3. Check Build Logs**

In Vercel dashboard:
1. Go to **Deployments**
2. Click on the successful deployment
3. View **Build Logs**
4. Confirm "Build Completed" appears

---

## 📝 QUICK REFERENCE

### **Vercel Dashboard Settings (Summary)**

| Setting | Value | Override? |
|---------|-------|----------|
| Framework Preset | `Vite` | Auto-detected |
| Root Directory | `frontend` | ✅ Yes |
| Build Command | `npm run build` | ✅ Yes |
| Output Directory | `dist` | ✅ Yes |
| Install Command | `npm install` | Optional |
| Node.js Version | `20.x` (default) | No |

---

### **File Structure (For Reference)**

```
shreephal-handicrafts/
├── frontend/                 ← Root Directory in Vercel
│   ├── src/
│   ├── public/
│   │   ├── sitemap.xml        ← SEO file
│   │   ├── robots.txt         ← SEO file
│   │   └── favicon.ico
│   ├── dist/                  ← Output Directory (generated)
│   │   ├── index.html
│   │   ├── assets/
│   │   ├── sitemap.xml        ← Copied from public/
│   │   └── robots.txt         ← Copied from public/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── vercel.json              ← Routing config (repo root)
├── SEO_FIXES_JAN_2026.md
└── VERCEL_DEPLOYMENT_GUIDE.md  ← This file
```

---

## ✅ FINAL CHECKLIST

Before deployment:

- [x] `vercel.json` exists in repo root
- [x] `vercel.json` has SPA rewrites (excluding static files)
- [x] `frontend/public/sitemap.xml` exists
- [x] `frontend/public/robots.txt` exists
- [x] Vercel dashboard: Root Directory = `frontend`
- [x] Vercel dashboard: Output Directory = `dist`
- [x] Vercel dashboard: Build Command = `npm run build`
- [ ] Environment variables added (if needed)
- [ ] Custom domain configured (if applicable)

---

## 🚀 READY TO DEPLOY!

The latest commit [7d19e45](https://github.com/shreephalhandicraft/shreephal-handicrafts/commit/7d19e450ab5b2ede0e833d6623a999d874a5664b) has fixed the `vercel.json` configuration.

**Vercel will automatically redeploy, or you can manually trigger it.**

**Expected result:** ✅ Build succeeds, site deploys, all URLs work perfectly.

---

**Last Updated:** January 26, 2026  
**Status:** Ready for Production Deployment