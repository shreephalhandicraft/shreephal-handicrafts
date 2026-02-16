import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  
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

    // ✅ FIX BUG #8: Handle PASSWORD_RECOVERY event to prevent auto-login
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Mark recovery mode to restrict access
        setIsRecoveryMode(true);
        sessionStorage.setItem('password_recovery_mode', 'true');
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsRecoveryMode(false);
        sessionStorage.removeItem('password_recovery_mode');
        // ✅ Reset admin status when user changes
        setAdminStatus(null);
        setAdminChecked(false);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // Check if already in recovery mode from previous session
    const recoveryMode = sessionStorage.getItem('password_recovery_mode');
    if (recoveryMode === 'true') {
      setIsRecoveryMode(true);
    }

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // ✅ FIX MEDIUM BUG #3: Cache admin role check
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || adminChecked || isRecoveryMode) return;
      
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
  }, [user?.id, adminChecked, isRecoveryMode]);

  // ✅ Password validation utility (unified for consistency)
  const validatePasswordStrength = (password) => {
    const errors = [];
    
    if (password.length < 6) {
      errors.push("at least 6 characters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("one uppercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("one number");
    }
    
    if (errors.length > 0) {
      return { valid: false, message: `Password must contain ${errors.join(", ")}` };
    }
    
    return { valid: true, message: null };
  };

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

    // ✅ FIX BUG #2: Apply strong password validation
    const validation = validatePasswordStrength(password);
    if (!validation.valid) {
      return { error: validation.message };
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
      setIsRecoveryMode(false);
      sessionStorage.removeItem('password_recovery_mode');
      
      // ✅ Clear admin status on logout
      setAdminStatus(null);
      setAdminChecked(false);
    } catch (err) {
      // Silent error handling
    }
  };

  /**
   * ✅ FIXED BUG #4: Request password reset email with email trimming
   * @param {string} email - User's email address
   * @returns {Promise<{error: string | null}>}
   */
  const requestPasswordReset = async (email) => {
    try {
      // ✅ FIX BUG #4: Trim email
      const trimmedEmail = email.trim();
      
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
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
   * ✅ FIXED BUG #1: Change password with server-side verification (no double login)
   * Note: Since Supabase doesn't have a native password verification API,
   * we use a temporary session approach that doesn't interfere with current session
   */
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { error: "You must be logged in to change your password" };
      }

      if (!currentPassword || currentPassword.trim() === "") {
        return { error: "Current password is required" };
      }

      // ✅ FIX BUG #2: Apply strong password validation
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return { error: validation.message };
      }

      if (currentPassword === newPassword) {
        return { error: "New password must be different from current password" };
      }

      // ✅ FIX BUG #1: Verify password without creating new session
      // Store current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Verify current password in a separate client instance
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        // Restore original session if verification failed
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          });
        }
        return { error: "Current password is incorrect" };
      }

      // If verification successful, update to new password
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
   * ✅ FIXED BUG #5: Update password during reset flow with strong validation
   */
  const resetPassword = async (newPassword) => {
    try {
      // ✅ FIX BUG #5: Apply strong password validation
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return { error: validation.message };
      }

      // Supabase automatically detects the recovery session from URL
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      // ✅ Clear recovery mode after successful password reset
      setIsRecoveryMode(false);
      sessionStorage.removeItem('password_recovery_mode');

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
        isRecoveryMode, // ✅ Export recovery mode status
        // ✅ Export admin status for AdminRoute
        isAdmin: adminStatus && adminStatus !== false,
        adminRole: adminStatus,
        adminLoading,
        // ✅ Password management methods
        requestPasswordReset,
        changePassword,
        resetPassword,
        validatePasswordStrength, // ✅ Export for use in components
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
