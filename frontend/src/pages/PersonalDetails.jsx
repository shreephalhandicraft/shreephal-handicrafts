import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { PersonalDetailsHeader } from "../components/PersonalDetailsHeader.jsx";
import { PersonalDetailsView } from "../components/PersonalDetailsView";
import { PersonalDetailsForm } from "../components/PersonalDetailsForm";
import { LoadingCard } from "../components/LoadingCard";

export default function PersonalDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    bio: "",
  });

  useEffect(() => {
    console.log("User in useEffect:", user); // Debug log
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
      console.log("Loading customer data for user:", user.id);

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

        console.log(
          `Found ${customerRecords.length} customer records, using most recent:`,
          existingCustomer
        );

        setCustomerId(existingCustomer.id);

        // Parse address if it's a JSON string
        let parsedAddress = {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
        };

        if (existingCustomer.address) {
          try {
            // If address is a string, parse it; if it's already an object, use it
            parsedAddress =
              typeof existingCustomer.address === "string"
                ? JSON.parse(existingCustomer.address)
                : existingCustomer.address;
          } catch (parseError) {
            console.error("Error parsing address JSON:", parseError);
            // Keep default empty address if parsing fails
          }
        }

        setFormData({
          name: existingCustomer.name || "",
          email: existingCustomer.email || "",
          phone: existingCustomer.phone || "",
          address: parsedAddress,
          bio: existingCustomer.bio || "",
        });
      } else {
        console.log("No existing customer found");
        setFormData({
          name: "",
          email: "",
          phone: "",
          address: {
            street: "",
            city: "",
            state: "",
            zipCode: "",
            country: "",
          },
          bio: "",
        });
        setCustomerId(null);
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


  const handleSubmit = async (updatedFormData) => {
    if (!user?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated.",
        variant: "destructive",
      });
      return;
    }

    if (!updatedFormData.name.trim() || !updatedFormData.email.trim()) {
      return toast({
        title: "Validation Error",
        description: "Name and email are required.",
        variant: "destructive",
      });
    }

    try {
      setSaving(true);

      const cleanAddress = Object.fromEntries(
        Object.entries(updatedFormData.address).filter(
          ([_, v]) => v && v.trim() !== ""
        )
      );

      const customerData = {
        name: updatedFormData.name.trim(),
        email: updatedFormData.email.trim(),
        phone: updatedFormData.phone.trim() || null,
        // Store address as JSON object, not string
        address: Object.keys(cleanAddress).length > 0 ? cleanAddress : null,
        bio: updatedFormData.bio.trim() || null,
        user_id: user.id,
        profile_completed: true,
      };

      console.log("Saving customer data:", customerData);

      let result;

      if (customerId) {
        console.log("Updating existing customer:", customerId);
        result = await supabase
          .from("customers")
          .update(customerData)
          .eq("id", customerId)
          .eq("user_id", user.id)
          .select()
          .single();
      } else {
        console.log("Creating new customer");
        result = await supabase
          .from("customers")
          .insert([customerData])
          .select()
          .single();
      }

      console.log("Save result:", result); // Debug log

      if (result.error) {
        console.error("Save error:", result.error);
        throw result.error;
      }

      if (result.data && !customerId) {
        setCustomerId(result.data.id);
      }

      toast({
        title: "Success!",
        description: "Details updated successfully.",
      });

      // Update auth metadata
      try {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: { profile_completed: true },
        });

        if (metadataError) {
          console.error("Failed to update auth metadata:", metadataError);
        } else {
          console.log("✅ profile_completed metadata set to true");
        }
      } catch (metaErr) {
        console.error("Metadata update error:", metaErr);
      }

      // Reload data after successful save
      await loadCustomerData();
      setIsEditing(false);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      toast({
        title: "Error",
        description: err.message || "Save failed.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    loadCustomerData(); // Reload original data
  };

  // Show loading if user is not yet loaded
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

  // Show error if user is not authenticated
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
              />
            ) : (
              <PersonalDetailsView
                formData={formData}
                onEditClick={() => setIsEditing(true)}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
