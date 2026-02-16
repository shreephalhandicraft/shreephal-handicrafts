import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * ✅ FIX BUG #8: Route guard that prevents access to protected routes
 * when user is in password recovery mode.
 * 
 * This prevents users from accessing the app after clicking password reset link
 * without actually changing their password.
 */
const PasswordRecoveryGuard = ({ children }) => {
  const { isRecoveryMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if in recovery mode (either from auth state or sessionStorage)
    const recoveryActive = isRecoveryMode || sessionStorage.getItem('password_recovery_mode') === 'true';
    
    if (recoveryActive) {
      // Only allow access to reset-password page
      if (location.pathname !== '/reset-password') {
        // Redirect to reset password page
        navigate('/reset-password', { replace: true });
      }
      
      // ✅ Prevent navigation away from reset password page
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'You must reset your password before leaving this page.';
        return 'You must reset your password before leaving this page.';
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isRecoveryMode, location.pathname, navigate]);

  return children;
};

export default PasswordRecoveryGuard;
