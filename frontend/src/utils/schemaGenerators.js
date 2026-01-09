/**
 * Schema Generators
 * 
 * Helper functions to generate Schema.org structured data
 * for different content types.
 */

import { SITE_URL } from '@/config/seoConfig';

/**
 * Generate Product Schema
 * @param {Object} product - Product data
 * @param {string} categorySlug - Category slug for URL
 */
export const generateProductSchema = (product, categorySlug) => {
  const productUrl = `${SITE_URL}/category/${categorySlug}/products/${product.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} from Shreephal Handicrafts`,
    image: product.images || [],
    sku: product.id?.toString(),
    brand: {
      '@type': 'Brand',
      name: 'Shreephal Handicrafts'
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: product.price?.toString(),
      availability: product.in_stock 
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Shreephal Handicrafts'
      }
    }
  };
};

/**
 * Generate Breadcrumb Schema
 * @param {Array} breadcrumbs - Array of {name, url} objects
 */
export const generateBreadcrumbSchema = (breadcrumbs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
};

/**
 * Generate LocalBusiness Schema
 * @param {Object} businessInfo - Business contact information
 */
export const generateLocalBusinessSchema = (businessInfo = {}) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL,
    name: 'Shreephal Handicrafts',
    image: `${SITE_URL}/shrifal.svg`,
    url: SITE_URL,
    telephone: businessInfo.phone || '',
    email: businessInfo.email || '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: businessInfo.street || '',
      addressLocality: businessInfo.city || 'Narnaund',
      addressRegion: businessInfo.state || 'Haryana',
      postalCode: businessInfo.postalCode || '',
      addressCountry: 'IN'
    },
    geo: businessInfo.geo ? {
      '@type': 'GeoCoordinates',
      latitude: businessInfo.geo.latitude,
      longitude: businessInfo.geo.longitude
    } : undefined,
    openingHoursSpecification: businessInfo.hours || [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '09:00',
        closes: '18:00'
      }
    ],
    priceRange: '₹₹'
  };
};

/**
 * Generate FAQ Schema
 * @param {Array} faqs - Array of {question, answer} objects
 */
export const generateFAQSchema = (faqs) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

/**
 * Generate ItemList Schema (for category/collection pages)
 * @param {Array} items - Array of products
 * @param {string} listName - Name of the list
 */
export const generateItemListSchema = (items, listName) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url,
      name: item.name
    }))
  };
};
