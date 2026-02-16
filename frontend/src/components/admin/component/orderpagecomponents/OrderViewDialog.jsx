import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Receipt } from "lucide-react";
import { StatusBadge, PaymentMethodBadge } from "./OrderBadges";
import { OrderDetailsCustomer } from "./OrderDetailsCustomer";
import { OrderDetailsOrder } from "./OrderDetailsOrder";
import { OrderDetailsShipping } from "./OrderDetailsShipping";
import { OrderDetailsDelivery } from "./OrderDetailsDelivery";
import { OrderDetailsItems } from "./OrderDetailsItems";
import { OrderDetailsNotes } from "./OrderDetailsNotes";
import { formatCurrency } from "@/utils/billingUtils";

export function OrderViewDialog({ open, onOpenChange, order }) {
  if (!order) return null;

  // ✅ NO NEED TO FETCH PRODUCTS - All data is in snapshot fields!
  // The order.items already contain:
  // - product_name
  // - product_image_url  
  // - variant_sku
  // - variant_size_display
  // - base_price
  // - All other snapshot data

  console.log("Order customization_details:", order.customization_details);
  console.log("Order items:", order.items);

  // Extract billing values from order
  const subtotal = parseFloat(order.subtotal) || 0;
  const totalGST = parseFloat(order.total_gst) || 0;
  const gst5Total = parseFloat(order.gst_5_total) || 0;
  const gst18Total = parseFloat(order.gst_18_total) || 0;
  const shippingCost = parseFloat(order.shipping_cost) || 0;
  const grandTotal = parseFloat(order.grand_total) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="truncate">Order #{order.id.slice(0, 8)}</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              <StatusBadge status={order.status} />
              <PaymentMethodBadge method={order.payment_method} />
            </div>
          </DialogTitle>
          <DialogDescription>View and manage order details</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <OrderDetailsCustomer
            customer={order.customers}
            customerId={order.customer_id}
          />
          <OrderDetailsOrder order={order} />
          <OrderDetailsShipping
            shippingInfo={order.shipping_info}
            customerName={order.customers?.name || "Unknown Customer"}
          />
          <OrderDetailsDelivery deliveryInfo={order.delivery_info} />
          <OrderDetailsNotes notes={order.order_notes} />

          {/* ✅ Pass items with snapshot data - no productsCache needed */}
          <OrderDetailsItems
            items={order.items}
            customizationDetails={order.customization_details}
          />

          {/* 🆕 BILLING BREAKDOWN SECTION */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-green-200 bg-green-50/30">
              <CardHeader className="bg-green-50/50 border-b border-green-200">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-green-900">
                  <Receipt className="h-5 w-5 text-green-600" />
                  Billing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 text-sm sm:text-base">
                  {/* Subtotal */}
                  <div className="flex justify-between">
                    <span className="text-gray-700">Items Subtotal (Base)</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  <Separator className="bg-green-200" />

                  {/* GST Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-green-700">
                      <span className="font-medium">GST Breakdown:</span>
                    </div>
                    
                    {gst5Total > 0 ? (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-600">GST @5%</span>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(gst5Total)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-400">GST @5%</span>
                        <span className="text-gray-400">{formatCurrency(0)}</span>
                      </div>
                    )}

                    {gst18Total > 0 ? (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-600">GST @18%</span>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(gst18Total)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between pl-4">
                        <span className="text-gray-400">GST @18%</span>
                        <span className="text-gray-400">{formatCurrency(0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between pl-4 pt-1 border-t border-green-100">
                      <span className="font-medium text-green-700">Total GST</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(totalGST)}
                      </span>
                    </div>
                  </div>

                  <Separator className="bg-green-200" />

                  {/* Shipping */}
                  {shippingCost > 0 ? (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Shipping Charges</span>
                      <span className="font-medium text-gray-900">
                        +{formatCurrency(shippingCost)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping Charges</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                  )}

                  <Separator className="bg-green-200" />

                  {/* Grand Total */}
                  <div className="flex justify-between pt-2">
                    <span className="text-lg font-bold text-green-900">Grand Total</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>

                  {/* Verification Formula */}
                  <div className="mt-3 pt-3 border-t border-green-200 text-xs text-gray-500">
                    <p className="text-center">
                      ✓ {formatCurrency(subtotal)} + {formatCurrency(totalGST)} + {formatCurrency(shippingCost)} = {formatCurrency(grandTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
