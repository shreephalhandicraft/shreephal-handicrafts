import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * ✅ FIX UX #3: Offline detection and user notification
 * 
 * Displays a banner when the user loses internet connection
 * Auto-hides when connection is restored
 */
export const OfflineDetector = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      console.log('✅ Connection restored');
      setIsOnline(true);
      
      // Show toast only if user was previously offline
      if (wasOffline) {
        toast({
          title: 'Back Online',
          description: 'Your internet connection has been restored.',
          duration: 3000,
        });
        setWasOffline(false);
      }
    };

    const handleOffline = () => {
      console.log('❌ Connection lost');
      setIsOnline(false);
      setWasOffline(true);
      
      toast({
        title: 'No Internet Connection',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
        duration: 5000,
      });
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline, toast]);

  // Don't render anything if online
  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top">
      <Alert className="rounded-none border-x-0 border-t-0 border-b-2 border-red-500 bg-red-50">
        <WifiOff className="h-5 w-5 text-red-600" />
        <AlertDescription className="text-red-900 font-medium ml-2">
          You're currently offline. Some features may not work until your connection is restored.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OfflineDetector;
