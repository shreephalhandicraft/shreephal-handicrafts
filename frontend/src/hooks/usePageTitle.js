import { useEffect } from 'react';

/**
 * ✅ FIX SEO #1: Custom hook to set page title
 * 
 * @param {string} title - The page-specific title
 * @param {boolean} appendSiteName - Whether to append site name (default: true)
 * 
 * @example
 * usePageTitle('Products'); // Sets "Products | Shreephal Handicrafts"
 * usePageTitle('Checkout', false); // Sets just "Checkout"
 */
export const usePageTitle = (title, appendSiteName = true) => {
  useEffect(() => {
    const previousTitle = document.title;
    
    const newTitle = appendSiteName 
      ? `${title} | Shreephal Handicrafts`
      : title;
    
    document.title = newTitle;
    
    // Restore previous title on unmount
    return () => {
      document.title = previousTitle;
    };
  }, [title, appendSiteName]);
};

export default usePageTitle;
