import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/billingUtils";
import {
  Download,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CreditCard,
} from "lucide-react";

const InvoiceGenerator = ({ order, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      setGenerating(true);

      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      const invoiceElement = document.getElementById("invoice-content");

      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);

      toast({
        title: "Success!",
        description: "Invoice downloaded successfully.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const shipping = order.shipping_info ?? {};
  const orderDate = new Date(order.created_at);

  const allItems = [...(order.items || []), ...(order.catalog_items || [])];
  
  // ✅ Use database values directly - NO RECALCULATION
  const subtotal = parseFloat(order.subtotal) || 0;
  const gst5Total = parseFloat(order.gst_5_total) || 0;
  const gst18Total = parseFloat(order.gst_18_total) || 0;
  const totalGST = parseFloat(order.total_gst) || 0;
  const shippingCost = parseFloat(order.shipping_cost) || 0;
  const grandTotal = parseFloat(order.order_total) || 0;

  console.log("📄 Invoice totals (from DB):", {
    subtotal,
    gst5Total,
    gst18Total,
    totalGST,
    shippingCost,
    grandTotal
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-full w-full max-h-[95vh] overflow-auto mx-2 sm:mx-4 sm:max-w-4xl">
        {/* Header */}
        <div className="p-3 sm:p-4 lg:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2 sticky top-0 bg-white z-10">
          <h2 className="text-base sm:text-lg lg:text-xl font-semibold">
            Invoice Preview
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={generatePDF}
              disabled={generating}
              className="px-3 sm:px-4 lg:px-6 text-sm flex-1 sm:flex-none"
              size="sm"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Generating...</span>
                  <span className="sm:hidden">Gen...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              size="sm"
              className="px-3 sm:px-4"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-2 sm:p-4 lg:p-6">
          <div
            id="invoice-content"
            className="bg-white p-3 sm:p-6 lg:p-8 font-sans"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                    Shreephal Handicrafts
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Premium Handicraft Solutions
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                  INVOICE
                </h2>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <Hash className="h-3 w-3" />
                    <span>INV-{order.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <Calendar className="h-3 w-3" />
                    <span>{orderDate.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Company & Customer Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8">
              {/* From */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">
                  From:
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <span className="font-medium">Shreephal Handicrafts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div>123 Craft Street</div>
                      <div>Artisan District, Mumbai 400001</div>
                      <div>Maharashtra, India</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                    <span className="break-all">
                      orders@shreephalhandicrafts.com
                    </span>
                  </div>
                </div>
              </div>

              {/* To */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-base sm:text-lg">
                  Bill To:
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  {(shipping.firstName || shipping.lastName) && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                      <span className="font-medium">
                        {shipping.firstName} {shipping.lastName}
                      </span>
                    </div>
                  )}
                  {shipping.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <div>{shipping.address}</div>
                        {(shipping.city ||
                          shipping.state ||
                          shipping.zipCode) && (
                          <div>
                            {shipping.city}
                            {shipping.city && shipping.state ? ", " : ""}
                            {shipping.state} {shipping.zipCode}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {shipping.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                      <span>{shipping.phone}</span>
                    </div>
                  )}
                  {shipping.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                      <span className="break-all">{shipping.email}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <div className="text-gray-600 mb-1">Order Date</div>
                  <div className="font-medium">
                    {orderDate.toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Payment Method</div>
                  <div className="font-medium capitalize">
                    {order.payment_method?.replace("_", " ") || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 mb-1">Status</div>
                  <div className="font-medium capitalize text-green-600">
                    {order.payment_status}
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 sm:mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 text-base sm:text-lg">
                Order Items
              </h3>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Desktop Header */}
                <div className="hidden sm:block bg-gray-50 border-b border-gray-200 p-3 sm:p-4">
                  <div className="grid grid-cols-12 gap-2 lg:gap-4 text-xs sm:text-sm font-medium text-gray-900">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Base Price</div>
                    <div className="col-span-2 text-right">GST</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-200">
                  {allItems.map((item, index) => {
                    // ✅ Use database values directly - NO CALCULATION
                    const quantity = item.quantity || 1;
                    const basePrice = parseFloat(item.base_price) || 0;
                    const gstRate = parseFloat(item.gst_rate) || 0;
                    const gstAmount = parseFloat(item.gst_amount) || 0;
                    const itemTotal = parseFloat(item.item_total) || 0;
                    const itemGSTTotal = gstAmount * quantity;
                    
                    return (
                      <div key={index} className="p-3 sm:p-4">
                        {/* Mobile Layout */}
                        <div className="block sm:hidden">
                          <div className="font-medium text-gray-900 text-sm mb-2">
                            {item.name || item.product_name || item.title || "Product"}
                          </div>
                          {item.customization &&
                            Object.values(item.customization).some((v) => v) && (
                              <div className="text-xs text-purple-600 mb-2">
                                🎨 Customized
                              </div>
                            )}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-600">Qty: </span>
                              <span className="font-medium">{quantity}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600">Base: </span>
                              <span className="font-medium">
                                {formatCurrency(basePrice)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">GST: </span>
                              <span className="font-medium text-orange-600">
                                {gstRate}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="font-medium text-orange-600">
                                +{formatCurrency(itemGSTTotal)}
                              </span>
                            </div>
                            <div className="col-span-2 text-right pt-2 border-t">
                              <span className="text-gray-600">Total: </span>
                              <span className="font-bold text-gray-900">
                                {formatCurrency(itemTotal)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:grid grid-cols-12 gap-2 lg:gap-4 items-center text-xs sm:text-sm">
                          <div className="col-span-5">
                            <div className="font-medium text-gray-900">
                              {item.name || item.product_name || item.title || "Product"}
                            </div>
                            {item.customization &&
                              Object.values(item.customization).some((v) => v) && (
                                <div className="text-xs text-purple-600 mt-1">
                                  🎨 Customized
                                </div>
                              )}
                          </div>
                          <div className="col-span-1 text-center text-gray-700">
                            {quantity}
                          </div>
                          <div className="col-span-2 text-right text-gray-700">
                            {formatCurrency(basePrice)}
                          </div>
                          <div className="col-span-2 text-right">
                            <div className="text-orange-600 font-medium">
                              {gstRate > 0 ? (
                                <>
                                  {gstRate}%
                                  <div className="text-xs">
                                    +{formatCurrency(itemGSTTotal)}
                                  </div>
                                </>
                              ) : (
                                <span className="text-gray-500">No GST</span>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-bold text-gray-900">
                            {formatCurrency(itemTotal)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6 sm:mb-8">
              <div className="w-full sm:w-full sm:max-w-xs">
                <div className="space-y-2 text-xs sm:text-sm bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal (Base):</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {/* GST Breakdown */}
                  {gst5Total > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>GST @5%:</span>
                      <span className="font-medium">+{formatCurrency(gst5Total)}</span>
                    </div>
                  )}
                  {gst18Total > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>GST @18%:</span>
                      <span className="font-medium">+{formatCurrency(gst18Total)}</span>
                    </div>
                  )}
                  {totalGST === 0 && (
                    <div className="flex justify-between text-gray-500">
                      <span>GST:</span>
                      <span className="font-medium">No Tax</span>
                    </div>
                  )}
                  
                  {totalGST > 0 && (
                    <div className="flex justify-between text-orange-600 font-semibold">
                      <span>Total GST:</span>
                      <span>+{formatCurrency(totalGST)}</span>
                    </div>
                  )}
                  
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">
                        {formatCurrency(shippingCost)}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-2 mt-2">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Grand Total:</span>
                      <span className="text-primary">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            {(order.upi_reference || order.transaction_id) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-6 sm:mb-8">
                <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <CreditCard className="h-4 w-4" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  {order.upi_reference && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-green-700">UPI Reference:</span>
                      <span className="font-mono text-green-900 break-all">
                        {order.upi_reference}
                      </span>
                    </div>
                  )}
                  {order.transaction_id && (
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                      <span className="text-green-700">Transaction ID:</span>
                      <span className="font-mono text-green-900 break-all">
                        {order.transaction_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {order.order_notes && (
              <div className="mb-6 sm:mb-8">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">
                  Notes:
                </h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-blue-800">
                    {order.order_notes}
                  </p>
                </div>
              </div>
            )}

            {/* GST Disclaimer */}
            <div className="mb-6 sm:mb-8 bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
              <p className="text-xs text-amber-800">
                <strong>ℹ️ GST Information:</strong> Goods and Services Tax is applied as per HSN/SAC codes. 
                Different products may have different GST rates (5%, 18%, or exempt). 
                The applicable rate is shown for each item above.
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8 text-center">
              <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                <p className="font-medium">Thank you for your business!</p>
                <p className="px-2">
                  For any questions regarding this invoice, please contact us at
                  orders@shreephalhandicrafts.com
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="break-all">
                      orders@shreephalhandicrafts.com
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;
