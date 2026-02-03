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

        if (!error) {
          setUser(session?.user ?? null);
        }
      } catch (err) {
        // Silent error handling
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Failsafe: Ensure loading never hangs indefinitely
    loadingTimeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000);

    // Single auth state listener with proper cleanup
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, role")
          .eq("email", user.email)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          setAdminStatus(false);
        } else if (data) {
          setAdminStatus(data.role);
        } else {
          setAdminStatus(false);
        }
        
        setAdminChecked(true);
      } catch (error) {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      setUser(data.user);
      
      // ✅ Reset admin check so it runs for new user
      setAdminChecked(false);
      setAdminStatus(null);
      
      return { user: data.user };
    } catch (err) {
      return { error: "Login failed. Please try again." };
    }
  };

  const register = async (email, password, name) => {
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

      const { data, error } = await supabase.auth.signUp(signUpData);

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return {
          user: data.user,
          message: "Please check your email for confirmation link",
        };
      }

      setUser(data.user);
      return { user: data.user };
    } catch (err) {
      return { error: "Registration failed. Please try again." };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      
      // ✅ Clear admin status on logout
      setAdminStatus(null);
      setAdminChecked(false);
    } catch (err) {
      // Silent error handling
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
