import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
import {
  Package,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { InventoryForm } from "../forms/InventoryForm";
import { useToast } from "@/hooks/use-toast";

const initialInventory = [
  {
    id: 1,
    name: "Premium Trophy",
    sku: "PT-001",
    stock: 45,
    minStock: 10,
    status: "in-stock",
    lastUpdated: "2024-01-20",
  },
  {
    id: 2,
    name: "Golden Medal",
    sku: "GM-002",
    stock: 23,
    minStock: 15,
    status: "in-stock",
    lastUpdated: "2024-01-20",
  },
  {
    id: 3,
    name: "Crystal Award",
    sku: "CA-003",
    stock: 8,
    minStock: 15,
    status: "low-stock",
    lastUpdated: "2024-01-19",
  },
  {
    id: 4,
    name: "Bronze Trophy",
    sku: "BT-004",
    stock: 67,
    minStock: 20,
    status: "in-stock",
    lastUpdated: "2024-01-19",
  },
  {
    id: 5,
    name: "Silver Medal",
    sku: "SM-005",
    stock: 0,
    minStock: 10,
    status: "out-of-stock",
    lastUpdated: "2024-01-18",
  },
];

export function InventoryPage() {
  const [inventory, setInventory] = useState(initialInventory);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState();
  const [deleteItem, setDeleteItem] = useState();
  const { toast } = useToast();

  const handleCreate = (data) => {
    const newItem = {
      ...data,
      id: Math.max(...inventory.map((i) => i.id)) + 1,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    setInventory([...inventory, newItem]);
    setIsFormOpen(false);
    toast({ title: "Inventory item created successfully" });
  };

  const handleEdit = (data) => {
    if (editingItem) {
      setInventory(
        inventory.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                ...data,
                lastUpdated: new Date().toISOString().split("T")[0],
              }
            : i
        )
      );
      setEditingItem(undefined);
      toast({ title: "Inventory item updated successfully" });
    }
  };

  const handleDelete = () => {
    if (deleteItem) {
      setInventory(inventory.filter((i) => i.id !== deleteItem.id));
      setDeleteItem(undefined);
      toast({ title: "Inventory item deleted successfully" });
    }
  };

  const totalItems = inventory.reduce((sum, item) => sum + item.stock, 0);
  const lowStockItems = inventory.filter(
    (item) => item.status === "low-stock"
  ).length;
  const outOfStockItems = inventory.filter(
    (item) => item.status === "out-of-stock"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Inventory Management
          </h1>
          <p className="text-muted-foreground">
            Track and manage your product inventory
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary hover:bg-primary-hover text-primary-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalItems}
            </div>
            <p className="text-xs text-muted-foreground">Across all products</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Out of Stock
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {outOfStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Needs restocking</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">
            Inventory Status
          </CardTitle>
          <CardDescription>
            Monitor stock levels and manage inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-surface-light"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-surface-medium rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="font-medium text-foreground">{item.stock}</p>
                    <p className="text-sm text-muted-foreground">Current</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-foreground">
                      {item.minStock}
                    </p>
                    <p className="text-sm text-muted-foreground">Min Stock</p>
                  </div>
                  <Badge
                    className={
                      item.status === "in-stock"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : item.status === "low-stock"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    }
                  >
                    {item.status.replace("-", " ")}
                  </Badge>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingItem(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteItem(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen || !!editingItem}
        onOpenChange={() => {
          setIsFormOpen(false);
          setEditingItem(undefined);
        }}
      >
        <DialogContent>
          <InventoryForm
            item={editingItem}
            onSubmit={editingItem ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingItem(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteItem}
        onOpenChange={() => setDeleteItem(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
