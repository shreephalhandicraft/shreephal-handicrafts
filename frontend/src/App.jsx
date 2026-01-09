// App.jsx - Enhanced with SEO and Performance Optimizations
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavouritesProvider } from "@/contexts/FavouritesContext";
import {
  PublicRoute,
  PrivateRoute,
  AdminRoute,
  GuestRoute,
} from "@/contexts/RouteGuards";

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
const Favourites = lazy(() => import("./pages/Favourites"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const OrderDetail = lazy(() => import("./pages/OrderDetail"));
const PersonalDetails = lazy(() => import("./pages/PersonalDetails"));
const TermsConditions = lazy(() => import("./pages/TermsConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UnauthorizedPage = lazy(() => import("./pages/UnauthorizedPage"));
const AdminDashboard = lazy(() => import("./components/admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
  },
});

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <FavouritesProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
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
              </BrowserRouter>
            </FavouritesProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
