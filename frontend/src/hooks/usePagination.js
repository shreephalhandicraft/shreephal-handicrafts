import { useState, useEffect, useCallback } from 'react';

/**
 * ✅ FIX PERF #1: Reusable pagination hook for admin dashboard
 * 
 * @param {Function} fetchFunction - Async function that fetches data with (from, to) parameters
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Items per page (default: 50)
 * @param {boolean} options.autoFetch - Auto-fetch on mount (default: true)
 * @param {Array} options.dependencies - useEffect dependencies for re-fetching
 * 
 * @returns {Object} Pagination state and controls
 * 
 * @example
 * const { data, loading, error, currentPage, totalPages, nextPage, prevPage, goToPage } = 
 *   usePagination(async (from, to) => {
 *     const { data, error, count } = await supabase
 *       .from('products')
 *       .select('*', { count: 'exact' })
 *       .range(from, to);
 *     return { data, error, count };
 *   }, { pageSize: 50 });
 */
export const usePagination = (fetchFunction, options = {}) => {
  const {
    pageSize = 50,
    autoFetch = true,
    dependencies = [],
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Calculate range for current page
  const getRange = useCallback((page) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [pageSize]);

  // Fetch data for current page
  const fetchData = useCallback(async (page = currentPage) => {
    setLoading(true);
    setError(null);

    try {
      const { from, to } = getRange(page);
      console.log(`📄 Fetching page ${page}: range [${from}, ${to}]`);

      const result = await fetchFunction(from, to);

      if (result.error) {
        throw result.error;
      }

      setData(result.data || []);
      
      // Update total count and pages if provided
      if (typeof result.count === 'number') {
        setTotalCount(result.count);
        setTotalPages(Math.ceil(result.count / pageSize));
      }

      console.log(`✅ Loaded ${result.data?.length || 0} items for page ${page}`);
    } catch (err) {
      console.error('❌ Pagination fetch error:', err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, fetchFunction, getRange, pageSize]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData(currentPage);
    }
  }, [currentPage, ...dependencies]); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigation functions
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const refresh = useCallback(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  return {
    // Data
    data,
    loading,
    error,
    
    // Pagination state
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    
    // Navigation
    nextPage,
    prevPage,
    goToPage,
    refresh,
    
    // Utilities
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages,
    
    // Range info (for display)
    startIndex: (currentPage - 1) * pageSize + 1,
    endIndex: Math.min(currentPage * pageSize, totalCount),
  };
};

export default usePagination;
