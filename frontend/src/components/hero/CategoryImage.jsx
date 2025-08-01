import { useEffect, useState } from "react";
import { Award, Image, Key, Calendar, Package } from "lucide-react";

// Icon mapping
const iconMap = {
  trophies: Award,
  "photo-frames": Image,
  "key-holders": Key,
  calendars: Calendar,
  default: Package,
};

export const CategoryImage = ({ category, className }) => {
  const [imageState, setImageState] = useState("loading");
  const [currentImageUrl, setCurrentImageUrl] = useState(null);

  const getCloudinaryImageUrl = (imageUrl, transformation = "medium") => {
    if (!imageUrl) return null;

    if (imageUrl.includes("cloudinary.com")) {
      const publicIdMatch = imageUrl.match(
        /\/([^\/]+)\.(jpg|jpeg|png|webp|auto)$/i
      );
      if (publicIdMatch) {
        const publicId = publicIdMatch[1];
        const baseUrl =
        //   process.env.REACT_APP_CLOUDINARY_BASE_URL ||
        //   import.meta.env.VITE_CLOUDINARY_BASE_URL ||
          "https://res.cloudinary.com/Shrifal-Handicraft/image/upload";

        const transformations = {
          thumbnail: "c_fill,h_200,q_auto,w_200,f_auto",
          medium: "c_fill,h_400,q_auto,w_400,f_auto",
          large: "c_fill,h_600,q_auto,w_600,f_auto",
          square: "c_fill,h_300,q_auto,w_300,f_auto",
          original: "q_auto,f_auto",
        };

        return `${baseUrl}/${
          transformations[transformation] || transformations.square
        }/${publicId}`;
      }
    }
    return imageUrl;
  };

  const IconComponent = iconMap[category.slug] || iconMap.default;

  useEffect(() => {
    if (category.image) {
      const optimizedUrl = getCloudinaryImageUrl(category.image, "square");
      setCurrentImageUrl(optimizedUrl);
      setImageState("loading");
    } else {
      setImageState("no-image");
    }
  }, [category.image]);

  const handleImageLoad = () => setImageState("loaded");

  const handleImageError = () => {
    if (currentImageUrl !== category.image && category.image) {
      setCurrentImageUrl(category.image);
    } else {
      setImageState("error");
    }
  };

  if (imageState === "no-image" || imageState === "error") {
    return (
      <div
        className={`${className} bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 flex flex-col items-center justify-center group-hover:from-primary/20 group-hover:via-primary/10 group-hover:to-primary/20 transition-all duration-500`}
      >
        <IconComponent className="h-12 w-12 sm:h-16 sm:w-16 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-xs text-primary/70 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-center px-2">
          {category.name}
        </span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden group`}>
      {imageState === "loading" && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
          <IconComponent className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        </div>
      )}

      {currentImageUrl && (
        <img
          src={currentImageUrl}
          alt={category.name}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
            imageState === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {imageState === "loaded" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end justify-center pb-4">
          <div className="text-center">
            <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white mx-auto mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500" />
            <span className="text-white text-xs sm:text-sm font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
              {category.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
