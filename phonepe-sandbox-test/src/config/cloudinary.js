const cloudinary = require("cloudinary").v2;
const config = require("./environment");

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
  secure: true,
});

// Predefined transformations for your products
const TRANSFORMATIONS = {
  thumbnail: "c_fill,h_150,w_150,q_auto,f_auto",
  medium: "c_fill,h_400,w_400,q_auto,f_auto",
  large: "c_fill,h_800,w_800,q_auto,f_auto",
  hero: "c_fill,h_600,w_600,q_auto,f_auto",
};

const generateImageUrl = (publicId, transformation = "medium") => {
  if (!publicId) return null;

  return cloudinary.url(publicId, {
    transformation: TRANSFORMATIONS[transformation],
  });
};

module.exports = {
  cloudinary,
  TRANSFORMATIONS,
  generateImageUrl,
};
