import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";

const CheckoutForm = ({ onDataLoaded, onValidationChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Validation rules
  const validateField = (name, value) => {
    const trimmedValue = value.trim();

    switch (name) {
      case "firstName":
      case "lastName":
        if (!trimmedValue)
          return `${name === "firstName" ? "First" : "Last"} name is required`;
        if (trimmedValue.length < 2)
          return `${
            name === "firstName" ? "First" : "Last"
          } name must be at least 2 characters`;
        if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue))
          return `${
            name === "firstName" ? "First" : "Last"
          } name contains invalid characters`;
        return "";

      case "email":
        if (!trimmedValue) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedValue))
          return "Please enter a valid email address";
        return "";

      case "phone":
        if (!trimmedValue) return "Phone number is required";
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanPhone = trimmedValue.replace(/[\s\-\(\)]/g, "");
        if (!phoneRegex.test(cleanPhone))
          return "Please enter a valid phone number";
        if (cleanPhone.length < 10)
          return "Phone number must be at least 10 digits";
        return "";

      case "address":
        if (!trimmedValue) return "Address is required";
        if (trimmedValue.length < 5) return "Please enter a complete address";
        return "";

      case "city":
        if (!trimmedValue) return "City is required";
        if (trimmedValue.length < 2)
          return "City name must be at least 2 characters";
        if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue))
          return "City name contains invalid characters";
        return "";

      case "state":
        if (!trimmedValue) return "State is required";
        if (trimmedValue.length < 2)
          return "State must be at least 2 characters";
        return "";

      case "zipCode":
        if (!trimmedValue) return "ZIP code is required";
        // Support various ZIP code formats (US, Canada, UK, etc.)
        const zipRegex = /^[a-zA-Z0-9\s\-]{3,10}$/;
        if (!zipRegex.test(trimmedValue))
          return "Please enter a valid ZIP/postal code";
        return "";

      default:
        return "";
    }
  };

  // Validate all fields
  const validateForm = (data = formData) => {
    const newErrors = {};
    Object.keys(data).forEach((field) => {
      const error = validateField(field, data[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  };

  // Check if form is valid
  const isFormValid = () => {
    const currentErrors = validateForm();
    return (
      Object.keys(currentErrors).length === 0 &&
      Object.values(formData).every((value) => value.trim().length > 0)
    );
  };

  // Notify parent about validation changes
  useEffect(() => {
    if (onValidationChange) {
      const valid = isFormValid();
      const currentErrors = validateForm();
      onValidationChange({
        isValid: valid,
        errors: currentErrors,
        formData: formData,
      });
    }
  }, [formData, onValidationChange]);

  useEffect(() => {
    console.log("User in useEffect:", user);
    if (user?.id) {
      loadCustomerData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadCustomerData = async () => {
    if (!user?.id) {
      console.error("No user ID available");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Loading customer data for checkout:", user.id);

      const { data: customerRecords, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Supabase response:", { customerRecords, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (customerRecords && customerRecords.length > 0) {
        const existingCustomer = customerRecords[0];

        console.log("Found customer data for checkout:", existingCustomer);

        let parsedAddress = {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        };

        if (existingCustomer.address) {
          try {
            parsedAddress =
              typeof existingCustomer.address === "string"
                ? JSON.parse(existingCustomer.address)
                : existingCustomer.address;
          } catch (parseError) {
            console.error("Error parsing address JSON:", parseError);
          }
        }

        const checkoutData = {
          firstName: existingCustomer.name
            ? existingCustomer.name.split(" ")[0]
            : "",
          lastName: existingCustomer.name
            ? existingCustomer.name.split(" ").slice(1).join(" ")
            : "",
          email: existingCustomer.email || "",
          phone: existingCustomer.phone || "",
          address: parsedAddress.street || "",
          city: parsedAddress.city || "",
          state: parsedAddress.state || "",
          zipCode: parsedAddress.zipCode || "",
        };

        setFormData(checkoutData);

        // Validate the loaded data
        const loadedErrors = validateForm(checkoutData);
        setErrors(loadedErrors);

        if (onDataLoaded) {
          onDataLoaded({
            ...checkoutData,
            isValid: Object.keys(loadedErrors).length === 0,
          });
        }

        toast({
          title: "Information Pre-filled",
          description: "Your saved details have been loaded.",
        });
      } else {
        console.log("No existing customer found for checkout");
      }
    } catch (err) {
      console.error("Error in loadCustomerData:", err);
      toast({
        title: "Error",
        description: `Failed to load customer data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate the field
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  // Get field error display
  const getFieldError = (fieldName) => {
    return touched[fieldName] && errors[fieldName] ? errors[fieldName] : "";
  };

  // Get field style based on validation
  const getFieldStyle = (fieldName) => {
    if (!touched[fieldName]) return "";
    if (errors[fieldName]) return "border-red-500 focus:border-red-500";
    if (formData[fieldName].trim())
      return "border-green-500 focus:border-green-500";
    return "";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formIsValid = isFormValid();
  const hasErrors = Object.values(errors).some((error) => error);

  return (
    <div className="space-y-6">
      {/* Validation Status */}
      {formData.email && (
        <Alert
          className={`${
            formIsValid
              ? "border-green-200 bg-green-50"
              : "border-yellow-200 bg-yellow-50"
          }`}
        >
          {formIsValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          <AlertDescription
            className={formIsValid ? "text-green-700" : "text-yellow-700"}
          >
            {formIsValid
              ? "✓ Your information has been pre-filled and validated successfully"
              : "⚠ Please review and complete all required fields below"}
          </AlertDescription>
        </Alert>
      )}

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Contact Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium">
              First Name *
            </Label>
            <Input
              id="firstName"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`mt-1 ${getFieldStyle("firstName")}`}
              placeholder="Enter your first name"
            />
            {getFieldError("firstName") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("firstName")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="lastName" className="text-sm font-medium">
              Last Name *
            </Label>
            <Input
              id="lastName"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`mt-1 ${getFieldStyle("lastName")}`}
              placeholder="Enter your last name"
            />
            {getFieldError("lastName") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("lastName")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium">
              Email *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`mt-1 ${getFieldStyle("email")}`}
              placeholder="your.email@example.com"
            />
            {getFieldError("email") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("email")}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone *
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`mt-1 ${getFieldStyle("phone")}`}
              placeholder="(555) 123-4567"
            />
            {getFieldError("phone") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("phone")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Shipping Address
        </h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="address" className="text-sm font-medium">
              Address *
            </Label>
            <Input
              id="address"
              name="address"
              required
              value={formData.address}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`mt-1 ${getFieldStyle("address")}`}
              placeholder="123 Main Street, Apt 4B"
            />
            {getFieldError("address") && (
              <p className="text-red-500 text-sm mt-1">
                {getFieldError("address")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium">
                City *
              </Label>
              <Input
                id="city"
                name="city"
                required
                value={formData.city}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`mt-1 ${getFieldStyle("city")}`}
                placeholder="New York"
              />
              {getFieldError("city") && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError("city")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="state" className="text-sm font-medium">
                State *
              </Label>
              <Input
                id="state"
                name="state"
                required
                value={formData.state}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`mt-1 ${getFieldStyle("state")}`}
                placeholder="NY"
              />
              {getFieldError("state") && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError("state")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="zipCode" className="text-sm font-medium">
                ZIP Code *
              </Label>
              <Input
                id="zipCode"
                name="zipCode"
                required
                value={formData.zipCode}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`mt-1 ${getFieldStyle("zipCode")}`}
                placeholder="10001"
              />
              {getFieldError("zipCode") && (
                <p className="text-red-500 text-sm mt-1">
                  {getFieldError("zipCode")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Form Status: {formIsValid ? "Complete ✓" : "Incomplete"}
          </span>
          <span className="text-sm text-gray-600">
            {
              Object.values(formData).filter((val) => val.trim().length > 0)
                .length
            }
            /8 fields completed
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
