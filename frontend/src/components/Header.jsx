import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  LogOut,
  Package,
  FileText,
  Shield,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);

  const { getTotalItems } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        return;
      }

      setAdminLoading(true);
      try {
        console.log("Checking admin status for:", user.email);

        const { data: adminData, error } = await supabase
          .from("admin_users")
          .select("role")
          .eq("email", user.email)
          .maybeSingle();

        if (adminData && !error) {
          console.log("Admin data found:", adminData);
          setIsAdmin(true);
        } else {
          console.log("No admin data found or error:", error);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
      // console.log("Admin status checked:", adminData);
    };

    checkAdminStatus();
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    setIsAdmin(false); // Reset admin status on logout
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleFavourites = () => {
    navigate("/favourites");
  };

  const handleMyOrders = () => {
    navigate("/my-orders");
  };

  const handlePersonalDetails = () => {
    navigate("/personal-details");
  };

  const getUserInitials = (name) => {
    if (!name || typeof name !== "string" || name.trim() === "") return "U";

    const trimmedName = name.trim();
    const words = trimmedName.split(/\s+/).filter((word) => word.length > 0);

    if (words.length === 0) return "U";

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    } else {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  };

  // Debug logging (remove in production)
  if (user) {
    console.log("User object:", user);
    console.log("Is admin?", isAdmin);
    console.log("Admin loading?", adminLoading);
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 min-w-0 flex-shrink"
          >
            <img
              src="/shrifal.svg"
              alt="Shrifal-Handicrafts"
              className="h-8 sm:h-10 md:h-12 lg:h-16 w-auto flex-shrink-0"
            />
            <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-primary truncate">
              <span className="hidden sm:inline">Shrifal-Handicrafts</span>
              <span className="sm:hidden">Shrifal</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-4 xl:space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium whitespace-nowrap"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium whitespace-nowrap"
            >
              Shop
            </Link>
            <Link
              to="/about"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium whitespace-nowrap"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-gray-700 hover:text-primary transition-colors text-sm lg:text-base font-medium whitespace-nowrap"
            >
              Contact
            </Link>
          </nav>

          {/* Right side icons */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Admin Dashboard Button (Desktop) - Simplified */}
            {user && isAdmin && !adminLoading && (
              <Link to="/admin" className="hidden lg:block">
                <Button
                  variant="default"
                  size="sm"
                  className="flex items-center text-xs lg:text-sm px-2 lg:px-3 bg-red-600 hover:bg-red-700 text-white"
                >
                  <LayoutDashboard className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  <span className="hidden xl:inline">Admin</span>
                </Button>
              </Link>
            )}

            {/* Admin Button for Medium Screens */}
            {user && isAdmin && !adminLoading && (
              <Link to="/admin" className="hidden md:block lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center text-xs px-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LayoutDashboard className="h-3 w-3 mr-1" />
                </Button>
              </Link>
            )}

            {/* User Menu / Login (Desktop) */}
            {user ? (
              <div className="hidden md:flex">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 lg:h-9 lg:w-9 rounded-full p-0"
                    >
                      <Avatar className="h-8 w-8 lg:h-9 lg:w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs lg:text-sm font-semibold">
                          {getUserInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-56 sm:w-64"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                        {/* Debug info - remove in production */}
                        {isAdmin && (
                          <p className="text-xs text-red-600 font-semibold">
                            ADMIN USER
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {/* Admin Dashboard in dropdown */}
                    {isAdmin && !adminLoading && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link
                            to="/admin"
                            className="cursor-pointer text-red-600 font-medium"
                          >
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <DropdownMenuItem
                      onClick={handleMyOrders}
                      className="cursor-pointer"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      <span>My Orders</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleFavourites}
                      className="cursor-pointer"
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      <span>Favourites</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handlePersonalDetails}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Personal Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/terms-conditions" className="cursor-pointer">
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Terms & Conditions</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/privacy-policy" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        <span>Privacy Policy</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link to="/login" className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center text-xs lg:text-sm px-2 lg:px-3"
                >
                  <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  <span className="hidden lg:inline">Login</span>
                </Button>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-1.5 sm:p-2"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[9px] sm:text-[10px] font-medium min-w-[16px] sm:min-w-[20px]">
                    {getTotalItems() > 99 ? "99+" : getTotalItems()}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-1.5 sm:p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="py-3 sm:py-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <nav className="flex flex-col space-y-1">
                {/* Navigation Links */}
                <Link
                  to="/"
                  className="text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-base font-medium rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/shop"
                  className="text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-base font-medium rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-base font-medium rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-base font-medium rounded-lg mx-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>

                {/* User Section */}
                {user ? (
                  <div className="border-t border-gray-200 mt-2 pt-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 mx-2 rounded-lg">
                      <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                          {getUserInitials(user.name || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-semibold truncate text-gray-900">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                        {/* Debug info - remove in production */}
                        {isAdmin && (
                          <p className="text-xs text-red-600 font-bold">
                            ADMIN
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex flex-col space-y-1 mt-3">
                      {/* Admin Dashboard Link (Mobile) */}
                      {isAdmin && !adminLoading && (
                        <Link
                          to="/admin"
                          className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors py-3 px-4 rounded-lg mx-2 border border-red-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="text-base font-semibold">
                            Admin Dashboard
                          </span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          handleMyOrders();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-left rounded-lg mx-2 w-full"
                      >
                        <Package className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-base">My Orders</span>
                      </button>

                      <button
                        onClick={() => {
                          handleFavourites();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-left rounded-lg mx-2 w-full"
                      >
                        <Heart className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-base">Favourites</span>
                      </button>

                      <button
                        onClick={() => {
                          handlePersonalDetails();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 text-left rounded-lg mx-2 w-full"
                      >
                        <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-base">Personal Details</span>
                      </button>

                      <Link
                        to="/terms-conditions"
                        className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 rounded-lg mx-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-base">Terms & Conditions</span>
                      </Link>

                      <Link
                        to="/privacy-policy"
                        className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 rounded-lg mx-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="h-5 w-5 mr-3 flex-shrink-0" />
                        <span className="text-base">Privacy Policy</span>
                      </Link>

                      <div className="border-t border-gray-200 mt-2 pt-2">
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMenuOpen(false);
                          }}
                          className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors py-3 px-4 text-left rounded-lg mx-2 w-full"
                        >
                          <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                          <span className="text-base font-medium">Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 mt-2 pt-4">
                    <Link
                      to="/login"
                      className="flex items-center text-gray-700 hover:text-primary hover:bg-gray-50 transition-colors py-3 px-4 rounded-lg mx-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span className="text-base font-medium">Login</span>
                    </Link>
                  </div>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
