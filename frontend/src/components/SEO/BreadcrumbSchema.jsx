/**
 * Breadcrumb Schema for SEO
 * Shows breadcrumb navigation in Google search results
 */

import { Helmet } from 'react-helmet-async';

export const BreadcrumbSchema = ({ items }) => {
  const baseUrl = 'https://shreephalhandicrafts.com';

  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url?.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbList)}
      </script>
    </Helmet>
  );
};

/**
 * Usage Example:
 * 
 * <BreadcrumbSchema 
 *   items={[
 *     { name: 'Home', url: '/' },
 *     { name: 'Trophies', url: '/category/trophies' },
 *     { name: 'Golden Trophy', url: '/category/trophies/products/golden-trophy' }
 *   ]}
 * />
 */
