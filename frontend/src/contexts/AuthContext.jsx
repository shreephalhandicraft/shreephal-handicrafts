import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ FIX MEDIUM BUG #3: Add admin status caching
  const [adminStatus, setAdminStatus] = useState(null); // null | 'admin' | 'superadmin' | false
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    let loadingTimeout;

    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error.message);
        } else {
          console.log("Session retrieved:", session);
        }

        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Error getting session:", err);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Failsafe: Ensure loading never hangs indefinitely
    loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timeout reached - forcing completion");
        setLoading(false);
      }
    }, 10000);

    // Single auth state listener with proper cleanup
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // ✅ Reset admin status when user changes
      if (event === 'SIGNED_OUT') {
        setAdminStatus(null);
        setAdminChecked(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // ✅ FIX MEDIUM BUG #3: Cache admin role check
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || adminChecked) return;
      
      setAdminLoading(true);
      
      try {
        console.log("🔐 Checking admin status for:", user.email);
        
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, role")
          .eq("email", user.email)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error("Admin check error:", error);
          setAdminStatus(false);
        } else if (data) {
          console.log("✅ Admin status confirmed:", data.role);
          setAdminStatus(data.role);
        } else {
          console.log("❌ Not an admin user");
          setAdminStatus(false);
        }
        
        setAdminChecked(true);
      } catch (error) {
        console.error("Admin status check failed:", error);
        setAdminStatus(false);
        setAdminChecked(true);
      } finally {
        setAdminLoading(false);
      }
    };
    
    checkAdminStatus();
  }, [user?.id, adminChecked]); // Only check when user ID changes

  const login = async (email, password) => {
    try {
      console.log("Attempting login with email:", email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error("Login error:", error);
        return { error: error.message };
      }

      console.log("Login successful:", data);
      setUser(data.user);
      
      // ✅ Reset admin check so it runs for new user
      setAdminChecked(false);
      setAdminStatus(null);
      
      return { user: data.user };
    } catch (err) {
      console.error("Login exception:", err);
      return { error: "Login failed. Please try again." };
    }
  };

  const register = async (email, password, name) => {
    console.log("Attempting registration with:", {
      email,
      password: "***",
      name,
    });

    if (!email || !password) {
      return { error: "Email and password are required" };
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters long" };
    }

    try {
      const signUpData = {
        email: email.trim(),
        password,
        options: {
          data: {
            name: name?.trim() || "",
            full_name: name?.trim() || "",
          },
        },
      };

      console.log("Calling supabase.auth.signUp with:", {
        email: signUpData.email,
        password: "***",
        options: signUpData.options,
      });

      const { data, error } = await supabase.auth.signUp(signUpData);

      if (error) {
        console.error("Signup error:", error);
        return { error: error.message };
      }

      console.log("Signup response:", data);

      if (data.user && !data.user.email_confirmed_at) {
        console.log("Email confirmation required");
        return {
          user: data.user,
          message: "Please check your email for confirmation link",
        };
      }

      setUser(data.user);
      return { user: data.user };
    } catch (err) {
      console.error("Registration exception:", err);
      return { error: "Registration failed. Please try again." };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
      }
      setUser(null);
      
      // ✅ Clear admin status on logout
      setAdminStatus(null);
      setAdminChecked(false);
    } catch (err) {
      console.error("Logout exception:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: !!user,
        // ✅ Export admin status for AdminRoute
        isAdmin: adminStatus && adminStatus !== false,
        adminRole: adminStatus,
        adminLoading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
