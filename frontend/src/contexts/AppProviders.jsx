import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { FavouritesProvider } from './FavouritesContext';
import PasswordRecoveryGuard from './PasswordRecoveryGuard';

/**
 * ✅ FIX ARCH #1: Unified App Providers
 * ✅ FIX BUG #8: Added PasswordRecoveryGuard to prevent auto-login on password reset
 * 
 * Combines all context providers into a single component to:
 * 1. Reduce nesting complexity
 * 2. Improve debugging (single point of failure)
 * 3. Centralize provider configuration
 * 4. Better performance (optimized render tree)
 * 5. Enforce password reset before app access
 * 
 * Usage:
 * ```jsx
 * import { AppProviders } from '@/contexts/AppProviders';
 * 
 * function App() {
 *   return (
 *     <AppProviders>
 *       <YourApp />
 *     </AppProviders>
 *   );
 * }
 * ```
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
          {/* ✅ FIX BUG #8: Add PasswordRecoveryGuard */}
          <PasswordRecoveryGuard>
            <CartProvider>
              <FavouritesProvider>
                {children}
              </FavouritesProvider>
            </CartProvider>
          </PasswordRecoveryGuard>
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
