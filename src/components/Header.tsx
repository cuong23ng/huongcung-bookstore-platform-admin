import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { UserRound, Menu, ShoppingBag, Bell, User, Package, LogOut } from "lucide-react";
import { SidebarTrigger } from "./ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";
import { UserInfo, getAuthData, logout } from "../services/AuthService";
import { useCart } from "../contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserInfo | null>(null);
  const { itemCount } = useCart();

  useEffect(() => {
    // Get user information from localStorage
    const userData = getAuthData();
    setUser(userData);
  }, []);

  const handleLogout = async () => {
    if (user) {
      try {
        await logout();

        toast({
          title: "Đăng xuất thành công",
          description: "Bạn đã đăng xuất khỏi tài khoản",
        });

        // Reload the page to refresh the UI state
        globalThis.location.reload();
      } catch (error) {
        console.error("Logout failed:", error);
        toast({
          title: "Lỗi đăng xuất",
          description: "Đã xảy ra lỗi khi đăng xuất.",
          variant: "destructive",
        });
      }
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu trigger + Logo */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <h1 className="text-xl font-light tracking-wider">
              Hương Cung Book
            </h1>
          </div>

          {/* Center Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <SearchBar />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              size="icon" 
              className="!hover:bg-transparent relative"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Button>

            {/* Only show these buttons when user is logged in */}
            {user && (
              <Button variant="ghost" size="icon" className="!hover:bg-transparent">
                <Bell className="h-5 w-5" />
              </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="!hover:bg-transparent">
                    <UserRound className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <UserRound className="mr-2 h-4 w-4" />
                    <span>Thông tin cá nhân</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => navigate("/orders")}>
                    <Package className="mr-2 h-4 w-4" />
                    <span>Lịch sử đơn hàng</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => navigate("/auth")}
                className="gap-2"
              >
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
