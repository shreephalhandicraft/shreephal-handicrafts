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

  /**
   * ✅ NEW: Request password reset email
   * @param {string} email - User's email address
   * @returns {Promise<{error: string | null}>}
   */
  const requestPasswordReset = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Password reset request error:", err);
      return { error: "Failed to send reset email. Please try again." };
    }
  };

  /**
   * ✅ UPDATED: Update password for logged-in user with old password verification
   * @param {string} currentPassword - Current password for verification
   * @param {string} newPassword - New password
   * @returns {Promise<{error: string | null}>}
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { error: "You must be logged in to change your password" };
      }

      if (!currentPassword || currentPassword.trim() === "") {
        return { error: "Current password is required" };
      }

      if (newPassword.length < 6) {
        return { error: "New password must be at least 6 characters long" };
      }

      if (currentPassword === newPassword) {
        return { error: "New password must be different from current password" };
      }

      // ✅ SECURITY: Verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        return { error: "Current password is incorrect" };
      }

      // ✅ If verification successful, update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        return { error: updateError.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Password change error:", err);
      return { error: "Failed to change password. Please try again." };
    }
  };

  /**
   * ✅ NEW: Update password during reset flow (with token)
   * @param {string} newPassword - New password
   * @returns {Promise<{error: string | null}>}
   */
  const resetPassword = async (newPassword) => {
    try {
      if (newPassword.length < 6) {
        return { error: "Password must be at least 6 characters long" };
      }

      // Supabase automatically detects the recovery session from URL
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error("Password reset error:", err);
      return { error: "Failed to reset password. Please try again." };
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
        // ✅ NEW: Password management methods
        requestPasswordReset,
        changePassword,
        resetPassword,
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
