import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { AdminAuthService, logout } from "../services/AdminAuthService";
import { DashboardService } from "../services/DashboardService";
import { RevenueChart } from "../components/dashboard/RevenueChart";
import { OrderStatusChart } from "../components/dashboard/OrderStatusChart";
import { TopSellingBooksChart } from "../components/dashboard/TopSellingBooksChart";
import { OrderTrendChart } from "../components/dashboard/OrderTrendChart";
import { Header } from "../components/Header";

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
        role = (userInfo.userType || 'admin').toLowerCase();
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
      {/* <header className="border-b bg-card">
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
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">

        {/* Dashboard Charts Section */}
        {(userRole === "admin") && (
          <DashboardChartsSection />
        )}

      </main>
    </div>
  );
}

function DashboardChartsSection() {
  const dashboardService = DashboardService.getInstance();
  
  const { data: statistics, isLoading, error } = useQuery({
    queryKey: ['dashboardStatistics'],
    queryFn: () => dashboardService.getDashboardStatistics(),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Transform order status counts to chart data format
  const orderStatusData = statistics?.orderStatusCounts
    ? Object.entries(statistics.orderStatusCounts).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  // Transform top selling books to chart data format
  const topSellingBooksData = statistics?.topSellingBooks
    ? statistics.topSellingBooks.map(book => ({
        bookTitle: book.bookTitle,
        totalQuantity: book.totalQuantity,
      }))
    : [];

  if (isLoading) {
    return (
      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Trạng thái đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top sách bán chạy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8 grid gap-6 md:grid-cols-2">
      <RevenueChart data={statistics?.revenueTrend || []} />
      <OrderStatusChart data={orderStatusData} />
      <TopSellingBooksChart data={topSellingBooksData} />
      <OrderTrendChart data={statistics?.orderTrend || []} />
    </div>
  );
}
