/**
 * Breadcrumbs Component
 * 
 * Displays visual breadcrumb navigation with:
 * - Auto-generated from route
 * - Click to navigate
 * - SEO-friendly markup
 * - Mobile responsive
 * 
 * Usage:
 * <Breadcrumbs items={[
 *   { name: 'Home', url: '/' },
 *   { name: 'Shop', url: '/shop' },
 *   { name: 'Product', url: '/shop/product-1' }
 * ]} />
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import PropTypes from 'prop-types';

const Breadcrumbs = ({ items, className = '' }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isHome = index === 0;

        return (
          <div key={index} className="flex items-center space-x-2">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
            )}

            {isLast ? (
              <span
                className="font-medium text-gray-900 truncate"
                aria-current="page"
              >
                {isHome && <Home className="h-4 w-4 inline mr-1" />}
                {item.name}
              </span>
            ) : (
              <Link
                to={item.url}
                className="hover:text-primary transition-colors truncate flex items-center"
              >
                {isHome && <Home className="h-4 w-4 inline mr-1" />}
                {item.name}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
    })
  ).isRequired,
  className: PropTypes.string,
};

export default Breadcrumbs;
