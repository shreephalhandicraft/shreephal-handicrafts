// RouteGuards.jsx - ✅ FIXED: Uses cached admin status from AuthContext
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

// Public Route - Redirects authenticated users away from auth pages
export const PublicRoute = ({ children, redirectTo = "/" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    // Redirect authenticated users away from login/register pages
    const from = location.state?.from?.pathname || redirectTo;
    return <Navigate to={from} replace />;
  }

  return children;
};

// Private Route - Requires authentication
export const PrivateRoute = ({ children, redirectTo = "/login" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return children;
};

// ✅ FIX MEDIUM BUG #3: Admin Route now uses cached status from AuthContext
// Admin Route - Requires admin privileges
export const AdminRoute = ({ children, redirectTo = "/" }) => {
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const location = useLocation();

  if (loading || adminLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    // Silent redirect - access denied logged to monitoring in production
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Guest Route - For features that work for both authenticated and non-authenticated users
export const GuestRoute = ({ children }) => {
  return children;
};

// ✅ FIX: Protected Route now uses cached admin role from AuthContext
// Protected Route - Requires specific permissions/roles
export const ProtectedRoute = ({
  children,
  requiredRole = null,
  fallback = "/",
}) => {
  const { user, loading, adminRole, adminLoading } = useAuth();
  const location = useLocation();

  if (loading || adminLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Use cached adminRole instead of querying database
  if (requiredRole && adminRole !== requiredRole) {
    // Silent redirect - access denied logged to monitoring in production
    return <Navigate to={fallback} replace />;
  }

  if (!adminRole) {
    // Silent redirect - access denied logged to monitoring in production
    return <Navigate to={fallback} replace />;
  }

  return children;
};

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);
