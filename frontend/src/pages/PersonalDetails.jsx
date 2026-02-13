import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PersonalDetailsHeader } from "../components/PersonalDetailsHeader.jsx";
import { PersonalDetailsView } from "../components/PersonalDetailsView";
import { PersonalDetailsForm } from "../components/PersonalDetailsForm";
import { LoadingCard } from "../components/LoadingCard";

const AUTOSAVE_KEY = "shreephal_personal_details_autosave";

export default function PersonalDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India", // Default to India
    },
    bio: "",
  });

  // Auto-save form data to localStorage
  useEffect(() => {
    if (isEditing && user?.id) {
      const autoSaveData = {
        ...formData,
        userId: user.id,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autoSaveData));
    }
  }, [formData, isEditing, user?.id]);

  useEffect(() => {
    if (user?.id) {
      loadCustomerData();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadCustomerData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: customerRecords, error } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      if (customerRecords && customerRecords.length > 0) {
        const existingCustomer = customerRecords[0];
        setCustomerId(existingCustomer.id);

        // Parse address
        let parsedAddress = {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "India",
        };

        if (existingCustomer.address) {
          try {
            parsedAddress =
              typeof existingCustomer.address === "string"
                ? JSON.parse(existingCustomer.address)
                : existingCustomer.address;
            
            // Ensure country is set to India
            if (!parsedAddress.country) {
              parsedAddress.country = "India";
            }
          } catch (parseError) {
            console.error("Error parsing address:", parseError);
          }
        }

        const loadedData = {
          name: existingCustomer.name || "",
          email: existingCustomer.email || "",
          phone: existingCustomer.phone || "",
          address: parsedAddress,
          bio: existingCustomer.bio || "",
        };

        setFormData(loadedData);

        // Check for auto-saved data
        const autoSaved = localStorage.getItem(AUTOSAVE_KEY);
        if (autoSaved) {
          try {
            const parsed = JSON.parse(autoSaved);
            if (parsed.userId === user.id) {
              // Show toast asking if user wants to restore
              toast({
                title: "Unsaved Changes Found",
                description: "You have unsaved changes. Edit to restore them.",
                duration: 5000,
              });
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      } else {
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "India",
          },
          bio: "",
        });
        setCustomerId(null);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to load customer data: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const validateAddress = (address) => {
    const errors = {};

    if (!address.street || address.street.trim().length < 5) {
      errors.street = "Street address must be at least 5 characters";
    }

    if (!address.state || address.state.trim() === "") {
      errors.state = "Please select a state";
    }

    if (!address.city || address.city.trim() === "") {
      errors.city = "Please select a city";
    }

    if (!address.zipCode || address.zipCode.trim() === "") {
      errors.zipCode = "PIN code is required";
    } else if (!/^\d{6}$/.test(address.zipCode)) {
      errors.zipCode = "PIN code must be exactly 6 digits";
    }

    return errors;
  };

  const validateForm = (data) => {
    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!data.email || !data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = "Please enter a valid email address";
    }

    if (data.phone && data.phone.trim() !== "") {
      const phoneDigits = data.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        errors.phone = "Phone number must be at least 10 digits";
      }
    }

    // Validate address
    const addressErrors = validateAddress(data.address);
    if (Object.keys(addressErrors).length > 0) {
      Object.assign(errors, addressErrors);
    }

    return errors;
  };

  const handleSubmit = async (updatedFormData) => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    const errors = validateForm(updatedFormData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    setValidationErrors({});

    try {
      setSaving(true);

      // Clean address - ensure country is India
      const cleanAddress = {
        street: updatedFormData.address.street.trim(),
        city: updatedFormData.address.city.trim(),
        state: updatedFormData.address.state.trim(),
        zipCode: updatedFormData.address.zipCode.trim(),
        country: "India", // Always India
      };

      const customerData = {
        name: updatedFormData.name.trim(),
        email: updatedFormData.email.trim(),
        phone: updatedFormData.phone.trim() || null,
        address: cleanAddress,
        bio: updatedFormData.bio.trim() || null,
        user_id: user.id,
        profile_completed: true,
      };

      let result;

      if (customerId) {
        // Update existing customer
        result = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customerId)
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        // Check for duplicates before insert
        const { data: existingCustomers, error: checkError } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", user.id);

        if (checkError) {
          throw checkError;
        }

        if (existingCustomers && existingCustomers.length > 0) {
          // Duplicate found - update instead of insert
          const existingId = existingCustomers[0].id;
          setCustomerId(existingId);
          
          result = await supabase
            .from("customers")
            .update(customerData)
            .eq("id", existingId)
            .select()
            .single();

          toast({
            title: "Note",
            description: "Existing profile found and updated.",
            duration: 3000,
          });
        } else {
          // No duplicate - safe to insert
          result = await supabase
            .from("customers")
            .insert([customerData])
            .select()
            .single();
        }
      }

      if (result.error) {
        throw result.error;
      }

      if (result.data && !customerId) {
        setCustomerId(result.data.id);
      }

      // Clear auto-save
      localStorage.removeItem(AUTOSAVE_KEY);

      toast({
        title: "Success!",
        description: "Your profile has been updated successfully.",
      });

      // Update auth metadata
      try {
        await supabase.auth.updateUser({
          data: { profile_completed: true },
        });
      } catch (metaErr) {
        console.error("Metadata update error:", metaErr);
      }

      // Reload data
      await loadCustomerData();
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to save profile.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Ask user if they want to discard changes
    const autoSaved = localStorage.getItem(AUTOSAVE_KEY);
    if (autoSaved) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to discard them?"
      );
      if (!confirmed) return;
      localStorage.removeItem(AUTOSAVE_KEY);
    }

    setValidationErrors({});
    setIsEditing(false);
    loadCustomerData();
  };

  const handleEditClick = () => {
    // Try to restore auto-saved data
    const autoSaved = localStorage.getItem(AUTOSAVE_KEY);
    if (autoSaved) {
      try {
        const parsed = JSON.parse(autoSaved);
        if (parsed.userId === user.id) {
          const { userId, timestamp, ...savedFormData } = parsed;
          setFormData(savedFormData);
          toast({
            title: "Unsaved Changes Restored",
            description: "Your previous changes have been restored.",
          });
        }
      } catch (e) {
        // Ignore
      }
    }
    setIsEditing(true);
  };

  if (!user && loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <LoadingCard />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">
                  Authentication Required
                </h2>
                <p className="text-gray-600 mt-2">
                  Please log in to view your personal details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <LoadingCard />
            ) : isEditing ? (
              <PersonalDetailsForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                onCancel={handleCancelEdit}
                saving={saving}
                customerId={customerId}
                errors={validationErrors}
              />
            ) : (
              <PersonalDetailsView
                formData={formData}
                onEditClick={handleEditClick}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
