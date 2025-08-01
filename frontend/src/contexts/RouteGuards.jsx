// RouteGuards.jsx (Modified: Removed PhoneVerificationRoute)
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
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

// Admin Route - Requires admin privileges
export const AdminRoute = ({ children, redirectTo = "/" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setAdminLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, role")
          .eq("email", user.email)
          .single();

        if (!error && data) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Admin check error:", error);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading || adminLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Guest Route - For features that work for both authenticated and non-authenticated users
export const GuestRoute = ({ children }) => {
  return children;
};

// Protected Route - Requires specific permissions/roles
export const ProtectedRoute = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  fallback = "/",
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState(false);
  const [permissionLoading, setPermissionLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        setPermissionLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("role")
          .eq("email", user.email)
          .single();

        if (!error && data) {
          if (requiredRole && data.role === requiredRole) {
            setHasAccess(true);
          } else if (!requiredRole) {
            setHasAccess(true);
          }
        }
      } catch (error) {
        console.error("Permission check error:", error);
      } finally {
        setPermissionLoading(false);
      }
    };

    checkPermissions();
  }, [user, requiredRole, requiredPermission]);

  if (loading || permissionLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!hasAccess) {
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
