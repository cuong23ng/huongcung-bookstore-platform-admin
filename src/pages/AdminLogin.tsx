import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { AdminAuthService } from "../services/AdminAuthService";
import type { LoginRequest } from "../models/AdminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    const authService = AdminAuthService.getInstance();
    if (authService.isAuthenticated()) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic form validation
    if (!email || !password) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Lỗi đăng nhập",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const authService = AdminAuthService.getInstance();
      const loginData: LoginRequest = { email, password };
      const authData = await authService.login(loginData);

      toast({
        title: "Đăng nhập thành công",
        description: `Chào mừng ${authData.firstName} ${authData.lastName}!`,
      });

      navigate("/admin/dashboard");
    } catch (error: unknown) {
      toast({
        title: "Lỗi đăng nhập",
        description: (error as Error).message || "Có lỗi xảy ra khi đăng nhập",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Hệ thống quản lý</CardTitle>
          <CardDescription className="text-center">
            Hương Cung Bookstore - Đăng nhập nhân viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/")}>
              Quay về trang chủ
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
