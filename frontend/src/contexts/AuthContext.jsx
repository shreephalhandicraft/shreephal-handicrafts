import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  
  // Admin status caching
  const [adminStatus, setAdminStatus] = useState(null);
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

    // Auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      // Track password recovery but DON'T block access
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery detected');
        setIsPasswordRecovery(true);
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsPasswordRecovery(false);
        setAdminStatus(null);
        setAdminChecked(false);
      } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        setAdminChecked(false);
        setAdminStatus(null);
      } else {
        setUser(session?.user ?? null);
      }
      
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Cache admin role check
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
  }, [user?.id, adminChecked]);

  // Password validation utility
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
      setIsPasswordRecovery(false);
      setAdminStatus(null);
      setAdminChecked(false);
    } catch (err) {
      // Silent error handling
    }
  };

  const requestPasswordReset = async (email) => {
    try {
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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { error: "You must be logged in to change your password" };
      }

      if (!currentPassword || currentPassword.trim() === "") {
        return { error: "Current password is required" };
      }

      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return { error: validation.message };
      }

      if (currentPassword === newPassword) {
        return { error: "New password must be different from current password" };
      }

      // Store current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Verify password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        // Restore session if verification failed
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          });
        }
        return { error: "Current password is incorrect" };
      }

      // Update to new password
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
   * Simple password reset for recovery flow
   * No session verification needed - Supabase handles the token
   */
  const resetPassword = async (newPassword) => {
    try {
      console.log('Resetting password...');
      
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return { error: validation.message };
      }

      // Supabase automatically uses the recovery token from the URL
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      console.log('Password update result:', { data, error });

      if (error) {
        return { error: error.message };
      }

      // Clear recovery flag
      setIsPasswordRecovery(false);

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
        isPasswordRecovery,
        isAdmin: adminStatus && adminStatus !== false,
        adminRole: adminStatus,
        adminLoading,
        requestPasswordReset,
        changePassword,
        resetPassword,
        validatePasswordStrength,
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
