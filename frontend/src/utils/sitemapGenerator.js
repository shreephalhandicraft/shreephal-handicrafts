/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml from database content
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Generate sitemap XML from database
 * Call this function to create/update sitemap.xml
 */
export const generateSitemap = async () => {
  const baseUrl = 'https://shreephalhandicrafts.com';
  const today = new Date().toISOString().split('T')[0];

  // Fetch all categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .order('name');

  // Fetch all products
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, slug, category_slug, updated_at')
    .order('created_at', { ascending: false });

  if (catError || prodError) {
    console.error('Error fetching data for sitemap:', catError || prodError);
    return null;
  }

  // Start building XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n\n`;

  // Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n\n`;

  // Shop page
  xml += `  <url>\n`;
  xml += `    <loc>${baseUrl}/shop</loc>\n`;
  xml += `    <lastmod>${today}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n\n`;

  // Static pages
  const staticPages = [
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms-conditions', priority: '0.3', changefreq: 'yearly' },
    { path: '/refund-policy', priority: '0.3', changefreq: 'yearly' },
  ];

  staticPages.forEach(page => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n\n`;
  });

  // Category pages
  if (categories && categories.length > 0) {
    categories.forEach(category => {
      const lastmod = category.updated_at 
        ? new Date(category.updated_at).toISOString().split('T')[0]
        : today;

      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/category/${category.slug}/products</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n\n`;
    });
  }

  // Product pages
  if (products && products.length > 0) {
    products.forEach(product => {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split('T')[0]
        : today;

      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/category/${product.category_slug}/products/${product.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += `  </url>\n\n`;
    });
  }

  xml += `</urlset>`;

  return xml;
};

/**
 * Download sitemap as file
 * Useful for manual updates
 */
export const downloadSitemap = async () => {
  const xml = await generateSitemap();
  if (!xml) return;

  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sitemap.xml';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
