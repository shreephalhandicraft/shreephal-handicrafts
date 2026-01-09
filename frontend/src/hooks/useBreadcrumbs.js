/**
 * useBreadcrumbs Hook
 * 
 * Automatically generates breadcrumbs from current route
 * 
 * Usage:
 * const breadcrumbs = useBreadcrumbs();
 * <Breadcrumbs items={breadcrumbs} />
 */

import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';

// Map of paths to readable names
const pathNameMap = {
  '': 'Home',
  'shop': 'Shop',
  'about': 'About Us',
  'contact': 'Contact Us',
  'cart': 'Shopping Cart',
  'checkout': 'Checkout',
  'my-orders': 'My Orders',
  'favourites': 'Favourites',
  'personal-details': 'Personal Details',
  'category': 'Categories',
  'products': 'Products',
  'admin': 'Admin',
  'privacy-policy': 'Privacy Policy',
  'terms-conditions': 'Terms & Conditions',
  'refund-policy': 'Refund Policy',
};

// Capitalize and format slug
const formatSlug = (slug) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const useBreadcrumbs = () => {
  const location = useLocation();

  return useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    
    // Always start with home
    const breadcrumbs = [
      { name: 'Home', url: '/' }
    ];

    // Build breadcrumbs from path segments
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Get readable name
      let name = pathNameMap[segment] || formatSlug(segment);
      
      // Special handling for numeric IDs (product IDs, order IDs)
      if (/^\d+$/.test(segment)) {
        // Skip adding numeric segments to breadcrumbs
        // They'll be replaced by actual product/order names in the page component
        return;
      }
      
      breadcrumbs.push({
        name,
        url: currentPath
      });
    });

    return breadcrumbs;
  }, [location.pathname]);
};

export default useBreadcrumbs;
