/**
 * Local Business Schema
 * Helps with local SEO and Google My Business integration
 */

import { Helmet } from 'react-helmet-async';

export const LocalBusinessSchema = () => {
  const businessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': 'https://shreephalhandicrafts.com/#business',
    name: 'Shreephal Handicrafts',
    alternateName: 'Shrifal Handicrafts',
    description: 'Premium handcrafted trophies, awards, and custom gifts in Narnaund, Haryana. Celebrating achievements with unique, personalized products.',
    url: 'https://shreephalhandicrafts.com',
    logo: 'https://shreephalhandicrafts.com/shrifal.svg',
    image: 'https://shreephalhandicrafts.com/banner-hero.jpg',
    telephone: '+91-XXXXXXXXXX', // Add your phone number
    email: 'info@shreephalhandicrafts.com', // Add your email
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Narnaund',
      addressLocality: 'Narnaund',
      addressRegion: 'Haryana',
      postalCode: 'XXXXXX', // Add postal code
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 29.2167, // Approximate - update with exact coordinates
      longitude: 76.1167,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '09:00',
        closes: '14:00',
      },
    ],
    priceRange: '₹₹',
    paymentAccepted: 'Cash, Credit Card, Debit Card, UPI',
    currenciesAccepted: 'INR',
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: 29.2167,
        longitude: 76.1167,
      },
      geoRadius: '50000', // 50km radius
    },
    sameAs: [
      // Add your social media profiles
      'https://www.facebook.com/shreephalhandicrafts',
      'https://www.instagram.com/shreephalhandicrafts',
      'https://twitter.com/shreephalcraft',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(businessSchema)}
      </script>
    </Helmet>
  );
};
