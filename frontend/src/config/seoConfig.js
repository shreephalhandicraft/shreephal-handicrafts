/**
 * SEO Configuration for Shreephal Handicrafts
 * 
 * This file contains all SEO metadata for the website.
 * Update SITE_URL when migrating to production domain.
 */

// IMPORTANT: Update this when switching domains
export const SITE_URL = 
  import.meta.env.VITE_SITE_URL || 
  'https://shreefalhandicarfts.netlify.app';

export const FUTURE_DOMAIN = 'https://shreephal-handicrafts.com';

// Site-wide defaults
export const DEFAULT_SEO = {
  siteName: 'Shreephal Handicrafts',
  titleTemplate: '%s | Shreephal Handicrafts',
  description: 'Leading manufacturer of custom trophies, awards, and handicrafts in India. Premium quality, customizable designs, and reliable delivery for schools, corporates, and events.',
  keywords: [
    'custom trophies India',
    'trophy manufacturers',
    'awards and trophies',
    'handicrafts India',
    'corporate awards',
    'sports trophies',
    'customized trophies',
    'trophy shop near me'
  ],
  author: 'Shreephal Handicrafts',
  language: 'en',
  locale: 'en_IN',
  twitter: {
    handle: '@shreephalcraft',
    site: '@shreephalcraft',
    cardType: 'summary_large_image'
  },
  ogImage: '/images/og-default.jpg', // 1200x630px
  logo: '/shrifal.svg',
  themeColor: '#10b981' // Adjust to your brand color
};

// Organization structured data
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Shreephal Handicrafts',
  alternateName: 'ShreeFal Handicrafts',
  url: SITE_URL,
  logo: `${SITE_URL}/shrifal.svg`,
  description: DEFAULT_SEO.description,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'IN',
    addressRegion: 'Haryana',
    addressLocality: 'Narnaund'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    availableLanguage: ['English', 'Hindi']
  },
  sameAs: [
    // Add your social media profiles here
    // 'https://www.facebook.com/shreephal',
    // 'https://www.instagram.com/shreephal',
  ]
};

// Website structured data
export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: DEFAULT_SEO.siteName,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?q={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
};

// Page-specific SEO metadata
export const PAGE_SEO = {
  home: {
    title: 'Custom Trophies & Awards Manufacturer in India',
    description: 'Premier manufacturer of custom trophies, awards, and handicrafts. Serving schools, corporates, and sports events across India with premium quality products and fast delivery.',
    keywords: 'custom trophies, trophy manufacturers India, awards, handicrafts, corporate trophies',
    path: '/'
  },
  
  shop: {
    title: 'Shop Trophies & Awards Online',
    description: 'Browse our extensive collection of trophies, awards, medals, and handicrafts. Customizable designs for all occasions - sports, corporate, academic, and special events.',
    keywords: 'buy trophies online, custom awards, medals, sports trophies, corporate awards',
    path: '/shop'
  },
  
  about: {
    title: 'About Us - Leading Trophy Manufacturers Since Years',
    description: 'Learn about Shreephal Handicrafts - your trusted partner for premium trophies and awards. Our commitment to quality, craftsmanship, and customer satisfaction.',
    keywords: 'about shreephal, trophy manufacturer, company profile, handicrafts',
    path: '/about'
  },
  
  contact: {
    title: 'Contact Us - Get Custom Trophy Quote',
    description: 'Contact Shreephal Handicrafts for custom trophy orders, bulk inquiries, or general questions. Fast response and personalized service guaranteed.',
    keywords: 'contact trophy manufacturer, custom trophy quote, bulk trophy order',
    path: '/contact'
  },
  
  cart: {
    title: 'Shopping Cart',
    description: 'Review your selected trophies and awards before checkout. Secure payment and fast shipping available.',
    keywords: 'shopping cart, checkout, buy trophies',
    path: '/cart',
    noindex: false // Set to true if you want to noindex cart pages
  },
  
  privacyPolicy: {
    title: 'Privacy Policy',
    description: 'Privacy Policy for Shreephal Handicrafts. Learn how we protect your personal information and data.',
    keywords: 'privacy policy',
    path: '/privacy-policy'
  },
  
  termsConditions: {
    title: 'Terms & Conditions',
    description: 'Terms and Conditions for using Shreephal Handicrafts website and services.',
    keywords: 'terms and conditions, terms of service',
    path: '/terms-conditions'
  },
  
  refundPolicy: {
    title: 'Refund & Return Policy',
    description: 'Our refund and return policy for trophy and award purchases. Customer satisfaction guaranteed.',
    keywords: 'refund policy, return policy, money back guarantee',
    path: '/refund-policy'
  }
};

// Category-specific SEO (for dynamic category pages)
export const getCategorySEO = (categoryName, categorySlug) => ({
  title: `${categoryName} - Custom ${categoryName} Online`,
  description: `Shop premium ${categoryName.toLowerCase()} from Shreephal Handicrafts. Customizable designs, competitive prices, and reliable delivery across India.`,
  keywords: `${categoryName.toLowerCase()}, custom ${categoryName.toLowerCase()}, buy ${categoryName.toLowerCase()} online`,
  path: `/category/${categorySlug}/products`
});

// Product-specific SEO (for dynamic product pages)
export const getProductSEO = (product, categorySlug) => ({
  title: product.name,
  description: product.description || `${product.name} - Premium quality trophy from Shreephal Handicrafts. Customizable and available for bulk orders.`,
  keywords: `${product.name}, custom trophy, award, ${product.category}`,
  path: `/category/${categorySlug}/products/${product.id}`,
  image: product.images?.[0] || DEFAULT_SEO.ogImage
});

// Helper function to build full URL
export const buildUrl = (path) => {
  return `${SITE_URL}${path}`;
};

// Helper function to get canonical URL (for domain migration)
export const getCanonicalUrl = (path) => {
  // During migration, you can switch this to FUTURE_DOMAIN
  return buildUrl(path);
};
