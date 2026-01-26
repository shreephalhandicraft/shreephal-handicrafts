// Login.jsx - Fixed: Better error handling and session management

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabaseClient";

const Spinner = () => (
  <div className="flex items-center justify-center">
    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset email confirmation warning when user changes input
    if (emailNotConfirmed) {
      setEmailNotConfirmed(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setEmailNotConfirmed(false);

    try {
      console.log("🔐 Attempting login...");

      const { user, error } = await login(formData.email, formData.password);

      if (error) {
        console.error("❌ Login error:", error);
        
        // Check for specific error types
        if (error.includes("Email not confirmed") || error.includes("email_confirmed_at")) {
          setEmailNotConfirmed(true);
          toast({
            title: "Email Not Verified",
            description: "Please check your email and verify your account before logging in.",
            variant: "destructive",
            duration: 5000,
          });
        } else if (error.includes("Invalid login credentials")) {
          toast({
            title: "Invalid Credentials",
            description: "The email or password you entered is incorrect.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login Failed",
            description: error || "Please check your credentials and try again.",
            variant: "destructive",
          });
        }
        setIsSubmitting(false);
        return;
      }

      if (user) {
        console.log("✅ Login successful:", user);

        // Verify session exists
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          throw new Error("Failed to establish session");
        }

        if (session) {
          console.log("✅ Session established");
          
          toast({
            title: "Welcome back!",
            description: "You have been successfully logged in.",
          });

          // Check if user is admin
          const { data: adminData } = await supabase
            .from("admin_users")
            .select("id, role")
            .eq("email", user.email)
            .maybeSingle();

          if (adminData) {
            console.log("🔑 Admin user detected");
            // If user tried to access admin, redirect there, otherwise dashboard
            const redirectPath = from.startsWith("/admin") ? from : "/admin";
            setTimeout(() => {
              navigate(redirectPath, { replace: true });
            }, 1000);
          } else {
            // Regular user - redirect to intended page or home
            setTimeout(() => {
              navigate(from, { replace: true });
            }, 1000);
          }
        } else {
          console.error("❌ No session created");
          throw new Error("Unable to establish session. Please try again.");
        }
      }
    } catch (err) {
      console.error("❌ Login exception:", err);
      toast({
        title: "Login Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Sign in to your account</p>
            </div>

            {emailNotConfirmed && (
              <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Your email address hasn't been verified yet. Please check your inbox for the verification link.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="Enter your email"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex="-1"
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Spinner /> : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  className="text-primary hover:underline font-medium"
                >
                  Sign up here
                </Link>
              </p>
            </div>

            {emailNotConfirmed && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    Didn't receive the email?
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.auth.resend({
                          type: 'signup',
                          email: formData.email,
                        });
                        if (error) throw error;
                        toast({
                          title: "Email Sent",
                          description: "Check your inbox for the verification link.",
                        });
                      } catch (err) {
                        toast({
                          title: "Failed to Resend",
                          description: err.message,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Resend Verification Email
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                By signing in, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
