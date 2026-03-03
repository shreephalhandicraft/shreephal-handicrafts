// AuthCallback.jsx
// This page handles email verification and password reset redirects.
// Supabase redirects here after the token is verified via the Cloudflare proxy.
// It reads the session from the URL hash/params and then redirects the user.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient.js";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase puts the session tokens in the URL hash after redirect
        // e.g. #access_token=...&refresh_token=...&type=signup
        const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type") || queryParams.get("type");
        const errorDescription = hashParams.get("error_description") || queryParams.get("error_description");

        // Handle error in URL
        if (errorDescription) {
          console.error("❌ Auth callback error:", errorDescription);
          setStatus("Verification failed. Redirecting to login...");
          setTimeout(() => navigate("/login?error=verification_failed"), 2000);
          return;
        }

        // If we have access_token in hash (standard Supabase flow)
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error("❌ Session error:", error);
            setStatus("Verification failed. Please try again.");
            setTimeout(() => navigate("/login?error=session_failed"), 2000);
            return;
          }

          console.log("✅ Session set successfully:", data);

          // Route based on type
          if (type === "recovery") {
            setStatus("Password reset verified! Redirecting...");
            setTimeout(() => navigate("/reset-password"), 1000);
          } else {
            // signup or email_change
            setStatus("Email verified! Welcome to Shreephal Handicrafts 🎉");
            setTimeout(() => navigate("/personal-details"), 1500);
          }
          return;
        }

        // Fallback: try getSession (sometimes Supabase auto-sets it)
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          if (type === "recovery") {
            setStatus("Password reset verified! Redirecting...");
            setTimeout(() => navigate("/reset-password"), 1000);
          } else {
            setStatus("Email verified! Welcome to Shreephal Handicrafts 🎉");
            setTimeout(() => navigate("/personal-details"), 1500);
          }
          return;
        }

        // No token found at all
        console.warn("⚠️ No tokens found in URL");
        setStatus("Verification link invalid or expired. Redirecting...");
        setTimeout(() => navigate("/login?error=invalid_link"), 2000);

      } catch (err) {
        console.error("❌ Auth callback exception:", err);
        setStatus("Something went wrong. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full mx-4 text-center">
        {/* Shreephal Logo / Branding */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🪔</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Shreephal Handicrafts</h1>
        </div>

        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>

        {/* Status message */}
        <p className="text-gray-600 text-lg">{status}</p>
        <p className="text-gray-400 text-sm mt-2">Please wait, do not close this page.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
