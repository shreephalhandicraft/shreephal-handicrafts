// utils/orderUtils.js

export const ORDERS_PER_PAGE = 50;

export const FILTER_OPTIONS = [
  { key: "all", label: "All Orders", icon: "Package" },
  { key: "pending", label: "Pending", icon: "Clock" },
  { key: "confirmed", label: "Confirmed", icon: "CheckCircle" },
  { key: "cod", label: "COD Orders", icon: "Banknote" },
  { key: "paynow_paid", label: "PayNow Paid", icon: "CreditCard" },
];

export const STATUS_CONFIG = {
  pending: {
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    icon: "Clock",
  },
  confirmed: {
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    icon: "CheckCircle",
  },
  processing: {
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    icon: "Package",
  },
  shipped: {
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400",
    icon: "Truck",
  },
  delivered: {
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    icon: "CheckCircle",
  },
  rejected: {
    color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    icon: "XCircle",
  },
};

export const PAYMENT_STATUS_CONFIG = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
};

// Format shipping info for display
export const formatShippingInfo = (shippingInfo) => {
  if (!shippingInfo || typeof shippingInfo !== "object") {
    return {
      component: "NoShippingInfo",
      message: "No shipping information available",
    };
  }

  return {
    component: "ShippingInfo",
    data: {
      address: shippingInfo.address ? String(shippingInfo.address) : null,
      city: shippingInfo.city ? String(shippingInfo.city) : null,
      state: shippingInfo.state ? String(shippingInfo.state) : null,
      pincode: shippingInfo.pincode ? String(shippingInfo.pincode) : null,
      phone: shippingInfo.phone ? String(shippingInfo.phone) : null,
    },
  };
};

// Format order items for display
export const formatOrderItems = (items) => {
  if (!items) {
    return {
      component: "NoItems",
      message: "No items available",
    };
  }

  let parsedItems = items;
  if (typeof items === "string") {
    try {
      parsedItems = JSON.parse(items);
    } catch (e) {
      console.error("Failed to parse items:", e);
      return {
        component: "InvalidItems",
        message: "Invalid items data",
      };
    }
  }

  if (!Array.isArray(parsedItems)) {
    return {
      component: "NoItems",
      message: "No items available",
    };
  }

  return {
    component: "ItemsList",
    data: parsedItems.map((item, index) => ({
      id: index,
      name: String(item.name || item.title || `Item ${index + 1}`),
      description: item.description ? String(item.description) : null,
      price: String(item.price || item.amount || 0),
      quantity: item.quantity ? String(item.quantity) : null,
      size: item.size ? String(item.size) : null,
      color: item.color ? String(item.color) : null,
      material: item.material ? String(item.material) : null,
      customization: item.customization ? String(item.customization) : null,
    })),
  };
};

// Apply order filters
export const applyOrderFilter = (orders, filterKey) => {
  switch (filterKey) {
    case "pending":
      return orders.filter((order) => order.status === "pending");
    case "confirmed":
      return orders.filter((order) => order.status === "confirmed");
    case "cod":
      return orders.filter((order) => order.payment_method === "COD");
    case "paynow_paid":
      return orders.filter(
        (order) =>
          order.payment_method === "PayNow" &&
          order.payment_status === "completed"
      );
    default:
      return orders;
  }
};

// Calculate order statistics
export const calculateOrderStats = (orders) => {
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const codOrders = orders.filter((o) => o.payment_method === "COD").length;
  const revenue = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

  return {
    total,
    pending,
    codOrders,
    revenue: revenue.toLocaleString(),
  };
};
