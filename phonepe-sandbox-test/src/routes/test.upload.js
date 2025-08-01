const express = require("express");
const router = express.Router();
const { generateImageVariations } = require("../lib/cloudinary");

router.get("/test-variations/:publicId", (req, res) => {
  try {
    const { publicId } = req.params;
    const variations = generateImageVariations(publicId);
    res.json({ success: true, variations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
