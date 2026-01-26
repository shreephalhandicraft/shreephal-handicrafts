import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ArrowLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function DashboardHeader({ darkMode, toggleDarkMode, realtimeStatus }) {
  const [searchTerm, setSearchTerm] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out from admin panel.",
    });
    navigate("/");
  };

  const handleBackToSite = () => {
    navigate("/");
  };

  const getUserInitials = (name) => {
    if (!name) return "AD";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      console.log("Searching for:", searchTerm);
      toast({
        title: "Search",
        description: `Searching for "${searchTerm}"...`,
      });
    }
  };

  // ✅ Determine overall realtime connection status
  const getConnectionStatus = () => {
    if (!realtimeStatus) return { status: 'unknown', label: 'Unknown', color: 'gray' };
    
    const ordersStatus = realtimeStatus.orders;
    const messagesStatus = realtimeStatus.messages;
    
    // Both connected = fully connected
    if (ordersStatus === 'connected' && messagesStatus === 'connected') {
      return { 
        status: 'connected', 
        label: 'Live', 
        color: 'green',
        icon: Wifi,
      };
    }
    
    // Any error = error state
    if (ordersStatus === 'error' || messagesStatus === 'error') {
      return { 
        status: 'error', 
        label: 'Offline', 
        color: 'red',
        icon: WifiOff,
      };
    }
    
    // Connecting
    if (ordersStatus === 'connecting' || messagesStatus === 'connecting') {
      return { 
        status: 'connecting', 
        label: 'Connecting', 
        color: 'yellow',
        icon: Wifi,
      };
    }
    
    // Disconnected
    return { 
      status: 'disconnected', 
      label: 'Disconnected', 
      color: 'gray',
      icon: WifiOff,
    };
  };

  const connectionStatus = getConnectionStatus();
  const StatusIcon = connectionStatus.icon || Wifi;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 sm:px-6">
        {/* Left side - Sidebar trigger and Search */}
        <div className="flex items-center gap-4 flex-1">
          <SidebarTrigger className="h-8 w-8" />

          {/* Admin Panel Title (Mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            <h1 className="text-lg font-semibold text-foreground">
              Admin Panel
            </h1>
          </div>

          {/* Search Bar (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="relative max-w-md flex-1 hidden md:block"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search orders, customers, products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full bg-surface-light border-border focus:ring-primary"
            />
          </form>
        </div>

        {/* Right side - Actions and User Menu */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* ✅ Realtime Connection Status Indicator */}
          {realtimeStatus && (
            <div 
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-light"
              title={`Realtime updates: ${connectionStatus.label}`}
            >
              <StatusIcon 
                className={cn(
                  "h-3.5 w-3.5",
                  connectionStatus.color === 'green' && "text-green-600 animate-pulse",
                  connectionStatus.color === 'red' && "text-red-600",
                  connectionStatus.color === 'yellow' && "text-yellow-600 animate-pulse",
                  connectionStatus.color === 'gray' && "text-gray-400"
                )}
              />
              <span className={cn(
                "text-xs font-medium",
                connectionStatus.color === 'green' && "text-green-600",
                connectionStatus.color === 'red' && "text-red-600",
                connectionStatus.color === 'yellow' && "text-yellow-600",
                connectionStatus.color === 'gray' && "text-gray-500"
              )}>
                {connectionStatus.label}
              </span>
            </div>
          )}

          {/* Back to Site Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSite}
            className="hidden sm:flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Site
          </Button>

          {/* Mobile Back Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackToSite}
            className="sm:hidden h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 text-foreground hover:bg-surface-light"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:bg-surface-light relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-medium">
              3
            </span>
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {getUserInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || "Admin User"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email || "admin@example.com"}
                    </p>
                    {user.role && (
                      <p className="text-xs leading-none text-primary font-medium">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <Link to="/admin/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Admin Profile</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleBackToSite}
                  className="cursor-pointer"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span>Back to Site</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full bg-surface-light border-border focus:ring-primary"
          />
        </form>
      </div>
    </header>
  );
}
