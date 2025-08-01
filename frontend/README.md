import { Toaster } from "@/components/ui/toaster"; 
import { Toaster as Sonner } from "@/components/ui/sonner"; 
import { TooltipProvider } from "@/components/ui/tooltip"; 
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; 
import { BrowserRouter, Routes, Route } from "react-router-dom"; 
import { CartProvider } from "@/contexts/CartContext"; 
import { AuthProvider } from "@/contexts/AuthContext"; 
import { FavouritesProvider } from "@/contexts/FavouritesContext"; 

// Public Routes - Accessible to everyone
import Index from "./pages/Index"; 
import Shop from "./pages/Shop"; 
import Category from "./pages/Category"; 
import ProductDetail from "./pages/ProductDetail"; 
import About from "./pages/About"; 
import Contact from "./pages/Contact"; 
import TermsConditions from "./pages/TermsConditions"; 
import PrivacyPolicy from "./pages/PrivacyPolicy"; 
import NotFound from "./pages/NotFound"; 

// Authentication Routes - For login/register flow
import Login from "./pages/Login"; 
import Register from "./pages/Register"; 
import VerifyPhone from "./pages/VerifyPhone"; 
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Protected User Routes - Requires authentication
import Cart from "./pages/Cart"; 
import Checkout from "./pages/Checkout"; 
import Favourites from "./pages/Favourites"; 
import MyOrders from "./pages/MyOrders"; 
import OrderDetail from "./pages/OrderDetail"; 
import PersonalDetails from "./pages/PersonalDetails"; 
import UserProfile from "./pages/UserProfile";
import OrderTracking from "./pages/OrderTracking";
import UserWishlist from "./pages/UserWishlist";
import PaymentHistory from "./pages/PaymentHistory";
import AddressBook from "./pages/AddressBook";
import AccountSettings from "./pages/AccountSettings";

// Admin Routes - Requires admin role
import Admin from "./pages/Admin"; 
import AdminDashboard from "./pages/admin/AdminDashboard";
import ProductManagement from "./pages/admin/ProductManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import OrderManagement from "./pages/admin/OrderManagement";
import CustomerManagement from "./pages/admin/CustomerManagement";
import PaymentManagement from "./pages/admin/PaymentManagement";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminUserManagement from "./pages/admin/AdminUserManagement";
import InventoryManagement from "./pages/admin/InventoryManagement";
import AdminReports from "./pages/admin/AdminReports";

// Route Guards
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import PublicRoute from "./components/PublicRoute";

const queryClient = new QueryClient(); 

const App = () => ( 
  <QueryClientProvider client={queryClient}> 
    <TooltipProvider> 
      <AuthProvider> 
        <FavouritesProvider> 
          <CartProvider> 
            <Toaster /> 
            <Sonner /> 
            <BrowserRouter> 
              <Routes> 
                {/* ===== PUBLIC ROUTES ===== */}
                {/* Home page - displays featured products from categories table */}
                <Route path="/" element={<Index />} /> 
                
                {/* Shop page - displays all products from products table */}
                <Route path="/shop" element={<Shop />} /> 
                
                {/* Category page - displays products filtered by category_id */}
                <Route path="/category/:categorySlug" element={<Category />} /> 
                
                {/* Product detail - displays single product with ratings from product_ratings table */}
                <Route path="/product/:productId" element={<ProductDetail />} /> 
                
                {/* Static pages */}
                <Route path="/about" element={<About />} /> 
                <Route path="/contact" element={<Contact />} /> 
                <Route path="/terms-conditions" element={<TermsConditions />} /> 
                <Route path="/privacy-policy" element={<PrivacyPolicy />} /> 

                {/* ===== AUTHENTICATION ROUTES ===== */}
                {/* These routes should redirect to home if user is already logged in */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} /> 
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} /> 
                <Route path="/verify-phone" element={<PublicRoute><VerifyPhone /></PublicRoute>} /> 
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

                {/* ===== PROTECTED USER ROUTES ===== */}
                {/* Cart - displays items for current user */}
                <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} /> 
                
                {/* Checkout - processes order creation in orders table */}
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} /> 
                
                {/* User Dashboard Routes */}
                <Route path="/account" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                <Route path="/account/profile" element={<ProtectedRoute><PersonalDetails /></ProtectedRoute>} />
                <Route path="/account/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                <Route path="/account/addresses" element={<ProtectedRoute><AddressBook /></ProtectedRoute>} />
                
                {/* Order Management */}
                <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} /> 
                <Route path="/order/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} /> 
                <Route path="/order/:orderId/track" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                
                {/* Wishlist - displays items from wishlist table */}
                <Route path="/favourites" element={<ProtectedRoute><Favourites /></ProtectedRoute>} /> 
                <Route path="/wishlist" element={<ProtectedRoute><UserWishlist /></ProtectedRoute>} /> 
                
                {/* Payment History - displays data from payments table */}
                <Route path="/payments" element={<ProtectedRoute><PaymentHistory /></ProtectedRoute>} />

                {/* ===== ADMIN ROUTES ===== */}
                {/* Main admin dashboard */}
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} /> 
                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                
                {/* Product Management - CRUD operations on products table */}
                <Route path="/admin/products" element={<AdminRoute><ProductManagement /></AdminRoute>} />
                <Route path="/admin/products/add" element={<AdminRoute><ProductManagement /></AdminRoute>} />
                <Route path="/admin/products/edit/:productId" element={<AdminRoute><ProductManagement /></AdminRoute>} />
                
                {/* Category Management - CRUD operations on categories table */}
                <Route path="/admin/categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
                <Route path="/admin/categories/add" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
                <Route path="/admin/categories/edit/:categoryId" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
                
                {/* Order Management - displays and manages orders table */}
                <Route path="/admin/orders" element={<AdminRoute><OrderManagement /></AdminRoute>} />
                <Route path="/admin/orders/:orderId" element={<AdminRoute><OrderManagement /></AdminRoute>} />
                
                {/* Customer Management - displays customers table data */}
                <Route path="/admin/customers" element={<AdminRoute><CustomerManagement /></AdminRoute>} />
                <Route path="/admin/customers/:customerId" element={<AdminRoute><CustomerManagement /></AdminRoute>} />
                
                {/* Payment Management - displays payments table data */}
                <Route path="/admin/payments" element={<AdminRoute><PaymentManagement /></AdminRoute>} />
                <Route path="/admin/payments/:paymentId" element={<AdminRoute><PaymentManagement /></AdminRoute>} />
                
                {/* Inventory Management - manages product quantities */}
                <Route path="/admin/inventory" element={<AdminRoute><InventoryManagement /></AdminRoute>} />
                
                {/* User Management - manages auth.users table */}
                <Route path="/admin/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
                <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
                
                {/* Messages Management - displays messages table data */}
                <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
                <Route path="/admin/messages/:messageId" element={<AdminRoute><AdminMessages /></AdminRoute>} />
                
                {/* Reports and Analytics */}
                <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/reports/sales" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/reports/customers" element={<AdminRoute><AdminReports /></AdminRoute>} />
                <Route path="/admin/reports/products" element={<AdminRoute><AdminReports /></AdminRoute>} />

                {/* File Management - manages storage.objects table */}
                <Route path="/admin/media" element={<AdminRoute><MediaManagement /></AdminRoute>} />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} /> 
              </Routes> 
            </BrowserRouter> 
          </CartProvider> 
        </FavouritesProvider> 
      </AuthProvider> 
    </TooltipProvider> 
  </QueryClientProvider> 
); 

export default App;

/* ===== DATABASE TABLE MAPPING FOR ROUTES ===== */

/**
 * PUBLIC ROUTES - Database Integration:
 * 
 * "/" (Index) - Uses:
 *   - categories table (featured products)
 *   - products table (display products)
 * 
 * "/shop" - Uses:
 *   - products table (all products)
 *   - categories table (filter options)
 * 
 * "/category/:categorySlug" - Uses:
 *   - categories table (category details)
 *   - products table (filtered by category_id)
 * 
 * "/product/:productId" - Uses:
 *   - products table (product details)
 *   - product_ratings table (reviews and ratings)
 *   - categories table (category info)
 */

/**
 * PROTECTED USER ROUTES - Database Integration:
 * 
 * "/cart" - Uses:
 *   - Local storage/session (cart items)
 *   - products table (product details)
 * 
 * "/checkout" - Uses:
 *   - products table (order items)
 *   - customers table (customer info)
 *   - orders table (create new order)
 * 
 * "/account/profile" - Uses:
 *   - customers table (customer profile)
 *   - auth.users table (user authentication data)
 * 
 * "/my-orders" - Uses:
 *   - orders table (filtered by user_id)
 *   - products table (order items details)
 * 
 * "/order/:orderId" - Uses:
 *   - orders table (specific order)
 *   - payments table (payment status)
 * 
 * "/favourites" - Uses:
 *   - wishlist table (user's wishlist items)
 *   - products table (product details)
 * 
 * "/payments" - Uses:
 *   - payments table (filtered by user_id)
 *   - orders table (related order info)
 */

/**
 * ADMIN ROUTES - Database Integration:
 * 
 * "/admin/dashboard" - Uses:
 *   - orders table (sales stats)
 *   - customers table (customer stats)
 *   - products table (inventory stats)
 *   - payments table (revenue stats)
 * 
 * "/admin/products" - Uses:
 *   - products table (CRUD operations)
 *   - categories table (category assignment)
 *   - storage.objects table (image management)
 * 
 * "/admin/categories" - Uses:
 *   - categories table (CRUD operations)
 *   - products table (category usage stats)
 * 
 * "/admin/orders" - Uses:
 *   - orders table (all orders)
 *   - customers table (customer info)
 *   - payments table (payment status)
 * 
 * "/admin/customers" - Uses:
 *   - customers table (customer management)
 *   - auth.users table (user accounts)
 *   - orders table (customer order history)
 * 
 * "/admin/payments" - Uses:
 *   - payments table (all payments)
 *   - orders table (related orders)
 *   - customers table (customer info)
 * 
 * "/admin/users" - Uses:
 *   - auth.users table (user management)
 *   - admin_users table (admin role management)
 *   - customers table (profile completion)
 * 
 * "/admin/messages" - Uses:
 *   - messages table (contact form submissions)
 *   - customers table (customer info if available)
 * 
 * "/admin/media" - Uses:
 *   - storage.objects table (file management)
 *   - storage.buckets table (bucket management)
 */

/**
 * ROUTE GUARDS EXPLANATION:
 * 
 * PublicRoute: Redirects authenticated users away from auth pages
 * ProtectedRoute: Requires user authentication
 * AdminRoute: Requires admin role (checks admin_users table)
 */