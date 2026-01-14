/**
 * Sitemap Generator for Shreephal Handicrafts
 * 
 * Generates sitemap.xml during build process.
 * Run with: node scripts/generate-sitemap.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = process.env.VITE_SITE_URL || 'https://shreefalhandicarfts.netlify.app';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  {
    path: '/',
    priority: 1.0,
    changefreq: 'daily',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/shop',
    priority: 0.9,
    changefreq: 'daily',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/about',
    priority: 0.8,
    changefreq: 'monthly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/contact',
    priority: 0.8,
    changefreq: 'monthly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/terms-conditions',
    priority: 0.5,
    changefreq: 'yearly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/privacy-policy',
    priority: 0.5,
    changefreq: 'yearly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/refund-policy',
    priority: 0.5,
    changefreq: 'yearly',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    path: '/cart',
    priority: 0.3,
    changefreq: 'never',
    lastmod: new Date().toISOString().split('T')[0]
  }
];

/**
 * Generate XML URL entry
 */
function generateUrlEntry(url) {
  return `  <url>
    <loc>${SITE_URL}${url.path}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
}

/**
 * Generate complete sitemap XML
 */
function generateSitemap() {
  console.log('🗺️  Generating sitemap.xml...');

  const urls = STATIC_PAGES.map(generateUrlEntry).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  return sitemap;
}

/**
 * Write sitemap to file
 */
function writeSitemap() {
  try {
    const sitemap = generateSitemap();
    fs.writeFileSync(OUTPUT_PATH, sitemap, 'utf8');
    console.log(`✅ Sitemap generated successfully at: ${OUTPUT_PATH}`);
    console.log(`📍 Sitemap URL: ${SITE_URL}/sitemap.xml`);
    console.log(`📊 Total URLs: ${STATIC_PAGES.length}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Execute
writeSitemap();

/**
 * TODO: Future Enhancements
 * 
 * 1. Fetch dynamic product/category URLs from Supabase
 * 2. Add image sitemap entries for product images
 * 3. Split into multiple sitemaps if > 50,000 URLs
 * 4. Add sitemap index file
 * 5. Generate lastmod from actual data update timestamps
 * 
 * Example dynamic URL fetching:
 * 
 * async function fetchDynamicUrls() {
 *   const { data: products } = await supabase.from('products').select('id, slug');
 *   const { data: categories } = await supabase.from('categories').select('slug');
 *   
 *   return [
 *     ...categories.map(cat => ({
 *       path: `/category/${cat.slug}/products`,
 *       priority: 0.9,
 *       changefreq: 'weekly'
 *     })),
 *     ...products.map(prod => ({
 *       path: `/category/${prod.category_slug}/products/${prod.id}`,
 *       priority: 0.8,
 *       changefreq: 'weekly'
 *     }))
 *   ];
 * }
 */
