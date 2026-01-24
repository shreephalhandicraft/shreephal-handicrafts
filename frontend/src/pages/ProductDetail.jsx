import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Breadcrumbs from "@/components/Breadcrumbs";

// SEO Components
import { SEOHead } from "@/components/SEO/SEOHead";
import { ProductSchema } from "@/components/SEO/ProductSchema";
import { BreadcrumbSchema } from "@/components/SEO/BreadcrumbSchema";
import { FAQSchema } from "@/components/SEO/FAQSchema";
import { OpenGraphTags } from "@/components/SEO/OpenGraphTags";
import { getProductSEO } from "@/config/seoConfig";

// Import custom components
import ImageGallery from "../components/product/ImageGallery";
import ProductHeader from "../components/product/ProductHeader";
import ProductSpecs from "../components/product/ProductSpecs";
import ProductVariants from "../components/product/ProductVariants";
import ProductFeatures from "../components/product/ProductFeatures";
import DeliveryInfo from "../components/product/DeliveryInfo";
import CustomizationOptions from "../components/product/CustomizationOptions";
import QuantitySelector from "../components/product/QuantitySelector";
import ProductActions from "../components/product/ProductActions";

const ProductDetail = () => {
  const { slug, productId } = useParams();
  const navigate = useNavigate();
  const { addItem, clearCart } = useCart();
  const { addToFavourites, removeFromFavourites, isFavourite } = useFavourites();
  const { toast } = useToast();

  // State management
  const [product, setProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [customizations, setCustomizations] = useState({});

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: productData, error: productError } = await supabase
          .from("products")
          .select(`*, categories (id, name, slug)`)
          .eq("id", productId)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("Product not found");
        if (productData.categories?.slug !== slug) {
          throw new Error("Product does not belong to this category");
        }

        setProduct(productData);

        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (!variantError && variantData) {
          setProductVariants(variantData);
          if (variantData.length > 0) setSelectedVariant(variantData[0]);
        }

        const images = [];
        if (productData.image_url) {
          images.push({
            id: "main",
            image_url: productData.image_url,
            alt_text: productData.title,
            display_order: 0,
          });
        }

        if (productData.additional_images && Array.isArray(productData.additional_images)) {
          productData.additional_images.forEach((url, idx) => {
            images.push({
              id: `additional-${idx}`,
              image_url: url,
              alt_text: `${productData.title} ${idx + 2}`,
              display_order: idx + 1,
            });
          });
        }

        setProductImages(images);

        if (productData.customizable_fields) {
          const fields = productData.customizable_fields;
          setCustomizations((prev) => ({
            ...prev,
            [productData.id]: {
              productId: productData.id,
              productTitle: productData.title,
              color: fields.colors?.[0] || "",
              size: fields.sizes?.[0] || "",
              text: "",
              uploadedImage: null,
            },
          }));
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (productId && slug) fetchProductData();
    else {
      setError("Missing route parameters");
      setLoading(false);
    }
  }, [productId, slug]);

  const getCurrentPrice = () => selectedVariant ? selectedVariant.price : product?.price || 0;
  const getCurrentStock = () => selectedVariant ? (selectedVariant.stock_quantity || 0) > 0 : product?.in_stock || false;
  const getStockQuantity = () => selectedVariant ? selectedVariant.stock_quantity || 0 : product?.quantity || 0;
  const minQuantity = product?.min_order_qty || 1;
  const maxQuantity = product?.max_order_qty || 50;
  const formatPrice = (priceInPaise) => (priceInPaise || 0).toLocaleString("en-IN");

  const handleVariantSelect = (variant) => setSelectedVariant(variant);
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= minQuantity && newQuantity <= maxQuantity) setQuantity(newQuantity);
  };

  const handleCustomizationChange = (field, value) => {
    if (!product?.id) return;
    setCustomizations((prev) => ({
      ...prev,
      [product.id]: {
        ...prev[product.id],
        [field]: value,
        productId: product.id,
        productTitle: product.title,
      },
    }));
  };

  // ✅ FIX CRITICAL BUG #1: Strict validation before creating cart item
  const validateCartItem = () => {
    if (!product) {
      console.error('❌ No product loaded');
      return false;
    }
    
    // ✅ CRITICAL: Must have variants if product has variants configured
    if (productVariants.length > 0 && !selectedVariant) {
      console.error('❌ Product has variants but none selected');
      toast({
        title: "Size Required",
        description: "Please select a size before adding to cart.",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
    
    // ✅ CRITICAL: Validate variant has ID
    if (selectedVariant && !selectedVariant.id) {
      console.error('❌ Selected variant missing ID:', selectedVariant);
      toast({
        title: "Invalid Size Selection",
        description: "The selected size is invalid. Please try refreshing the page.",
        variant: "destructive",
        duration: 5000,
      });
      return false;
    }
    
    // ✅ Stock validation
    if (!getCurrentStock() || getStockQuantity() < quantity) {
      toast({
        title: "Out of Stock",
        description: `Only ${getStockQuantity()} items available in stock.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const createCartItem = () => {
    // ✅ FIX CRITICAL BUG #1: Final safety check
    if (!selectedVariant?.id) {
      console.error('❌ CRITICAL: Attempted to create cart item without variant ID');
      return null;
    }
    
    const productCustomization = customizations[product.id] || {};
    return {
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      variantId: selectedVariant.id,  // ✅ GUARANTEED to exist
      name: product.title,
      price: getCurrentPrice(),
      image: product.image_url,
      quantity: quantity,
      variant: { 
        size: selectedVariant.size_display, 
        weight: selectedVariant.weight_grams 
      },
      customization: productCustomization,
    };
  };

  const handleAddToCart = async () => {
    // ✅ FIX CRITICAL BUG #1: Validate BEFORE any operations
    if (!validateCartItem()) {
      return;
    }
    
    setIsAddingToCart(true);
    try {
      const cartItem = createCartItem();
      
      if (!cartItem) {
        console.error('❌ Failed to create cart item');
        toast({
          title: "Error",
          description: "Failed to add item to cart. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // ✅ Double-check variantId exists
      if (!cartItem.variantId) {
        console.error('❌ CRITICAL: Cart item created without variantId:', cartItem);
        toast({
          title: "Configuration Error",
          description: "Unable to add item - missing size information. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      
      const success = await addItem(cartItem);
      
      if (success) {
        toast({
          title: "Added to Cart!",
          description: `${product.title} (${quantity} ${quantity > 1 ? "items" : "item"}) has been added to your cart.`,
        });
      }
    } catch (error) {
      console.error('❌ Add to cart error:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    // ✅ FIX CRITICAL BUG #1: Validate BEFORE any operations
    if (!validateCartItem()) {
      return;
    }
    
    setIsBuying(true);
    try {
      const cartItem = createCartItem();
      
      if (!cartItem || !cartItem.variantId) {
        console.error('❌ CRITICAL: Cannot proceed to checkout without variantId');
        toast({
          title: "Configuration Error",
          description: "Unable to proceed - missing size information. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      
      await clearCart();
      const success = await addItem(cartItem);
      
      if (success) {
        toast({ 
          title: "Proceeding to Checkout", 
          description: "Redirecting to checkout..." 
        });
        setTimeout(() => navigate("/checkout"), 500);
      } else {
        toast({
          title: "Error",
          description: "Failed to add item for checkout. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Buy Now error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to proceed to checkout. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleToggleFavourite = () => {
    if (!product) return;
    const action = isFavourite(product.id) ? removeFromFavourites : addToFavourites;
    action(product);
    toast({
      title: isFavourite(product.id) ? "Removed from Favourites" : "Added to Favourites",
      description: `${product.title} has been ${isFavourite(product.id) ? "removed from" : "added to"} your favourites.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product.title, text: product.description, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied!", description: "Product link has been copied to clipboard." });
    }
  };

  // Generate breadcrumbs
  const breadcrumbs = product ? [
    { name: "Home", url: "/" },
    { name: "Shop", url: "/shop" },
    { name: product.categories?.name || "Category", url: `/category/${slug}/products` },
    { name: product.title, url: `/category/${slug}/products/${productId}` },
  ] : [];

  // Generate FAQs for product
  const productFAQs = product ? [
    { question: "Is this product customizable?", answer: product.is_customizable ? "Yes, this product can be customized. Select your preferences before adding to cart." : "This product comes as shown in the images." },
    { question: "How long does delivery take?", answer: "Delivery typically takes 5-7 business days depending on your location." },
    { question: "What is the return policy?", answer: "We offer a 7-day return policy. Products must be unused and in original packaging." },
    { question: "Is bulk ordering available?", answer: "Yes! Contact us for bulk order discounts and custom quotes." },
  ] : [];

  if (loading) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-400" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
                  <div className="h-10 bg-gray-200 rounded w-full animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-48 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="py-8">
          <div className="container mx-auto px-4">
            <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-red-100 to-red-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ImageOff className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Product Not Found
              </h3>
              <p className="text-red-600 mb-6">
                {error || "Product not found"}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={() => navigate("/shop")}>
                  Browse Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const seo = getProductSEO(product, slug);

  return (
    <Layout>
      {/* SEO */}
      <SEOHead {...seo} type="product" />
      <OpenGraphTags {...seo} type="product" image={product.image_url} />
      <ProductSchema product={product} category={product.categories?.name} />
      <BreadcrumbSchema items={breadcrumbs} />
      <FAQSchema faqs={productFAQs} />

      <div className="py-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbs} className="mb-4" />

          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="lg:sticky lg:top-8 lg:self-start">
              <ImageGallery product={product} productImages={productImages} />
            </div>

            <div className="space-y-6">
              <ProductHeader 
                product={product} 
                selectedVariant={selectedVariant} 
                getCurrentPrice={getCurrentPrice} 
                getCurrentStock={getCurrentStock} 
                getStockQuantity={getStockQuantity} 
                formatPrice={formatPrice} 
              />

              {product.description && (
                <div className="prose prose-gray max-w-none bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <p className="text-gray-700 leading-relaxed text-lg m-0">
                    {product.description}
                  </p>
                </div>
              )}

              <ProductSpecs product={product} selectedVariant={selectedVariant} />
              
              {productVariants.length > 0 && (
                <ProductVariants 
                  variants={productVariants} 
                  selectedVariant={selectedVariant} 
                  onVariantSelect={handleVariantSelect} 
                />
              )}
              
              <DeliveryInfo product={product} estimatedDays={7} />
              <ProductFeatures product={product} />
              <CustomizationOptions 
                product={product} 
                customization={customizations[product.id] || {}} 
                onCustomizationChange={handleCustomizationChange} 
              />

              <div className="space-y-6">
                <QuantitySelector 
                  quantity={quantity} 
                  minQuantity={minQuantity} 
                  maxQuantity={maxQuantity} 
                  onQuantityChange={handleQuantityChange} 
                  getCurrentPrice={getCurrentPrice} 
                  formatPrice={formatPrice} 
                />
                <ProductActions 
                  product={product} 
                  selectedVariant={selectedVariant} 
                  getCurrentStock={getCurrentStock} 
                  getStockQuantity={getStockQuantity} 
                  isAddingToCart={isAddingToCart} 
                  isBuying={isBuying} 
                  isFavourite={isFavourite} 
                  onAddToCart={handleAddToCart} 
                  onBuyNow={handleBuyNow} 
                  onToggleFavourite={handleToggleFavourite} 
                  onShare={handleShare} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
