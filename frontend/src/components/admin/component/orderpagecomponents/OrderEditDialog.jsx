import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OrderEditDialog({ open, onOpenChange, order, onSave }) {
  if (!order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updates = {
      status: formData.get("status"),
      payment_status: formData.get("payment_status"),
      production_status: formData.get("production_status"),
      order_notes: formData.get("order_notes"),
    };

    // Add delivery info if provided
    const deliveryDate = formData.get("delivery_date");
    const deliveryTime = formData.get("delivery_time");
    if (deliveryDate || deliveryTime) {
      updates.delivery_info = {
        ...order.delivery_info,
        estimated_date: deliveryDate,
        estimated_time: deliveryTime,
      };
    }

    onSave(order.id, updates);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Edit Order #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status" className="text-sm">
                Order Status
              </Label>
              <Select
                name="status"
                defaultValue={order.status}
                aria-label="Order Status"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="payment_status" className="text-sm">
                Payment Status
              </Label>
              <Select
                name="payment_status"
                defaultValue={order.payment_status}
                aria-label="Payment Status"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="production_status" className="text-sm">
              Production Status
            </Label>
            <Select
              name="production_status"
              defaultValue={order.production_status}
              aria-label="Production Status"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="quality_check">Quality Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delivery_date" className="text-sm">
                Delivery Date
              </Label>
              <Input
                name="delivery_date"
                type="date"
                defaultValue={order.delivery_info?.estimated_date || ""}
                aria-label="Delivery Date"
              />
            </div>

            <div>
              <Label htmlFor="delivery_time" className="text-sm">
                Delivery Time
              </Label>
              <Input
                name="delivery_time"
                type="time"
                defaultValue={order.delivery_info?.estimated_time || ""}
                aria-label="Delivery Time"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="order_notes" className="text-sm">
              Order Notes
            </Label>
            <Textarea
              name="order_notes"
              placeholder="Add notes about this order..."
              defaultValue={order.order_notes || ""}
              className="min-h-[80px]"
              aria-label="Order Notes"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              aria-label="Save Changes"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
