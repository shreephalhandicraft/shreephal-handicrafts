import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ResponsiveBanner } from "./hero/ResponsiveBanner";
import { FeaturedCategoriesSection } from "./hero/FeaturedCategoriesSection";
import { LoadingState } from "./hero/LoadingState";
import { ErrorState } from "./hero/ErrorState";

export const Hero = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug, price, image, rating, featured")
          .eq("featured", true)
          .order("name", { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("categories")
            .select("id, name, slug, price, image, rating, featured")
            .order("name", { ascending: true })
            .limit(8);

          if (fallbackError) throw fallbackError;
          setCategories(fallbackData || []);
        } else {
          setCategories(data);
        }
      } catch (err) {
        setError(err.message || "Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white">
      <ResponsiveBanner />
      <FeaturedCategoriesSection categories={categories} />
    </section>
  );
};
