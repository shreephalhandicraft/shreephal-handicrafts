import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';
import { DEFAULT_SEO, buildUrl, getCanonicalUrl } from '@/config/seoConfig';

/**
 * SEOHead Component
 * 
 * Manages all meta tags, Open Graph, Twitter Cards, and canonical URLs
 * for individual pages. Integrates with React Helmet Async.
 * 
 * @param {Object} props
 * @param {string} props.title - Page title (will be templated with site name)
 * @param {string} props.description - Page description
 * @param {string} props.keywords - Comma-separated keywords
 * @param {string} props.path - Current page path for canonical URL
 * @param {string} props.image - OG image URL (optional, defaults to site OG image)
 * @param {string} props.type - OG type (default: 'website')
 * @param {boolean} props.noindex - If true, adds noindex meta tag
 */
export const SEOHead = ({
  title,
  description = DEFAULT_SEO.description,
  keywords,
  path = '/',
  image,
  type = 'website',
  noindex = false
}) => {
  // Build full title with site name
  const fullTitle = title 
    ? DEFAULT_SEO.titleTemplate.replace('%s', title)
    : DEFAULT_SEO.siteName;

  // Use provided image or default
  const ogImage = image 
    ? (image.startsWith('http') ? image : buildUrl(image))
    : buildUrl(DEFAULT_SEO.ogImage);

  // Build canonical URL
  const canonical = getCanonicalUrl(path);

  // Combine default keywords with page-specific ones
  const allKeywords = keywords
    ? `${keywords}, ${DEFAULT_SEO.keywords.join(', ')}`
    : DEFAULT_SEO.keywords.join(', ');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={DEFAULT_SEO.language} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <meta name="author" content={DEFAULT_SEO.author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={DEFAULT_SEO.siteName} />
      <meta property="og:locale" content={DEFAULT_SEO.locale} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={DEFAULT_SEO.twitter.cardType} />
      <meta name="twitter:site" content={DEFAULT_SEO.twitter.site} />
      <meta name="twitter:creator" content={DEFAULT_SEO.twitter.handle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional Meta Tags */}
      <meta name="theme-color" content={DEFAULT_SEO.themeColor} />
    </Helmet>
  );
};

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  path: PropTypes.string,
  image: PropTypes.string,
  type: PropTypes.string,
  noindex: PropTypes.bool
};
