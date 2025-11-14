import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Users, Package, ShoppingCart, HeadsetIcon, LogOut } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { AdminAuthService, logout } from "../services/AdminAuthService";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<{ fullName: string; city?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authService = AdminAuthService.getInstance();
      
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        navigate("/admin/login");
        return;
      }

      // Get user info
      const userInfo = authService.getAuthData();
      if (!userInfo) {
        // User info missing, redirect to login
        navigate("/admin/login");
        return;
      }

      // Set user role (get first role from roles array, or use userType)
      // Normalize role: remove ROLE_ prefix if present and convert to lowercase
      let role: string;
      if (userInfo.roles && userInfo.roles.length > 0) {
        role = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
      } else {
        role = userInfo.userType.toLowerCase();
      }
      
      setUserRole(role);
      setStaffInfo({
        fullName: `${userInfo.firstName} ${userInfo.lastName}`,
        city: userInfo.city,
      });
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Đã đăng xuất",
        description: "Đăng xuất thành công",
      });
      navigate("/admin/login");
    } catch {
      // Logout failed, but clear local state anyway
      toast({
        title: "Đã đăng xuất",
        description: "Đăng xuất thành công",
      });
      navigate("/admin/login");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getRoleTitle = (role: string) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "store_manager":
        return "Quản lý cửa hàng";
      case "support_agent":
        return "Nhân viên hỗ trợ";
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hệ thống quản lý - Hương Cung Bookstore</h1>
            <p className="text-sm text-muted-foreground">
              {getRoleTitle(userRole || "")} - {staffInfo?.fullName}
              {staffInfo?.city && ` - ${staffInfo.city}`}
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Chào mừng, {staffInfo?.fullName}!</h2>
          <p className="text-muted-foreground">Chọn chức năng bạn muốn truy cập</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Staff Management - Admin only */}
          {userRole === "admin" && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/staff")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Quản lý nhân viên
                </CardTitle>
                <CardDescription>Tạo và quản lý tài khoản nhân viên</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">Truy cập</Button>
              </CardContent>
            </Card>
          )}

          {/* Catalog Management - Admin only */}
          {userRole === "admin" && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/catalog")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Quản lý danh mục
                </CardTitle>
                <CardDescription>Quản lý sách, tác giả, nhà xuất bản</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">Truy cập</Button>
              </CardContent>
            </Card>
          )}

          {/* Inventory Management - Admin & Store Manager */}
          {(userRole === "admin" || userRole === "store_manager") && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/inventory")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Quản lý kho
                </CardTitle>
                <CardDescription>Quản lý tồn kho đa thành phố</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">Truy cập</Button>
              </CardContent>
            </Card>
          )}

          {/* Order Fulfillment - Admin & Store Manager */}
          {(userRole === "admin" || userRole === "store_manager") && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/orders")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Xử lý đơn hàng
                </CardTitle>
                <CardDescription>Xử lý và giao hàng đơn đặt</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">Truy cập</Button>
              </CardContent>
            </Card>
          )}

          {/* Customer Support - Support Agent & Admin */}
          {(userRole === "support_agent" || userRole === "admin") && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/admin/support")}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HeadsetIcon className="mr-2 h-5 w-5" />
                  Hỗ trợ khách hàng
                </CardTitle>
                <CardDescription>Tra cứu và hỗ trợ khách hàng</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">Truy cập</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
