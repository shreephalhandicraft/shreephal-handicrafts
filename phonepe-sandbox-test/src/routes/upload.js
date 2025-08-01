const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for images
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "shrifal-handicrafts/images",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    public_id: (req, file) => `${uuidv4()}-${Date.now()}`,
    resource_type: "auto",
  },
});

// File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, GIF, WebP) are allowed"), false);
  }
};

// Multer configuration for image upload
const imageUpload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5, // Maximum 5 files at once
  },
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image
 * @access  Public
 */
router.post("/image", imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    console.log("Image uploaded successfully:", req.file.originalname);

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: req.file.path, // Cloudinary URL
        cloudinaryPublicId: req.file.filename,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload image",
    });
  }
});

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images
 * @access  Public
 */
router.post("/images", imageUpload.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files uploaded",
      });
    }

    const uploadedImages = req.files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      url: file.path, // Cloudinary URL
      cloudinaryPublicId: file.filename,
      mimetype: file.mimetype,
    }));

    console.log(`${req.files.length} images uploaded successfully`);

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: uploadedImages,
    });
  } catch (error) {
    console.error("Multiple images upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
});

/**
 * @route   DELETE /api/upload/image/:publicId
 * @desc    Delete image from Cloudinary
 * @access  Public
 */
router.delete("/image/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log("Image deleted successfully:", publicId);
      res.json({
        success: true,
        message: "Image deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Image not found or already deleted",
      });
    }
  } catch (error) {
    console.error("Image delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete image",
    });
  }
});

// Add this to your existing upload router

/**
 * @route   POST /api/upload/customization-image
 * @desc    Upload customization image
 * @access  Public
 */
router.post("/customization-image", imageUpload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded",
      });
    }

    const { productId } = req.body;

    console.log("Customization image uploaded successfully:", req.file.originalname);

    res.json({
      success: true,
      message: "Customization image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: req.file.path, // Cloudinary URL
        cloudinaryPublicId: req.file.filename,
        mimetype: req.file.mimetype,
        productId: productId,
      },
    });
  } catch (error) {
    console.error("Customization image upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload customization image",
    });
  }
});


// Error handler for multer errors
router.use((error, req, res, next) => {
  console.log("Upload error:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 5 files.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }
  }

  // Handle custom file type errors
  if (error && error.message && error.message.includes("Only image files")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Handle empty or undefined errors
  if (
    !error ||
    (typeof error === "object" && Object.keys(error).length === 0)
  ) {
    return res.status(500).json({
      success: false,
      message: "Unknown upload error occurred",
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

module.exports = router;
