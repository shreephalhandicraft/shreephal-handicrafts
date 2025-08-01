import { CategoryCarousel } from "./CategoryCarousel";

export const FeaturedCategoriesSection = ({ categories }) => {
  return (
    <div className="py-16 sm:py-20 lg:py-24 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <span className="text-primary font-semibold text-sm">
              ✨ Handpicked Collection
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Featured{" "}
            <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
              Categories
            </span>
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-base sm:text-lg lg:text-xl leading-relaxed">
            Discover our carefully curated collection of premium products, each
            crafted with
            <span className="text-primary font-semibold">
              {" "}
              exceptional attention to detail
            </span>{" "}
            and endless customization possibilities.
          </p>
        </div>

        {/* Categories Carousel */}
        <CategoryCarousel categories={categories} />
      </div>
    </div>
  );
};
