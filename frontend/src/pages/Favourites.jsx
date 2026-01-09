import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";

const Favourites = () => {
  const { items, removeFromFavourites } = useFavourites();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (item) => {
    addToCart(item);
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const handleRemove = (id) => {
    removeFromFavourites(id);
    toast({
      title: "Removed from Favourites",
      description: "Item has been removed from your favourites.",
    });
  };

  if (items.length === 0) {
    return (
      <Layout>
        <SEOHead
          title={PAGE_SEO.favourites.title}
          description={PAGE_SEO.favourites.description}
          keywords={PAGE_SEO.favourites.keywords}
          path={PAGE_SEO.favourites.path}
        />
        <div className="py-20">
          <div className="container mx-auto px-4 text-center">
            <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Favourites is Empty
            </h1>
            <p className="text-gray-600 mb-8">
              Start adding items to your favourites to see them here.
            </p>
            <Link to="/shop">
              <Button size="lg">Explore Products</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* SEO Metadata */}
      <SEOHead
        title={PAGE_SEO.favourites.title}
        description={PAGE_SEO.favourites.description}
        keywords={PAGE_SEO.favourites.keywords}
        path={PAGE_SEO.favourites.path}
      />

      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Favourites
              </h1>
              <p className="text-gray-600">
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </p>
            </div>
            <Link to="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="relative aspect-[4/3]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/300x225?text=No+Image";
                    }}
                  />
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all hover:scale-110"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className="bg-white/90 backdrop-blur-sm"
                    >
                      {item.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.name}
                  </h3>
                  
                  {item.rating && (
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm ml-1">{item.rating}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">
                      ₹{item.price}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleAddToCart(item)}
                    className="w-full"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Favourites;