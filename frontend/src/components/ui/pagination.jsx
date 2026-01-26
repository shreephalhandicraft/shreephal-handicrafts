import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * ✅ Pagination UI component
 * Works with usePagination hook
 */
export const Pagination = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalCount,
  hasNextPage,
  hasPrevPage,
  nextPage,
  prevPage,
  goToPage,
  className = '',
}) => {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5; // Show max 5 page buttons
    
    if (totalPages <= maxButtons) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show ellipsis for large page counts
      if (currentPage <= 3) {
        // Near start: [1] [2] [3] [4] ... [last]
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: [1] ... [last-3] [last-2] [last-1] [last]
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Middle: [1] ... [current-1] [current] [current+1] ... [last]
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    // Don't show pagination for single page
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Item range info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-medium text-gray-900">{startIndex}</span> to{' '}
        <span className="font-medium text-gray-900">{endIndex}</span> of{' '}
        <span className="font-medium text-gray-900">{totalCount}</span> results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* First page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(1)}
          disabled={!hasPrevPage}
          className="hidden sm:flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={!hasPrevPage}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === '...' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                …
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* Mobile: Current page indicator */}
        <div className="flex sm:hidden text-sm font-medium text-gray-700 px-3">
          {currentPage} / {totalPages}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={!hasNextPage}
        >
          <span className="mr-1">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(totalPages)}
          disabled={!hasNextPage}
          className="hidden sm:flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
