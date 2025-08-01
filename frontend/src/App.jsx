// App.jsx (Modified: Removed PhoneVerificationRoute import and usage, removed VerifyPhone route and import)
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

// Pages
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import Category from "./pages/CategoryProducts";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import Favourites from "./pages/Favourites";
import MyOrders from "./pages/MyOrders";
import OrderDetail from "./pages/OrderDetail";
import PersonalDetails from "./pages/PersonalDetails";
import TermsConditions from "./pages/TermsConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";

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
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <FavouritesProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
            </BrowserRouter>
          </FavouritesProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
