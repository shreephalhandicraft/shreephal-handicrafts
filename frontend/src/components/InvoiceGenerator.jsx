import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Loader2,
  FileText,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Hash,
  CreditCard,
  Package,
} from "lucide-react";

const InvoiceGenerator = ({ order, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generatePDF = async () => {
    try {
      setGenerating(true);

      // Dynamic imports for better bundle splitting
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;

      const invoiceElement = document.getElementById("invoice-content");

      // Capture the invoice as canvas
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight
      );

      // Download the PDF
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
  const dueDate = new Date(orderDate);
  dueDate.setDate(dueDate.getDate() + 30);

  const allItems = [...(order.items || []), ...(order.catalog_items || [])];
  const subtotal = Number(order.amount) / 1.08;
  const tax = Number(order.amount) - subtotal;

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
                    Shrifal Handicrafts
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
                    <span className="font-medium">Shrifal Handicrafts</span>
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
                      orders@shrifalhandicrafts.com
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

              {/* Mobile-first table design */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Desktop Table Header - Hidden on mobile */}
                <div className="hidden sm:block bg-gray-50 border-b border-gray-200 p-3 sm:p-4">
                  <div className="grid grid-cols-12 gap-2 lg:gap-4 text-xs sm:text-sm font-medium text-gray-900">
                    <div className="col-span-6">Item</div>
                    <div className="col-span-2 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Unit Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {allItems.map((item, index) => (
                    <div key={index} className="p-3 sm:p-4">
                      {/* Mobile Layout */}
                      <div className="block sm:hidden">
                        <div className="font-medium text-gray-900 text-sm mb-2">
                          {item.name || item.title || "Product"}
                        </div>
                        {item.customization &&
                          Object.values(item.customization).some((v) => v) && (
                            <div className="text-xs text-gray-600 mb-2">
                              Customized
                            </div>
                          )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Qty: </span>
                            <span className="font-medium">
                              {item.quantity || 1}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-600">Unit: </span>
                            <span className="font-medium">
                              ₹{Number(item.price || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-gray-600">Total: </span>
                            <span className="font-bold text-gray-900">
                              ₹
                              {Number(
                                (item.price || 0) * (item.quantity || 1)
                              ).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 lg:gap-4 items-center text-xs sm:text-sm">
                        <div className="col-span-6">
                          <div className="font-medium text-gray-900">
                            {item.name || item.title || "Product"}
                          </div>
                          {item.customization &&
                            Object.values(item.customization).some(
                              (v) => v
                            ) && (
                              <div className="text-xs text-gray-600 mt-1">
                                Customized
                              </div>
                            )}
                        </div>
                        <div className="col-span-2 text-center text-gray-700">
                          {item.quantity || 1}
                        </div>
                        <div className="col-span-2 text-right text-gray-700">
                          ₹{Number(item.price || 0).toLocaleString()}
                        </div>
                        <div className="col-span-2 text-right font-medium text-gray-900">
                          ₹
                          {Number(
                            (item.price || 0) * (item.quantity || 1)
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-6 sm:mb-8">
              <div className="w-full sm:w-full sm:max-w-xs">
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (8%):</span>
                    <span className="font-medium">₹{tax.toFixed(2)}</span>
                  </div>
                  {order.shipping_cost && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="font-medium">
                        ₹{Number(order.shipping_cost).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between text-base sm:text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        ₹{Number(order.amount).toLocaleString()}
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

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8 text-center">
              <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                <p className="font-medium">Thank you for your business!</p>
                <p className="px-2">
                  For any questions regarding this invoice, please contact us at
                  orders@shrifalhandicrafts.com
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mt-4">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="break-all">
                      orders@shrifalhandicrafts.com
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
