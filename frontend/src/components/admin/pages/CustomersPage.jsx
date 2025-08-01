import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Eye,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  UserCheck,
  UserX,
  IndianRupee,
  ShoppingCart,
  RefreshCw,
  Filter,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MoreVertical,
  X,
} from "lucide-react";
import { CustomerForm } from "../forms/CustomerForm";
import { useToast } from "@/hooks/use-toast";

export function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const { toast } = useToast();

  // Fetch customers and orders from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      if (customersError) throw customersError;

      // Fetch orders to calculate customer stats
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("customer_id, amount, payment_status")
        .eq("payment_status", "completed");

      if (ordersError) throw ordersError;

      setCustomers(customersData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate customer statistics
  const getCustomerStats = (customerId) => {
    const customerOrders = orders.filter(
      (order) => order.customer_id === customerId
    );
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce(
      (sum, order) => sum + (parseFloat(order.amount) || 0),
      0
    );

    return {
      orders: totalOrders,
      spent: totalSpent,
      status: totalOrders > 0 ? "active" : "inactive",
    };
  };

  // Create customer handler
  const handleCreate = async (data) => {
    try {
      const { error } = await supabase.from("customers").insert([data]);

      if (error) throw error;

      toast({ title: "Customer created successfully" });
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error creating customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Edit customer handler
  const handleEdit = async (data) => {
    if (!editingCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .update(data)
        .eq("id", editingCustomer.id);

      if (error) throw error;

      toast({ title: "Customer updated successfully" });
      setEditingCustomer(null);
      setIsFormOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Delete customer handler
  const handleDelete = async () => {
    if (!deleteCustomer) return;

    try {
      const { error } = await supabase
        .from("customers")
        .delete()
        .eq("id", deleteCustomer.id);

      if (error) throw error;

      toast({ title: "Customer deleted successfully" });
      setDeleteCustomer(null);
      fetchData();
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error deleting customer",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // View customer details
  const viewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  // Filter customers
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = searchTerm
      ? customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      : true;

    const stats = getCustomerStats(customer.id);
    const matchesStatus =
      statusFilter === "all" || stats.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate overall stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (c) => getCustomerStats(c.id).orders > 0
  ).length;
  const inactiveCustomers = totalCustomers - activeCustomers;
  const completedProfiles = customers.filter((c) => c.profile_completed).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-base sm:text-lg font-medium">
            Loading customers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Customers
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Manage your customer relationships and data
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            onClick={fetchData}
            variant="outline"
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Total Customers
            </CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {totalCustomers}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Active Customers
            </CardTitle>
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {activeCustomers}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Have placed orders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Inactive
            </CardTitle>
            <UserX className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {inactiveCustomers}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              No orders yet
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
              Complete Profiles
            </CardTitle>
            <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold">
              {completedProfiles}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Profile completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:min-w-[200px] sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  <SelectItem value="active">Active Customers</SelectItem>
                  <SelectItem value="inactive">Inactive Customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || statusFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Active filters:
              </span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Search: "
                  {searchTerm.length > 15
                    ? searchTerm.slice(0, 15) + "..."
                    : searchTerm}
                  "
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Status: {statusFilter}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="text-base sm:text-lg">Customer Directory</span>
            <Badge
              variant="outline"
              className="self-start sm:self-center text-xs"
            >
              {filteredCustomers.length} of {totalCustomers} customers
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {statusFilter !== "all"
              ? `Showing ${statusFilter} customers`
              : "All registered customers"}
            {searchTerm && ` matching "${searchTerm}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                No customers found
              </h3>
              <p className="text-muted-foreground mb-4 text-sm">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "Get started by adding your first customer"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsFormOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredCustomers.map((customer) => {
                const stats = getCustomerStats(customer.id);
                return (
                  <div
                    key={customer.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 lg:p-6 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-all duration-200 hover:shadow-md space-y-4 lg:space-y-0"
                  >
                    {/* Customer Info */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                          {customer.name
                            ? customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                            : "CU"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <p className="font-medium text-foreground text-sm sm:text-base truncate">
                            {customer.name || "No Name"}
                          </p>
                          {customer.profile_completed && (
                            <Badge
                              variant="outline"
                              className="text-xs self-start sm:self-center"
                            >
                              Profile Complete
                            </Badge>
                          )}
                        </div>

                        {/* Contact Info - Responsive Layout */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          {customer.email && (
                            <div className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          <span>
                            Joined{" "}
                            {new Date(customer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats and Actions - Mobile Layout */}
                    <div className="flex flex-col sm:flex-row lg:flex-row items-start sm:items-center lg:items-center gap-4 lg:gap-6">
                      {/* Stats */}
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            <p className="font-medium text-foreground text-sm sm:text-base">
                              {stats.orders}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Orders
                          </p>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            <p className="font-medium text-foreground text-sm sm:text-base">
                              {stats.spent.toFixed(0)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Total Spent
                          </p>
                        </div>

                        <Badge
                          className={`text-xs ${
                            stats.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                          }`}
                        >
                          {stats.status}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewCustomer(customer)}
                          className="hover:bg-blue-50 hover:border-blue-300 flex-1 sm:flex-none text-xs"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">View</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCustomer(customer);
                            setIsFormOpen(true);
                          }}
                          className="hover:bg-green-50 hover:border-green-300 flex-1 sm:flex-none text-xs"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                          <span className="sm:hidden">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-red-50 hover:border-red-300 flex-1 sm:flex-none text-xs"
                          onClick={() => setDeleteCustomer(customer)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                          <span className="sm:hidden">Del</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl lg:text-2xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 self-start sm:self-center">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {selectedCustomer.name
                        ? selectedCustomer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                        : "CU"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">
                    {selectedCustomer.name || "Customer Details"}
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 sm:space-y-6">
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground break-words">
                          {selectedCustomer.name || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground break-all">
                          {selectedCustomer.email || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Phone</label>
                        <p className="text-sm text-muted-foreground">
                          {selectedCustomer.phone || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Profile Status
                        </label>
                        <Badge
                          variant={
                            selectedCustomer.profile_completed
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {selectedCustomer.profile_completed
                            ? "Complete"
                            : "Incomplete"}
                        </Badge>
                      </div>
                    </div>

                    {selectedCustomer.bio && (
                      <div>
                        <label className="text-sm font-medium">Bio</label>
                        <p className="text-sm text-muted-foreground mt-1 break-words">
                          {selectedCustomer.bio}
                        </p>
                      </div>
                    )}

                    {selectedCustomer.address && (
                      <div>
                        <label className="text-sm font-medium">Address</label>
                        <div className="text-sm text-muted-foreground mt-1 bg-muted p-3 rounded overflow-auto">
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {JSON.stringify(selectedCustomer.address, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">
                        Member Since
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(
                          selectedCustomer.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                      Purchase History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold">
                          {getCustomerStats(selectedCustomer.id).orders}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Orders
                        </div>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
                          <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="truncate">
                            {getCustomerStats(
                              selectedCustomer.id
                            ).spent.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total Spent
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Customer Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            setEditingCustomer(null);
          }
        }}
      >
        <DialogContent className="max-w-xs sm:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto">
          <CustomerForm
            customer={editingCustomer}
            onSubmit={editingCustomer ? handleEdit : handleCreate}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingCustomer(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCustomer}
        onOpenChange={() => setDeleteCustomer(null)}
      >
        <AlertDialogContent className="max-w-xs sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete Customer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Are you sure you want to delete "
              {deleteCustomer?.name || "this customer"}"? This action cannot be
              undone and will remove all customer data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
            >
              Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
