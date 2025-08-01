import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  Package,
  Star,
  DollarSign,
  Palette,
  Ruler,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const ProductFilters = ({
  products,
  onFilter,
  searchQuery,
  onSearchChange,
  activeFilters,
  onClearFilters,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    price: true,
    material: false,
    features: false,
    dimensions: false,
    rating: false,
  });

  // Extract unique values from products
  const [filterOptions, setFilterOptions] = useState({
    materials: [],
    features: [],
    priceRange: { min: 0, max: 10000 },
    ratings: [1, 2, 3, 4, 5],
  });

  useEffect(() => {
    if (products.length > 0) {
      // Extract materials
      const materials = [
        ...new Set(
          products
            .map((p) => p.material_type || p.material)
            .filter(Boolean)
            .map((m) => m.toLowerCase())
        ),
      ].sort();

      // Extract features
      const allFeatures = products
        .flatMap((p) => {
          if (!p.features) return [];
          if (Array.isArray(p.features)) return p.features;
          try {
            const parsed = JSON.parse(p.features);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return p.features.split(",").map((f) => f.trim());
          }
        })
        .filter(Boolean);

      const features = [...new Set(allFeatures)].sort();

      // Extract price range
      const prices = products
        .map((p) => p.price)
        .filter((price) => price && !isNaN(price))
        .map(Number);

      const minPrice = Math.min(...prices) || 0;
      const maxPrice = Math.max(...prices) || 10000;

      setFilterOptions({
        materials,
        features: features.slice(0, 10), // Limit to top 10 features
        priceRange: { min: minPrice, max: maxPrice },
        ratings: [5, 4, 3, 2, 1],
      });
    }
  }, [products]);

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const hasActiveFilters = Object.values(activeFilters).some((filter) => {
    if (Array.isArray(filter)) return filter.length > 0;
    if (typeof filter === "object" && filter !== null) {
      return Object.values(filter).some((v) => v !== null && v !== undefined);
    }
    return filter !== null && filter !== undefined && filter !== "";
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search products, materials, features..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 h-12 text-lg border-2 border-gray-300 focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="lg:hidden p-4 border-b border-gray-200">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <div className="flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(activeFilters).flat().filter(Boolean).length}
              </Badge>
            )}
          </div>
          {isOpen ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      {/* Filter Content */}
      <div className={`${isOpen ? "block" : "hidden"} lg:block`}>
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Active Filters
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-primary hover:text-primary/80"
              >
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Search query badge */}
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchQuery}"
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => onSearchChange("")}
                  />
                </Badge>
              )}

              {/* Material badges */}
              {activeFilters.materials?.map((material) => (
                <Badge
                  key={material}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {material}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      onFilter(
                        "materials",
                        activeFilters.materials.filter((m) => m !== material)
                      )
                    }
                  />
                </Badge>
              ))}

              {/* Feature badges */}
              {activeFilters.features?.map((feature) => (
                <Badge
                  key={feature}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {feature}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      onFilter(
                        "features",
                        activeFilters.features.filter((f) => f !== feature)
                      )
                    }
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Price Range Filter */}
        <Collapsible
          open={openSections.price}
          onOpenChange={() => toggleSection("price")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 border-b border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-gray-600" />
              <span className="font-medium">Price Range</span>
            </div>
            {openSections.price ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border-b border-gray-200">
            <div className="space-y-4">
              <Slider
                value={[
                  activeFilters.priceRange?.min || filterOptions.priceRange.min,
                  activeFilters.priceRange?.max || filterOptions.priceRange.max,
                ]}
                onValueChange={([min, max]) =>
                  onFilter("priceRange", { min, max })
                }
                max={filterOptions.priceRange.max}
                min={filterOptions.priceRange.min}
                step={100}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  ₹
                  {activeFilters.priceRange?.min ||
                    filterOptions.priceRange.min}
                </span>
                <span>
                  ₹
                  {activeFilters.priceRange?.max ||
                    filterOptions.priceRange.max}
                </span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Material Filter */}
        {filterOptions.materials.length > 0 && (
          <Collapsible
            open={openSections.material}
            onOpenChange={() => toggleSection("material")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 border-b border-gray-200">
              <div className="flex items-center">
                <Palette className="h-4 w-4 mr-2 text-gray-600" />
                <span className="font-medium">Material</span>
              </div>
              {openSections.material ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-b border-gray-200">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.materials.map((material) => (
                  <label
                    key={material}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        activeFilters.materials?.includes(material) || false
                      }
                      onChange={(e) => {
                        const current = activeFilters.materials || [];
                        if (e.target.checked) {
                          onFilter("materials", [...current, material]);
                        } else {
                          onFilter(
                            "materials",
                            current.filter((m) => m !== material)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm capitalize">{material}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Features Filter */}
        {filterOptions.features.length > 0 && (
          <Collapsible
            open={openSections.features}
            onOpenChange={() => toggleSection("features")}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50 border-b border-gray-200">
              <div className="flex items-center">
                <Package className="h-4 w-4 mr-2 text-gray-600" />
                <span className="font-medium">Features</span>
              </div>
              {openSections.features ? <ChevronUp /> : <ChevronDown />}
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-b border-gray-200">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {filterOptions.features.map((feature) => (
                  <label
                    key={feature}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={
                        activeFilters.features?.includes(feature) || false
                      }
                      onChange={(e) => {
                        const current = activeFilters.features || [];
                        if (e.target.checked) {
                          onFilter("features", [...current, feature]);
                        } else {
                          onFilter(
                            "features",
                            current.filter((f) => f !== feature)
                          );
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm">{feature}</span>
                  </label>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Rating Filter */}
        <Collapsible
          open={openSections.rating}
          onOpenChange={() => toggleSection("rating")}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-50">
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-2 text-gray-600" />
              <span className="font-medium">Rating</span>
            </div>
            {openSections.rating ? <ChevronUp /> : <ChevronDown />}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4">
            <div className="space-y-2">
              {filterOptions.ratings.map((rating) => (
                <label
                  key={rating}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={activeFilters.ratings?.includes(rating) || false}
                    onChange={(e) => {
                      const current = activeFilters.ratings || [];
                      if (e.target.checked) {
                        onFilter("ratings", [...current, rating]);
                      } else {
                        onFilter(
                          "ratings",
                          current.filter((r) => r !== rating)
                        );
                      }
                    }}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                    <span className="ml-2 text-sm">& up</span>
                  </div>
                </label>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
};

export default ProductFilters;
