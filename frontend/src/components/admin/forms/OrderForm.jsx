import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function OrderForm({ order, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    customer: order?.customer || "",
    total: order?.total || 0,
    status: order?.status || "pending",
    date: order?.date || new Date().toISOString().split("T")[0],
    items: order?.items || 1,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.customer.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>{order ? "Edit Order" : "Add New Order"}</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="customer">Customer</Label>
          <Input
            id="customer"
            value={formData.customer}
            onChange={(e) =>
              setFormData({ ...formData, customer: e.target.value })
            }
            placeholder="Customer name"
            required
          />
        </div>

        <div>
          <Label htmlFor="total">Total</Label>
          <Input
            id="total"
            type="number"
            min="0"
            step="0.01"
            value={formData.total}
            onChange={(e) =>
              setFormData({
                ...formData,
                total: parseFloat(e.target.value) || 0,
              })
            }
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="items">Items</Label>
          <Input
            id="items"
            type="number"
            min="1"
            value={formData.items}
            onChange={(e) =>
              setFormData({ ...formData, items: parseInt(e.target.value) || 1 })
            }
            placeholder="1"
          />
        </div>

        <div>
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">{order ? "Update" : "Create"}</Button>
        </div>
      </form>
    </div>
  );
}
