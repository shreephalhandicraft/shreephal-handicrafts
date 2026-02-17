import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, CheckCircle, ImageOff, Ruler, Palette } from "lucide-react";

export function OrderDetailsItems({
  items,
  customizationDetails,
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

  // ✅ Parse customization_details (order-level customization)
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
          <Package className="h-5 w-5 text-primary" />
          Order Items ({rawItems.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rawItems.map((item, index) => {
            console.log('Order item data:', item); // Debug log

            // ✅ Extract the product ID
            const originalProductId = item.productId || item.product_id || item.id;

            // ✅ USE SNAPSHOT DATA DIRECTLY - No database lookup needed!
            const displayName = item.product_name || item.name || "Product Unavailable";
            
            // ✅ FIX: Handle multiple image field formats
            const displayImage = 
              item.product_image_url || 
              item.product_image || 
              item.image ||
              null;
            
            const itemPrice = item.unit_price_with_gst || item.price || item.base_price || 0;
            const catalogNumber = item.catalog_number || item.product_catalog_number;
            
            // 🎯 CRITICAL FIX: Properly parse variant_size_display which can be:
            // 1. A string containing JSON: '{"id":"...","sizeDisplay":"10\"","sku":"..."}'
            // 2. An already parsed object: {id: "...", sizeDisplay: "10\"", sku: "..."}
            // 3. A simple string: "10\""
            let itemSize = '';
            const sizeData = item.size_display || item.variant_size_display;
            
            console.log('Raw sizeData:', sizeData, 'Type:', typeof sizeData);
            
            if (!sizeData) {
              // No size data available
              itemSize = '';
            } else if (typeof sizeData === 'string') {
              // Check if it's a JSON string
              if (sizeData.trim().startsWith('{') || sizeData.trim().startsWith('[')) {
                try {
                  const parsed = JSON.parse(sizeData);
                  // Extract sizeDisplay from parsed object
                  itemSize = parsed.sizeDisplay || parsed.size_display || '';
                  console.log('Parsed size from JSON string:', itemSize);
                } catch (e) {
                  console.error('Failed to parse size JSON:', e);
                  // If parsing fails, use the string as-is
                  itemSize = sizeData;
                }
              } else {
                // Plain string, use directly
                itemSize = sizeData;
              }
            } else if (typeof sizeData === 'object' && sizeData !== null) {
              // Already an object, extract sizeDisplay
              itemSize = sizeData.sizeDisplay || sizeData.size_display || '';
              console.log('Extracted size from object:', itemSize);
            }

            // ✅ CUSTOMIZATION LOGIC: Check BOTH sources
            // 1. Item-level customization_data (from order_items.customization_data JSONB)
            let itemCustomization = null;
            if (item.customization_data) {
              if (typeof item.customization_data === 'string') {
                try {
                  itemCustomization = JSON.parse(item.customization_data);
                } catch (e) {
                  console.error('Failed to parse item customization_data:', e);
                }
              } else if (typeof item.customization_data === 'object') {
                itemCustomization = item.customization_data;
              }
            }

            // 2. Order-level customization details (from orders.customization_details JSONB)
            let orderCustomization = null;
            if (customizationObj[originalProductId]) {
              orderCustomization = customizationObj[originalProductId];
            }

            // ✅ Merge customization from both sources (item-level takes priority)
            const finalCustomization = itemCustomization || orderCustomization;

            // Extract customization fields
            let customText = '';
            let customSize = '';
            let customColor = '';
            let customUploadedImage = null;
            let productTitle = '';
            let customTimestamp = null;

            if (finalCustomization) {
              // Handle different customization structures
              const customizations = finalCustomization.customizations || finalCustomization || {};
              
              customText = customizations.text?.trim() || '';
              customSize = customizations.size?.trim() || '';
              customColor = customizations.color?.trim() || '';
              customUploadedImage = customizations.uploadedImage || null;
              productTitle = finalCustomization.productTitle?.trim() || customizations.productTitle?.trim() || '';
              customTimestamp = finalCustomization.timestamp || customizations.timestamp;
            }

            const hasAnyCustomizationData =
              customText !== '' ||
              customSize !== '' ||
              customColor !== '' ||
              (customUploadedImage?.url && customUploadedImage.url.trim() !== '') ||
              productTitle !== '';

            return (
              <div
                key={item.item_id || originalProductId || index}
                className="border-2 rounded-xl p-4 sm:p-5 bg-gradient-to-br from-white to-gray-50 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Product Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      {/* 🎯 IMPROVED: Larger Product Image with better styling */}
                      {displayImage ? (
                        <div className="relative group">
                          <img
                            src={displayImage}
                            alt={displayName}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border-2 border-gray-200 flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              console.error('Failed to load image:', displayImage);
                              e.target.style.display = "none";
                              // Show placeholder
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        </div>
                      ) : null}
                      
                      {/* ✅ Image placeholder for missing images */}
                      {!displayImage && (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <ImageOff className="h-8 w-8 text-gray-400" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-base sm:text-lg text-gray-900 break-words mb-2">
                          {displayName}
                        </h4>

                        {/* Status Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {catalogNumber && (
                            <Badge
                              variant="secondary"
                              className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200"
                            >
                              📋 {catalogNumber}
                            </Badge>
                          )}

                          <Badge
                            variant="default"
                            className="text-xs px-2.5 py-1 bg-green-50 text-green-700 border border-green-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Snapshot
                          </Badge>

                          {/* ✅ Customization Indicator */}
                          {hasAnyCustomizationData && (
                            <Badge
                              variant="default"
                              className="text-xs px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200"
                            >
                              <Palette className="h-3 w-3 mr-1" />
                              Custom
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="self-start text-base sm:text-lg px-4 py-2 bg-white font-semibold border-2"
                  >
                    ₹{Number(itemPrice).toLocaleString('en-IN')}
                  </Badge>
                </div>

                {/* 🎯 FIXED: Product Information Grid - Now properly displays only size value */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm bg-white rounded-lg p-3 border">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    <span className="font-medium text-gray-700">Qty:</span>
                    <span className="font-semibold text-gray-900">{item.quantity || 1}</span>
                  </div>

                  {/* 🎯 FIXED: Show only size number - no more JSON display */}
                  {itemSize && (
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-700">Size:</span>
                      <Badge variant="outline" className="font-semibold bg-blue-50 text-blue-700 border-blue-200">
                        {itemSize}
                      </Badge>
                    </div>
                  )}

                  {/* GST Rate */}
                  {item.gst_rate && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-700">GST:</span>
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {item.gst_rate}%
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Item Total */}
                {item.item_total && (
                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Item Total:</span>
                    <span className="text-lg font-bold text-green-600">
                      ₹{Number(item.item_total).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {/* ✅ IMPROVED: Customization Details with better styling */}
                {hasAnyCustomizationData && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm">
                    <div className="font-semibold text-orange-800 mb-3 flex items-center gap-2 text-base">
                      <Palette className="h-5 w-5" />
                      <span>Customization Details</span>
                      {itemCustomization && (
                        <Badge variant="outline" className="text-xs bg-white border-orange-300">
                          Item Data
                        </Badge>
                      )}
                      {!itemCustomization && orderCustomization && (
                        <Badge variant="outline" className="text-xs bg-white border-orange-300">
                          Order Data
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      {productTitle !== "" && (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="font-semibold text-orange-700 block mb-1 uppercase text-xs">
                            Product
                          </span>
                          <span className="text-gray-900">{productTitle}</span>
                        </div>
                      )}

                      {customText !== "" && (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="font-semibold text-orange-700 block mb-1 uppercase text-xs">
                            Custom Text
                          </span>
                          <span className="text-gray-900 break-words">{customText}</span>
                        </div>
                      )}

                      {customSize !== "" && (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="font-semibold text-orange-700 block mb-1 uppercase text-xs">
                            Custom Size
                          </span>
                          <span className="text-gray-900">{customSize}</span>
                        </div>
                      )}

                      {customColor !== "" && (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="font-semibold text-orange-700 block mb-1 uppercase text-xs">
                            Custom Color
                          </span>
                          <span className="text-gray-900">{customColor}</span>
                        </div>
                      )}

                      {customUploadedImage?.url && (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="font-semibold text-orange-700 block mb-2 uppercase text-xs">
                            📸 Uploaded Image
                          </span>
                          <img
                            src={customUploadedImage.url}
                            alt={customUploadedImage.fileName || "Custom Image"}
                            className="max-w-full h-auto rounded-lg shadow-md border-2 border-orange-100"
                            style={{ maxHeight: "300px" }}
                            onError={(e) => {
                              console.error(
                                "Failed to load image:",
                                customUploadedImage.url
                              );
                              e.target.style.display = "none";
                            }}
                          />
                          {customUploadedImage.fileName && (
                            <p className="text-xs text-orange-600 mt-2 font-medium">
                              📄 {customUploadedImage.fileName}
                            </p>
                          )}
                        </div>
                      )}

                      {customTimestamp && (
                        <div className="text-xs text-orange-600 pt-2 border-t border-orange-200 flex items-center gap-1">
                          <span>⏰</span>
                          <span>Customized: {new Date(customTimestamp).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {/* ✅ Show production notes if available */}
                      {item.production_notes && (
                        <div className="bg-white rounded-lg p-3 border border-orange-200">
                          <span className="font-semibold text-orange-700 block mb-1 uppercase text-xs">
                            📝 Production Notes
                          </span>
                          <span className="text-gray-900 break-words text-sm">{item.production_notes}</span>
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
