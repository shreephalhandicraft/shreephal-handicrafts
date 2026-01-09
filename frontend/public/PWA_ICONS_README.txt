🚨 IMPORTANT: PWA ICONS PLACEHOLDER 🚨

The current PWA icons (pwa-*.png, apple-touch-icon.png) are TEMPORARY PLACEHOLDERS.

TO REPLACE WITH YOUR ACTUAL LOGO:

1. Follow the guide: PWA_ICONS_GUIDE.md in the root directory

2. Quick method:
   - Create your logo (1024x1024 PNG)
   - Use: https://www.pwabuilder.com/imageGenerator
   - Download all icons
   - Replace files in this directory

3. Or use command line:
   npx pwa-asset-generator your-logo.png ./public --icon-only

REQUIRED FILES:
- pwa-192x192.png (192x192)
- pwa-512x512.png (512x512)
- pwa-maskable-192x192.png (192x192 with padding)
- pwa-maskable-512x512.png (512x512 with padding)
- apple-touch-icon.png (180x180)
- favicon.ico (32x32)

After replacing, rebuild:
  npm run build
  npm run preview

Then test in Chrome DevTools > Application > Manifest