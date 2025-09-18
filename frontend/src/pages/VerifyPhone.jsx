import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Smartphone, Shield, ArrowLeft } from "lucide-react";
import { Layout } from "@/components/Layout";

const VerifyPhone = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("enter-phone");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Check if user already has verified phone
  useEffect(() => {
    const checkExistingPhone = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("customers")
          .select("phone")
          .eq("user_id", user.id)
          .single();

        if (!error && data && data.phone) {
          // User already has verified phone, redirect
          navigate("/my-orders");
        }
      } catch (error) {
        console.error("Error checking existing phone:", error);
      }
    };

    checkExistingPhone();
  }, [user, navigate]);

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const validatePhoneNumber = (phoneNumber) => {
    // Indian phone number validation
    const phoneRegex = /^(\+91|91|0)?[6789]\d{9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ""));
  };

  const formatPhoneNumber = (phoneNumber) => {
    // Ensure phone number starts with +91
    let cleanPhone = phoneNumber.replace(/\s+/g, "").replace(/[^\d+]/g, "");

    if (cleanPhone.startsWith("0")) {
      cleanPhone = cleanPhone.substring(1);
    }

    if (cleanPhone.startsWith("91") && !cleanPhone.startsWith("+91")) {
      cleanPhone = "+" + cleanPhone;
    } else if (!cleanPhone.startsWith("+91") && !cleanPhone.startsWith("91")) {
      cleanPhone = "+91" + cleanPhone;
    }

    return cleanPhone;
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phone)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Indian mobile number",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: "Please check your phone for the 6-digit code",
      });

      setPhone(formattedPhone); // Store formatted phone
      setStep("enter-otp");
      setCountdown(60); // 60 second countdown
    } catch (error) {
      console.error("OTP Send Error:", error);
      toast({
        title: "Failed to send OTP",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "sms",
      });

      if (error) throw error;

      // Save/update customer record with verified phone
      const customerData = {
        user_id: user.id,
        name:
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          state?.firstName + " " + state?.lastName ||
          "User",
        email: user.email,
        phone: phone,
        profile_completed: true,
      };

      const { error: customerError } = await supabase
        .from("customers")
        .upsert(customerData, {
          onConflict: "user_id",
        });

      if (customerError) throw customerError;

      toast({
        title: "Phone Verified Successfully!",
        description:
          "Your phone number has been verified and linked to your account.",
      });

      // Redirect to intended page or my-orders
      const redirectTo = state?.from?.pathname || "/my-orders";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error("OTP Verification Error:", error);
      toast({
        title: "OTP Verification Failed",
        description: error.message || "Please check your OTP and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });

      if (error) throw error;

      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your phone",
      });

      setCountdown(60);
    } catch (error) {
      toast({
        title: "Failed to resend OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
              {step === "enter-phone" ? (
                <Smartphone className="h-8 w-8 text-blue-600" />
              ) : (
                <Shield className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <CardTitle className="text-xl">
              {step === "enter-phone"
                ? "Verify Your Phone Number"
                : "Enter Verification Code"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {step === "enter-phone"
                ? "We need to verify your phone number for secure transactions"
                : `We've sent a 6-digit code to ${phone}`}
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {step === "enter-phone" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit Indian mobile number
                  </p>
                </div>

                <Button
                  onClick={handleSendOtp}
                  className="w-full"
                  disabled={loading || !phone.trim()}
                >
                  {loading ? "Sending OTP..." : "Send Verification Code"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="Enter 6-digit code"
                    className="text-center text-2xl tracking-widest"
                    maxLength={6}
                  />
                </div>

                <Button
                  onClick={handleVerifyOtp}
                  className="w-full"
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-sm"
                  >
                    {countdown > 0
                      ? `Resend code in ${countdown}s`
                      : "Resend verification code"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setStep("enter-phone");
                    setOtp("");
                    setCountdown(0);
                  }}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Change Phone Number
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default VerifyPhone;
