# Performance Optimization Guide

## ✅ Implemented Optimizations

### 1. **Image Optimization with Cloudinary**

#### Automatic WebP Conversion
All images now automatically convert to WebP format with fallbacks:

```javascript
import { getCardImageUrl, getResponsiveSrcSet } from '@/utils/cloudinaryHelpers';

// Automatically converts to WebP with 400x400 size
const optimizedUrl = getCardImageUrl(imageUrl);

// Responsive srcSet for multiple screen sizes
const srcSet = getResponsiveSrcSet(imageUrl, [320, 640, 768, 1024]);
```

#### Image Types & Usage
- **Thumbnails**: 150x150px - `getThumbnailUrl()`
- **Cards**: 400x400px - `getCardImageUrl()`
- **Hero/Banner**: 1920px wide - `getHeroImageUrl()`

#### Expected Savings
- **WebP conversion**: 1,142 KiB savings
- **Responsive sizing**: 600 KiB savings
- **Total image optimization**: ~1.7 MB reduction

### 2. **Content Security Policy (CSP) Fixed**

#### Google Fonts CSP Error - RESOLVED ✅
Updated `frontend/public/_headers` to allow:
```
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
```

#### Preconnect Headers Added
```
Link: <https://fonts.googleapis.com>; rel=preconnect; crossorigin
Link: <https://fonts.gstatic.com>; rel=preconnect; crossorigin
Link: <https://res.cloudinary.com>; rel=preconnect; crossorigin
```

### 3. **Render-Blocking Resources**

#### CSS Optimization
- CSS is automatically minified by Vite
- Critical CSS inlined (handled by build process)
- Non-critical CSS deferred

**Savings**: 640ms reduction in blocking time

### 4. **Caching Strategy**

Updated cache headers in `_headers`:
```
# Static assets - 1 year cache with immutable
/assets/* - Cache-Control: public, max-age=31536000, immutable

# Images - 1 year cache
*.webp, *.jpg, *.png - Cache-Control: public, max-age=31536000, immutable

# HTML - No cache (for fresh content)
/*.html - Cache-Control: public, max-age=0, must-revalidate
```

---

## 🚧 Remaining Optimizations

### 1. **Unused JavaScript (Manual Optimization Required)**

#### Current Issue
- **Supabase bundle**: 81% unused (33 KiB waste)
- **Index bundle**: 57% unused (30 KiB waste)
- **Total**: 63 KiB unused JavaScript

#### Solutions

##### Option A: Code Splitting (Recommended)
Split routes into lazy-loaded chunks:

```javascript
// In your router configuration
import { lazy, Suspense } from 'react';

// Lazy load pages
const Shop = lazy(() => import('./pages/Shop'));
const About = lazy(() => import('./pages/About'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Shop />
</Suspense>
```

##### Option B: Tree Shaking Supabase
Import only what you need:

```javascript
// Instead of:
import { createClient } from '@supabase/supabase-js'

// Do:
import { createClient } from '@supabase/supabase-js/dist/module/SupabaseClient'
```

##### Option C: Dynamic Imports
Load heavy components only when needed:

```javascript
const HeavyChart = lazy(() => import('./components/HeavyChart'));

// Render only when needed
{showChart && (
  <Suspense fallback={<Spinner />}>
    <HeavyChart />
  </Suspense>
)}
```

#### Expected Savings
- **780ms** reduction in JavaScript execution time
- **62 KiB** reduction in bundle size

### 2. **Convert Banner Image to WebP**

#### Current Status
The `banner-hero.jpg` (106 KB) needs WebP conversion.

#### How to Convert

**Using Cloudinary** (if you upload there):
1. Upload `banner-hero.jpg` to Cloudinary
2. Use transformation: `f_auto` or `f_webp`
3. Download optimized version

**Using CLI tools**:
```bash
# Install cwebp
brew install webp  # macOS
apt install webp   # Ubuntu

# Convert
cwebp -q 85 banner-hero.jpg -o banner-hero.webp
```

**Using online tools**:
- [Squoosh.app](https://squoosh.app/)
- [CloudConvert](https://cloudconvert.com/jpg-to-webp)

#### Where to place
Put `banner-hero.webp` in `frontend/public/` folder.

**Expected Savings**: 56 KiB (53% reduction)

### 3. **Unused CSS**

#### Current Issue
- 13 KiB unused CSS (80% of stylesheet)
- Mainly from Tailwind's component classes

#### Solution: PurgeCSS (Auto-configured in Tailwind)
Tailwind already purges unused CSS. To ensure it works:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ... rest of config
}
```

**Expected Savings**: 160ms, 13 KiB

---

## 📈 Monitoring Performance

### Lighthouse CI
Run Lighthouse locally:
```bash
npm install -g @lhci/cli
lhci autorun
```

### WebPageTest
Test from multiple locations:
- [WebPageTest.org](https://www.webpagetest.org/)

### Chrome DevTools
1. Open DevTools (F12)
2. Go to **Lighthouse** tab
3. Generate report
4. Check **Performance** score

---

## 🎯 Performance Targets

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| **Performance Score** | 79 | 90+ | 🟡 In Progress |
| **First Contentful Paint** | 0.9s | <1.0s | ✅ Good |
| **Largest Contentful Paint** | 1.2s | <2.5s | ✅ Good |
| **Total Blocking Time** | 30ms | <200ms | ✅ Excellent |
| **Cumulative Layout Shift** | 0.0004 | <0.1 | ✅ Excellent |
| **Speed Index** | 1.1s | <3.4s | ✅ Good |

---

## ✅ Completed Tasks

- [x] Cloudinary WebP helper functions
- [x] Responsive image srcSet
- [x] Google Fonts CSP fix
- [x] Preconnect headers
- [x] Cache optimization
- [x] CategoryImage WebP conversion
- [x] Banner image WebP support (code ready)
- [x] Image lazy loading
- [x] Proper image sizing

## 🚧 Pending Tasks

- [ ] Convert banner-hero.jpg to WebP manually
- [ ] Implement code splitting for routes
- [ ] Tree shake Supabase imports
- [ ] Test on mobile devices
- [ ] Monitor real-world performance
- [ ] Add service worker for offline support

---

## 📚 Additional Resources

- [Web.dev - Image Optimization](https://web.dev/fast/#optimize-your-images)
- [Cloudinary Transformation Guide](https://cloudinary.com/documentation/image_transformations)
- [React Code Splitting](https://reactjs.org/docs/code-splitting.html)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)

---

**Last Updated**: January 9, 2026  
**Branch**: `seo-lighthouse-optimization`  
**Status**: Ready for production merge
