import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Edit, Trash2, Plus, Search, DollarSign } from "lucide-react";
import { PaymentForm } from "@/components/admin/forms/PaymentForm";
import { useToast } from "@/hooks/use-toast";

const initialPayments = [
  {
    id: 1,
    transactionId: "TXN-001",
    customer: "John Doe",
    amount: 299.99,
    status: "completed",
    method: "credit-card",
    date: "2024-01-20",
    description: "Gold Trophy purchase",
  },
  {
    id: 2,
    transactionId: "TXN-002",
    customer: "Jane Smith",
    amount: 159.99,
    status: "pending",
    method: "paypal",
    date: "2024-01-19",
    description: "Silver Medal order",
  },
  {
    id: 3,
    transactionId: "TXN-003",
    customer: "Bob Johnson",
    amount: 89.99,
    status: "failed",
    method: "credit-card",
    date: "2024-01-18",
    description: "Bronze Trophy",
  },
  {
    id: 4,
    transactionId: "TXN-004",
    customer: "Alice Brown",
    amount: 79.99,
    status: "completed",
    method: "bank-transfer",
    date: "2024-01-17",
    description: "Custom plaque",
  },
  {
    id: 5,
    transactionId: "TXN-005",
    customer: "Charlie Wilson",
    amount: 199.99,
    status: "refunded",
    method: "crypto",
    date: "2024-01-16",
    description: "Championship cup - returned",
  },
];

export function PaymentsPage() {
  const [payments, setPayments] = useState(initialPayments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState();
  const [deletePayment, setDeletePayment] = useState();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredPayments = payments.filter(
    (payment) =>
      payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePayment = (paymentData) => {
    const newPayment = {
      ...paymentData,
      id: Math.max(...payments.map((p) => p.id), 0) + 1,
    };
    setPayments((prev) => [...prev, newPayment]);
    setIsFormOpen(false);
    toast({
      title: "Payment created",
      description: "Payment record has been created successfully.",
    });
  };

  const handleEditPayment = (paymentData) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === paymentData.id ? paymentData : p))
    );
    setEditingPayment(undefined);
    toast({
      title: "Payment updated",
      description: "Payment record has been updated successfully.",
    });
  };

  const handleDeletePayment = (payment) => {
    setPayments((prev) => prev.filter((p) => p.id !== payment.id));
    setDeletePayment(undefined);
    toast({
      title: "Payment deleted",
      description: "Payment record has been deleted successfully.",
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getMethodBadge = (method) => {
    const labels = {
      "credit-card": "Credit Card",
      paypal: "PayPal",
      "bank-transfer": "Bank Transfer",
      crypto: "Crypto",
    };

    return <Badge variant="outline">{labels[method]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">Process and manage payments</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Payment
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Transaction ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {payment.transactionId}
                </TableCell>
                <TableCell>{payment.customer}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    {payment.amount.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                <TableCell>{getMethodBadge(payment.method)}</TableCell>
                <TableCell>
                  {new Date(payment.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {payment.description}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPayment(payment)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePayment(payment)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Payment Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Payment</DialogTitle>
          </DialogHeader>
          <PaymentForm
            onSubmit={handleCreatePayment}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Payment Dialog */}
      <Dialog
        open={!!editingPayment}
        onOpenChange={() => setEditingPayment(undefined)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          {editingPayment && (
            <PaymentForm
              payment={editingPayment}
              onSubmit={handleEditPayment}
              onCancel={() => setEditingPayment(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Payment Dialog */}
      <AlertDialog
        open={!!deletePayment}
        onOpenChange={() => setDeletePayment(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete payment "
              {deletePayment?.transactionId}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePayment && handleDeletePayment(deletePayment)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
