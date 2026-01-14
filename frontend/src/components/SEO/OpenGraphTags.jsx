/**
 * Open Graph Tags for Social Media Sharing
 * Enhances how your pages look when shared on Facebook, LinkedIn, etc.
 */

import { Helmet } from 'react-helmet-async';

export const OpenGraphTags = ({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName = 'Shreephal Handicrafts',
  locale = 'en_IN',
}) => {
  // Construct full URLs
  const baseUrl = 'https://shreephalhandicrafts.com';
  const fullUrl = url?.startsWith('http') ? url : `${baseUrl}${url || ''}`;
  const fullImage = image?.startsWith('http') ? image : `${baseUrl}${image || '/shrifal.svg'}`;

  return (
    <Helmet>
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:image:alt" content={title} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  );
};
