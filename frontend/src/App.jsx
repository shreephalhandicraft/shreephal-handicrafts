// App.jsx - Clean architecture with unified providers
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route } from "react-router-dom";
import { AppProviders } from "@/contexts/AppProviders";
import {
  PublicRoute,
  PrivateRoute,
  AdminRoute,
  GuestRoute,
} from "@/contexts/RouteGuards";
import OfflineDetector from "@/components/OfflineDetector";
import ScrollToTop from "@/components/ScrollToTop";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Shop = lazy(() => import("./pages/Shop"));
const Category = lazy(() => import("./pages/CategoryProducts"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
// ✅ NEW: Password reset pages
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Favourites = lazy(() => import("./pages/Favourites"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const PersonalDetails = lazy(() => import("./pages/PersonalDetails"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const TrophyShopJabalpur = lazy(() => import("./pages/TrophyShopJabalpur"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

/**
 * ✅ REFACTORED: Clean app structure using unified AppProviders
 * - Reduced nesting complexity (5 layers → 1 layer visible here)
 * - All context providers centralized in AppProviders.jsx
 * - Easier to maintain and debug
 * ✅ FIXED: Added ScrollToTop component to fix scroll position on navigation
 */
const App = () => (
  <AppProviders>
    {/* ✅ Scroll to top on route change */}
    <ScrollToTop />
    
    {/* ✅ Offline detection for better mobile UX */}
    <OfflineDetector />
    
    {/* Toast notifications */}
    <Toaster />
    <Sonner />
    
    {/* Lazy-loaded routes with fallback */}
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes - Anyone can access */}
        <Route
          path="/"
          element={
            <GuestRoute>
              <Index />
            </GuestRoute>
          }
        />
        <Route
          path="/shop"
          element={
            <GuestRoute>
              <Shop />
            </GuestRoute>
          }
        />
        <Route
          path="/category/:slug/products"
          element={
            <GuestRoute>
              <Category />
            </GuestRoute>
          }
        />
        <Route
          path="/category/:slug/products/:productId"
          element={
            <GuestRoute>
              <ProductDetail />
            </GuestRoute>
          }
        />
        <Route
          path="/about"
          element={
            <GuestRoute>
              <About />
            </GuestRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <GuestRoute>
              <Contact />
            </GuestRoute>
          }
        />
        <Route
          path="/terms-conditions"
          element={
            <GuestRoute>
              <TermsConditions />
            </GuestRoute>
          }
        />
        <Route
          path="/privacy-policy"
          element={
            <GuestRoute>
              <PrivacyPolicy />
            </GuestRoute>
          }
        />
        <Route
          path="/refund-policy"
          element={
            <GuestRoute>
              <RefundPolicy />
            </GuestRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <GuestRoute>
              <Cart />
            </GuestRoute>
          }
        />
        
        {/* 🎯 SEO: Trophy Shop Jabalpur Landing Page */}
        <Route
          path="/trophy-shop-jabalpur"
          element={
            <GuestRoute>
              <TrophyShopJabalpur />
            </GuestRoute>
          }
        />

        {/* Auth-Only Routes - Redirect authenticated users */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        {/* ✅ NEW: Password reset routes */}
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Private Routes - Require authentication */}
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />

        <Route
          path="/my-orders"
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="/order/:orderId"
          element={
            <PrivateRoute>
              <OrderDetail />
            </PrivateRoute>
          }
        />

        <Route
          path="/favourites"
          element={
            <PrivateRoute>
              <Favourites />
            </PrivateRoute>
          }
        />

        <Route
          path="/personal-details"
          element={
            <PrivateRoute>
              <PersonalDetails />
            </PrivateRoute>
          }
        />

        {/* Admin Routes - Require admin privileges */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute redirectTo="/unauthorized">
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </AppProviders>
);

export default App;