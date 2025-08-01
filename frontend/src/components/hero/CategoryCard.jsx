import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { CategoryImage } from "./CategoryImage";

export const CategoryCard = ({ category }) => (
  <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:-translate-y-2 hover:border-primary/20">
    {/* Image/Icon */}
    <CategoryImage category={category} className="aspect-square" />

    {/* Content */}
    <div className="p-5 sm:p-6 lg:p-7">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
          {category.name}
        </h3>
        {category.featured && (
          <span className="text-xs font-bold text-primary bg-gradient-to-r from-primary/10 to-primary/20 px-3 py-1.5 rounded-full whitespace-nowrap ml-3 border border-primary/20">
            Featured
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-5 text-sm sm:text-base leading-relaxed line-clamp-2">
        Premium customizable products crafted with attention to detail
      </p>

      {/* Price and Rating Row */}
      <div className="flex items-center justify-between mb-6">
        {category.price && (
          <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            ₹{parseFloat(category.price).toFixed(0)}+
          </p>
        )}

        {category.rating && (
          <div className="flex items-center bg-gradient-to-r from-yellow-50 to-yellow-100 px-3 py-2 rounded-full border border-yellow-200">
            <span className="text-sm text-yellow-700 font-bold flex items-center">
              ⭐ {parseFloat(category.rating).toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <Link to={`/category/${category.slug}/products`}>
        <Button
          variant="outline"
          className="w-full group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary/90 group-hover:text-white group-hover:border-primary transition-all duration-500 font-semibold text-sm sm:text-base py-3 sm:py-4 rounded-2xl border-2 hover:shadow-lg hover:shadow-primary/25 transform group-hover:scale-105"
        >
          Explore {category.name}
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </Link>
    </div>
  </div>
);
