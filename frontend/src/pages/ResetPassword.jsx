import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { resetPassword, validatePasswordStrength } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // Check if we have a valid recovery session
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        console.log('=== PASSWORD RESET DEBUG START ===');
        console.log('Full URL:', window.location.href);
        console.log('URL search params:', window.location.search);
        console.log('URL hash:', window.location.hash);
        
        // Parse both search params and hash params
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for type and access_token in both locations
        const type = searchParams.get('type') || hashParams.get('type');
        const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
        
        console.log('Extracted values:');
        console.log('- type:', type);
        console.log('- accessToken:', accessToken ? 'YES (length: ' + accessToken.length + ')' : 'NO');
        console.log('- refreshToken:', refreshToken ? 'YES' : 'NO');
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session check:');
        console.log('- Has session:', !!session);
        console.log('- Session user:', session?.user?.email);
        console.log('- Session error:', error);
        
        // Decision logic
        let isValid = false;
        
        if (type === 'recovery') {
          console.log('✅ Type is "recovery"');
          isValid = true;
        } else if (accessToken && session) {
          console.log('✅ Has access token and session');
          isValid = true;
        } else if (session) {
          // Check if this might be a recovery session without explicit type
          // Sometimes Supabase doesn't include type in URL
          console.log('⚠️ Has session but no type parameter');
          console.log('Treating as valid - user likely came from reset link');
          isValid = true; // Be permissive - if they have a session, let them reset
        } else {
          console.log('❌ No valid recovery indicators found');
          isValid = false;
        }
        
        console.log('Final decision: hasValidToken =', isValid);
        console.log('=== PASSWORD RESET DEBUG END ===');
        
        setHasValidToken(isValid);
      } catch (err) {
        console.error("Recovery session check error:", err);
        setHasValidToken(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    console.log('🔄 Submitting password reset...');

    // Validate password
    const validation = validatePasswordStrength(formData.password);
    if (!validation.valid) {
      console.log('❌ Password validation failed:', validation.message);
      setErrors({ password: validation.message });
      setIsSubmitting(false);
      return;
    }

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      console.log('❌ Passwords do not match');
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsSubmitting(false);
      return;
    }

    // Reset password
    console.log('📤 Calling resetPassword...');
    const { error } = await resetPassword(formData.password);

    if (error) {
      console.error('❌ Password reset failed:', error);
      toast({
        title: "Password Reset Failed",
        description: error,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      console.log('✅ Password reset successful!');
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated. Redirecting to login...",
      });
      
      // Sign out to force fresh login
      console.log('🚪 Signing out user...');
      await supabase.auth.signOut();
      
      setTimeout(() => {
        console.log('➡️ Redirecting to login...');
        navigate("/login", { 
          state: { message: "Password updated successfully. Please sign in with your new password." }
        });
      }, 2000);
    }
  };

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
          <p className="text-xs text-gray-400 mt-2">Check browser console for details (F12)</p>
        </div>
      </Layout>
    );
  }

  // Invalid or expired link
  if (!hasValidToken) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid or Expired Link
            </h2>
            <p className="text-gray-600 mb-4">
              This password reset link is invalid or has expired.
              Password reset links are only valid for 1 hour.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-left">
              <p className="text-xs font-mono text-gray-600 mb-1">Debug info (check console):</p>
              <p className="text-xs font-mono text-gray-500">Press F12 to see detailed logs</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full"
              >
                Request New Reset Link
              </Button>
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Valid token - show reset form
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Your Password
            </h2>
            <p className="text-gray-600">
              Enter a new strong password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  disabled={isSubmitting}
                  className={errors.password ? "border-red-500" : ""}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <p className="font-medium">Password must contain:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li>At least 6 characters</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One number (0-9)</li>
                </ul>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  disabled={isSubmitting}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-primary hover:underline font-medium"
              >
                Sign in instead
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
