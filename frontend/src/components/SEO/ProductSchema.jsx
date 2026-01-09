/**
 * Enhanced Product Schema with Reviews & Offers
 * Enables rich snippets in Google search (stars, price, availability)
 */

import { Helmet } from 'react-helmet-async';

export const ProductSchema = ({
  name,
  description,
  image,
  price,
  currency = 'INR',
  availability = 'InStock',
  rating,
  reviewCount,
  brand = 'Shreephal Handicrafts',
  sku,
  category,
}) => {
  const baseUrl = 'https://shreephalhandicrafts.com';
  const fullImage = image?.startsWith('http') ? image : `${baseUrl}${image}`;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    image: fullImage,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    sku: sku || `SHRI-${Date.now()}`,
    category: category,
    offers: {
      '@type': 'Offer',
      url: typeof window !== 'undefined' ? window.location.href : baseUrl,
      priceCurrency: currency,
      price: price,
      availability: `https://schema.org/${availability}`,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  };

  // Add review ratings if available
  if (rating && reviewCount) {
    productSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
    </Helmet>
  );
};
