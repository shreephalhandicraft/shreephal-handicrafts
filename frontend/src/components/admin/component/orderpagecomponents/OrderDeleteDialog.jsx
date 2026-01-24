import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Package, User, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrderDeleteDialog({ open, onOpenChange, order, onConfirm }) {
  if (!order) return null;

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const orderTotal = order.order_total || order.amount || 0;
  const itemCount = order.items?.length || 0;
  const customerName = order.customer_name || order.customers?.name || 'Unknown Customer';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xs sm:max-w-lg">
        <AlertDialogHeader>
          {/* ✅ Warning Icon */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-base sm:text-lg text-left">
                Delete Order?
              </AlertDialogTitle>
            </div>
          </div>

          {/* ✅ Order Details Box */}
          <div className="bg-surface-light border border-border rounded-lg p-4 space-y-2 my-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono font-semibold text-foreground">
                #{order.id?.slice(0, 8)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{customerName}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{formatPrice(orderTotal)}</span>
            </div>
          </div>

          {/* ✅ Warning Message */}
          <AlertDialogDescription className="text-sm text-left space-y-2">
            <p className="font-medium text-destructive">
              This action cannot be undone.
            </p>
            <p>
              Deleting this order will permanently remove:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Order record and all details</li>
              <li>Order items and customization data</li>
              <li>Transaction and payment information</li>
              <li>Associated shipping details</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel 
            className="w-full sm:w-auto" 
            aria-label="Cancel"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(
              "bg-destructive text-destructive-foreground hover:bg-destructive/90",
              "w-full sm:w-auto font-medium"
            )}
            aria-label="Delete Order Permanently"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
