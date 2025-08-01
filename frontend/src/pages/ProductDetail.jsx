import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Package, ImageOff } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

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
  const { addToFavourites, removeFromFavourites, isFavourite } =
    useFavourites();
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

  // ✅ FIXED: Use only the new customizations state
  const [customizations, setCustomizations] = useState({});

  // Fetch product data
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch main product
        const { data: productData, error: productError } = await supabase
          .from("products")
          .select(
            `
            *,
            categories (
              id,
              name,
              slug
            )
          `
          )
          .eq("id", productId)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("Product not found");

        // Verify category slug matches
        if (productData.categories?.slug !== slug) {
          throw new Error("Product does not belong to this category");
        }

        setProduct(productData);

        // Fetch product variants
        const { data: variantData, error: variantError } = await supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("is_active", true)
          .order("price", { ascending: true });

        if (!variantError && variantData) {
          setProductVariants(variantData);
          if (variantData.length > 0) {
            setSelectedVariant(variantData[0]);
          }
        }

        // Process product images
        const images = [];
        if (productData.image_url) {
          images.push({
            id: "main",
            image_url: productData.image_url,
            alt_text: productData.title,
            display_order: 0,
          });
        }

        // Add additional images if they exist
        if (
          productData.additional_images &&
          Array.isArray(productData.additional_images)
        ) {
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

        // ✅ FIXED: Set customization defaults using the new state structure
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

    if (productId && slug) {
      fetchProductData();
    } else {
      setError("Missing route parameters");
      setLoading(false);
    }
  }, [productId, slug]);

  // Helper functions
  const getCurrentPrice = () => {
    return selectedVariant ? selectedVariant.price : product?.price || 0;
  };

  const getCurrentStock = () => {
    if (selectedVariant) {
      return (selectedVariant.stock_quantity || 0) > 0;
    }
    return product?.in_stock || false;
  };

  const getStockQuantity = () => {
    if (selectedVariant) {
      return selectedVariant.stock_quantity || 0;
    }
    return product?.quantity || 0;
  };

  const minQuantity = product?.min_order_qty || 1;
  const maxQuantity = product?.max_order_qty || 50;

  const formatPrice = (priceInPaise) =>
    ((priceInPaise || 0) / 100).toLocaleString("en-IN");

  // Action handlers
  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= minQuantity && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // ✅ FIXED: Proper customization change handler
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

  // ✅ FIXED: Create cart item with proper customization data
  const createCartItem = () => {
    const productCustomization = customizations[product.id] || {};

    return {
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.title,
      price: getCurrentPrice() / 100,
      image: product.image_url,
      quantity: quantity,
      variant: selectedVariant
        ? {
            size: selectedVariant.size_code,
            weight: selectedVariant.weight_grams,
          }
        : null,
      customization: productCustomization,
    };
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setIsAddingToCart(true);
    try {
      const cartItem = createCartItem();
      addItem(cartItem);

      toast({
        title: "Added to Cart!",
        description: `${product.title} (${quantity} ${
          quantity > 1 ? "items" : "item"
        }) has been added to your cart.`,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    setIsBuying(true);
    try {
      await clearCart();
      const cartItem = createCartItem();
      addItem(cartItem);

      toast({
        title: "Proceeding to Checkout",
        description: "Redirecting to checkout...",
      });

      setTimeout(() => navigate("/checkout"), 500);
    } catch (error) {
      console.error("Buy Now error:", error);
      toast({
        title: "Error",
        description: "Failed to proceed to checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBuying(false);
    }
  };

  const handleToggleFavourite = () => {
    if (!product) return;

    const action = isFavourite(product.id)
      ? removeFromFavourites
      : addToFavourites;
    action(product);

    toast({
      title: isFavourite(product.id)
        ? "Removed from Favourites"
        : "Added to Favourites",
      description: `${product.title} has been ${
        isFavourite(product.id) ? "removed from" : "added to"
      } your favourites.`,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Product link has been copied to clipboard.",
      });
    }
  };

  // Loading state
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
                    <div
                      key={i}
                      className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                    />
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

  // Error state
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

  return (
    <Layout>
      <div className="py-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <ImageGallery product={product} productImages={productImages} />
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Header Section */}
              <ProductHeader
                product={product}
                selectedVariant={selectedVariant}
                getCurrentPrice={getCurrentPrice}
                getCurrentStock={getCurrentStock}
                getStockQuantity={getStockQuantity}
                formatPrice={formatPrice}
              />

              {/* Description */}
              {product.description && (
                <div className="prose prose-gray max-w-none bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <p className="text-gray-700 leading-relaxed text-lg m-0">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Product Specifications */}
              <ProductSpecs
                product={product}
                selectedVariant={selectedVariant}
              />

              {/* Product Variants */}
              {productVariants.length > 0 && (
                <ProductVariants
                  variants={productVariants}
                  selectedVariant={selectedVariant}
                  onVariantSelect={handleVariantSelect}
                />
              )}

              {/* Delivery Information */}
              <DeliveryInfo product={product} estimatedDays={7} />

              {/* Product Features */}
              <ProductFeatures product={product} />

              {/* ✅ FIXED: Customization Options with correct props */}
              <CustomizationOptions
                product={product}
                customization={customizations[product.id] || {}}
                onCustomizationChange={handleCustomizationChange}
              />

              {/* Quantity Selector & Actions */}
              <div className="space-y-6">
                {/* Quantity Selector */}
                <QuantitySelector
                  quantity={quantity}
                  minQuantity={minQuantity}
                  maxQuantity={maxQuantity}
                  onQuantityChange={handleQuantityChange}
                  getCurrentPrice={getCurrentPrice}
                  formatPrice={formatPrice}
                />

                {/* Product Actions */}
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
