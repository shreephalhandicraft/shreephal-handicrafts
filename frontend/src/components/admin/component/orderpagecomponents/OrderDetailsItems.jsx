import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, AlertCircle, CheckCircle } from "lucide-react";

export function OrderDetailsItems({
  items,
  customizationDetails,
  productsCache = new Map(),
  loadingProducts = false,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No items found</p>
        </CardContent>
      </Card>
    );
  }

  // Parse customization_details if it's a string
  let customizationObj = {};
  if (typeof customizationDetails === "string") {
    try {
      customizationObj = JSON.parse(customizationDetails);
    } catch (e) {
      console.error("Invalid customizationDetails JSON", e);
      customizationObj = {};
    }
  } else if (
    typeof customizationDetails === "object" &&
    customizationDetails !== null
  ) {
    customizationObj = customizationDetails;
  }

  const rawItems = items;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          Order Items ({rawItems.length})
          {loadingProducts && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rawItems.map((item, index) => {
            // Extract the original product ID
            const originalProductId = item.productId || item.id;

            // Get product details using the original ID
            const productDetails = productsCache.get(originalProductId);

            // Use item data as primary source
            const displayName =
              item.name || productDetails?.title || "Unknown Product";
            const displayImage = item.image || productDetails?.image_url;
            const itemPrice = item.price || productDetails?.price || 0;

            // Product details from database
            const catalogNumber = productDetails?.catalog_number;
            const materialType = productDetails?.material_type;
            const weightGrams = productDetails?.weight_grams;
            const dimensions = productDetails?.dimensions;
            const thickness = productDetails?.thickness;
            const baseType = productDetails?.base_type;
            const description = productDetails?.description;

            // Find customization details using the original productId
            let customizationDetail = null;
            if (customizationObj[originalProductId]) {
              customizationDetail = customizationObj[originalProductId];
            }

            // Extract customization data
            const customizations = customizationDetail?.customizations || {};
            const customText = customizations.text
              ? customizations.text.trim()
              : "";
            const customSize = customizations.size
              ? customizations.size.trim()
              : "";
            const customColor = customizations.color
              ? customizations.color.trim()
              : "";
            const customUploadedImage = customizations.uploadedImage || null;
            const productTitle = customizationDetail?.productTitle
              ? customizationDetail.productTitle.trim()
              : "";

            const hasAnyCustomizationData =
              customText !== "" ||
              customSize !== "" ||
              customColor !== "" ||
              (customUploadedImage &&
                customUploadedImage.url &&
                customUploadedImage.url.trim() !== "") ||
              productTitle !== "";

            return (
              <div
                key={originalProductId || index}
                className="border rounded-lg p-3 sm:p-4 bg-muted/30"
              >
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 space-y-2 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {/* Product Image */}
                      {displayImage && (
                        <img
                          src={displayImage}
                          alt={displayName}
                          className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg border flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      )}

                      <div className="flex-1">
                        <h4 className="font-medium text-sm sm:text-base break-words mb-1">
                          {displayName}
                        </h4>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {catalogNumber && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              📋 {catalogNumber}
                            </Badge>
                          )}

                          {materialType && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-0.5"
                            >
                              🏗️ {materialType}
                            </Badge>
                          )}

                          {productDetails ? (
                            <Badge
                              variant="default"
                              className="text-xs px-2 py-0.5 bg-green-100 text-green-800"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Details Loaded
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="text-xs px-2 py-0.5"
                            >
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Using Item Data Only
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="self-start text-sm px-3 py-1"
                  >
                    ₹{Number(itemPrice).toLocaleString()}
                  </Badge>
                </div>

                {/* Product Description */}
                {description && (
                  <p className="text-sm text-muted-foreground mb-3 break-words bg-gray-50 p-2 rounded">
                    {description}
                  </p>
                )}

                {/* Product Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Package className="h-3 w-3 text-gray-500" />
                    <span className="font-medium">Qty:</span>
                    <span>{item.quantity || 1}</span>
                  </div>

                  {/* Variant Size */}
                  {(customSize !== "" || item.variant?.size) && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Size:</span>
                      <span>
                        {customSize !== "" ? customSize : item.variant?.size}
                      </span>
                    </div>
                  )}

                  {/* Color */}
                  {(customColor !== "" || item.color) && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Color:</span>
                      <span>
                        {customColor !== "" ? customColor : item.color}
                      </span>
                    </div>
                  )}

                  {/* Product details from DB */}
                  {materialType && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Material:</span>
                      <span>{materialType}</span>
                    </div>
                  )}

                  {weightGrams && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Weight:</span>
                      <span>{weightGrams}g</span>
                    </div>
                  )}

                  {thickness && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Thickness:</span>
                      <span>{thickness}</span>
                    </div>
                  )}

                  {baseType && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Base:</span>
                      <span>{baseType}</span>
                    </div>
                  )}

                  
                </div>

                {/* Product ID Information */}
                <div className="text-xs text-muted-foreground mb-3 p-2 bg-gray-50 rounded">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="font-medium">Product ID:</span>
                      <span className="font-mono ml-1">
                        {originalProductId}
                      </span>
                    </div>
                    {item.variantId && (
                      <div>
                        <span className="font-medium">Variant ID:</span>
                        <span className="font-mono ml-1">
                          {item.variantId.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customization Details */}
                {hasAnyCustomizationData && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-green-800 mb-2 flex items-center gap-2">
                      <span>🎨 Customization Details</span>
                    </div>

                    <div className="space-y-2">
                      {customText !== "" && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-green-700 min-w-fit">
                            Text:
                          </span>
                          <span className="break-words">{customText}</span>
                        </div>
                      )}

                      {customSize !== "" && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-700">
                            Custom Size:
                          </span>
                          <span>{customSize}</span>
                        </div>
                      )}

                      {customColor !== "" && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-green-700">
                            Custom Color:
                          </span>
                          <span>{customColor}</span>
                        </div>
                      )}

                      {productTitle !== "" && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-green-700 min-w-fit">
                            Product:
                          </span>
                          <span className="break-words">{productTitle}</span>
                        </div>
                      )}

                      {customUploadedImage?.url && (
                        <div>
                          <div className="font-medium text-green-700 mb-2">
                            📸 Uploaded Image:
                          </div>
                          <img
                            src={customUploadedImage.url}
                            alt={customUploadedImage.fileName || "Custom Image"}
                            className="max-w-full h-auto rounded-lg shadow-md border"
                            style={{ maxHeight: "200px" }}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                customUploadedImage.url
                              );
                              e.target.style.display = "none";
                            }}
                          />
                          {customUploadedImage.fileName && (
                            <p className="text-xs text-green-600 mt-1">
                              📄 File: {customUploadedImage.fileName}
                            </p>
                          )}
                        </div>
                      )}

                      {customizationDetail?.timestamp && (
                        <div className="text-xs text-green-600 pt-2 border-t border-green-200">
                          ⏰ Customized:{" "}
                          {new Date(
                            customizationDetail.timestamp
                          ).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
