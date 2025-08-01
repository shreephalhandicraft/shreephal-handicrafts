import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Award, ArrowRight } from "lucide-react";

export const ResponsiveBanner = () => {
  return (
    <div className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] xl:h-[85vh] w-full overflow-hidden">
      {/* Mobile Banner (up to md) */}
      <picture className="absolute inset-0">
        <source media="(max-width: 767px)" srcSet="/banner-hero.jpg" />
        <source
          media="(min-width: 768px) and (max-width: 1023px)"
          srcSet="/banner-hero.jpg"
        />
        <source media="(min-width: 1024px)" srcSet="/banner-hero.jpg" />
        <img
          src="/banner-hero.jpg"
          alt="Celebrate Your Achievements"
          className="w-full h-full object-cover object-center"
        />
      </picture>

      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60"></div>

      {/* Animated particles background (optional premium effect) */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-2000"></div>
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-white rounded-full animate-pulse delay-3000"></div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-4 sm:px-6 lg:px-8 text-center z-10">
        {/* Badge */}
        <div className="mb-4 sm:mb-6">
          <span className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30 text-white">
            ✨ Premium Handcrafted Excellence
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold drop-shadow-2xl leading-tight mb-4 sm:mb-6 max-w-4xl">
          <span className="bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent">
            Celebrate Your Achievements
          </span>
          <br />
          <span className="text-yellow-300 drop-shadow-lg">in Style</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-2 sm:mt-4 text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl text-center drop-shadow-xl leading-relaxed text-gray-100 font-light">
          Unique trophies and custom gifts crafted with precision for your most
          <span className="text-yellow-300 font-medium">
            {" "}
            memorable moments
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 mt-8 sm:mt-10 lg:mt-12 w-full sm:w-auto">
          <Link to="/shop" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-sm sm:text-base lg:text-lg py-3 sm:py-4 lg:py-5 px-6 sm:px-8 lg:px-10 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-primary/25 transform hover:-translate-y-1 transition-all duration-300 font-semibold"
            >
              <span>Shop Now</span>
              <ArrowRight className="ml-2 h-4 w-4 lg:h-5 lg:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/about" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white hover:text-gray-900 text-sm sm:text-base lg:text-lg py-3 sm:py-4 lg:py-5 px-6 sm:px-8 lg:px-10 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
            >
              Learn More
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 mt-8 sm:mt-12 text-white/80">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="text-yellow-400 text-lg">
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm font-medium ml-2">
              5000+ Happy Customers
            </span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-white/30"></div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-medium">
              Premium Quality Guaranteed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
