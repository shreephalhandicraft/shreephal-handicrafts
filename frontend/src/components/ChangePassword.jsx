import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ChangePassword = () => {
  const { changePassword, validatePasswordStrength } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate current password
    if (!formData.currentPassword || formData.currentPassword.trim() === "") {
      setErrors({ currentPassword: "Current password is required" });
      setIsSubmitting(false);
      return;
    }

    // ✅ FIX BUG #2: Use consistent strong password validation
    const passwordValidation = validatePasswordStrength(formData.newPassword);
    if (!passwordValidation.valid) {
      setErrors({ newPassword: passwordValidation.message });
      setIsSubmitting(false);
      return;
    }

    // Check if new password is same as current password
    if (formData.currentPassword === formData.newPassword) {
      setErrors({ newPassword: "New password must be different from current password" });
      setIsSubmitting(false);
      return;
    }

    // Validate password confirmation
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setIsSubmitting(false);
      return;
    }

    // Change password with old password verification
    const { error } = await changePassword(formData.currentPassword, formData.newPassword);

    if (error) {
      // Check if error is related to incorrect current password
      if (error.toLowerCase().includes("invalid") || error.toLowerCase().includes("incorrect") || error.toLowerCase().includes("wrong")) {
        setErrors({ currentPassword: "Current password is incorrect" });
      }
      
      toast({
        title: "Password Change Failed",
        description: error,
        variant: "destructive",
      });
      setIsSubmitting(false);
    } else {
      toast({
        title: "Password Changed Successfully",
        description: "Your password has been updated.",
      });
      
      // Reset form and close dialog
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleDialogOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset form when dialog closes
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Lock className="h-4 w-4 mr-2" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new password for your account
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative mt-1">
              <Input
                id="currentPassword"
                name="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                required
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                disabled={isSubmitting}
                className={errors.currentPassword ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex="-1"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>
            )}
          </div>

          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative mt-1">
              <Input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                required
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                disabled={isSubmitting}
                className={errors.newPassword ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
            )}
            {/* ✅ FIX BUG #2: Add password requirements hint */}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside pl-2">
                <li>At least 6 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
              </ul>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative mt-1">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                disabled={isSubmitting}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex="-1"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="text-sm text-center pt-2">
            <Link 
              to="/forgot-password" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() => setOpen(false)}
            >
              Forgot your current password?
            </Link>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePassword;