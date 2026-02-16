import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { FavouritesProvider } from './FavouritesContext';

/**
 * Unified App Providers - simplified without blocking guards
 */

// Configure React Query client once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});

export const AppProviders = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <FavouritesProvider>
              {children}
            </FavouritesProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

/**
 * Export the query client for testing or advanced use cases
 */
export { queryClient };

export default AppProviders;
