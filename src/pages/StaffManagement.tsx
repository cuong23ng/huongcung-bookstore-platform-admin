import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { Plus, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { StaffService } from "../services/StaffService";
import { getAuthData } from "../services/AdminAuthService";
import { Header } from "../components/Header";
import type { Staff, CreateStaffRequest, UpdateStaffRequest, StaffRole, City } from "../models/Staff";

export default function StaffManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  
  // Filter state
  const [filterStaffType, setFilterStaffType] = useState<StaffRole | undefined>(undefined);
  const [filterCity, setFilterCity] = useState<City | undefined>(undefined);
  const [filterWarehouse, setFilterWarehouse] = useState<string>("");
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [warehouseCode, setWarehouseCode] = useState<string>("");

  // Check admin access
  useEffect(() => {
    const checkAdminAccess = () => {
      const userInfo = getAuthData();
      if (!userInfo) {
        navigate("/admin/login");
        return;
      }

      // Normalize role: remove ROLE_ prefix if present and convert to lowercase
      let userRole: string;
      if (userInfo.roles && userInfo.roles.length > 0) {
        userRole = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
      } else {
        userRole = userInfo.userType?.toLowerCase() || '';
      }

      if (userRole !== 'admin') {
        toast({
          title: "Không có quyền truy cập",
          description: "Chỉ quản trị viên mới có thể truy cập trang này",
          variant: "destructive",
        });
        navigate("/admin/dashboard");
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  // Fetch staff list using React Query
  const { data: staffData, isLoading, error, refetch } = useQuery({
    queryKey: ['staff', currentPage, pageSize, filterStaffType, filterCity, filterWarehouse],
    queryFn: () => StaffService.getInstance().getAllStaff({
      page: currentPage, // 0-based for backend
      size: pageSize,
      staffType: filterStaffType,
      assignedCity: filterCity,
      warehouse: filterWarehouse || undefined,
    }),
  });

  const staff = staffData?.staffs || [];
  const pagination = staffData?.pagination;

  // Create staff mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStaffRequest) => StaffService.getInstance().createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Tạo nhân viên thành công",
        description: `Đã tạo tài khoản cho ${fullName}`,
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo nhân viên",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update staff mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStaffRequest }) => 
      StaffService.getInstance().updateStaff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Cập nhật nhân viên thành công",
        description: "Thông tin nhân viên đã được cập nhật",
      });
      setDialogOpen(false);
      resetForm();
      setEditMode(false);
      setEditingStaffId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật nhân viên",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => StaffService.getInstance().deleteStaff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast({
        title: "Xóa nhân viên thành công",
        description: "Nhân viên đã được xóa khỏi hệ thống",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi xóa nhân viên",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (!fullName || !email || !phone || !password || !role) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Lỗi xác thực",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    // Password validation (minimum 6 characters)
    if (password.length < 6) {
      toast({
        title: "Lỗi xác thực",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        variant: "destructive",
      });
      return;
    }

    // City validation for Store Managers
    if (role === 'store_manager' && !city) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng chọn thành phố cho quản lý cửa hàng",
        variant: "destructive",
      });
      return;
    }

    // Warehouse validation for Warehouse Managers and Warehouse Staff
    if ((role === 'warehouse_manager' || role === 'warehouse_staff') && !warehouseCode) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng chọn kho cho nhân viên kho",
        variant: "destructive",
      });
      return;
    }

    // Gender validation
    if (!gender) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng chọn giới tính",
        variant: "destructive",
      });
      return;
    }

    const createData: CreateStaffRequest = {
      fullName,
      username: username || undefined, // Optional, will use email if not provided
      email,
      phone,
      password,
      gender,
      role: role.toUpperCase() as StaffRole,
      city: (role === 'store_manager' || role === 'warehouse_manager' || role === 'warehouse_staff') ? (city as City) : undefined,
      warehouseCode: (role === 'warehouse_manager' || role === 'warehouse_staff') ? warehouseCode : undefined,
    };

    createMutation.mutate(createData);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStaffId) return;

    // Form validation
    if (!fullName || !email || !phone || !role) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Lỗi xác thực",
        description: "Email không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    // City validation for Store Managers
    if (role === 'store_manager' && !city) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng chọn thành phố cho quản lý cửa hàng",
        variant: "destructive",
      });
      return;
    }

    const updateData: UpdateStaffRequest = {
      fullName,
      email,
      phone,
      role: role.toUpperCase() as StaffRole,
      city: role === 'store_manager' ? (city as City) : undefined,
    };

    updateMutation.mutate({ id: editingStaffId, data: updateData });
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) return;
    deleteMutation.mutate(id);
  };

  const handleEditStaff = (staff: Staff) => {
    setEditMode(true);
    setEditingStaffId(staff.id);
    setFullName(staff.fullName);
    setEmail(staff.email);
    setPhone(staff.phone);
    setPassword(""); // Don't pre-fill password
    setRole(staff.role.toLowerCase());
    setCity(staff.city || "");
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFullName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setPassword("");
    setGender("");
    setRole("");
    setCity("");
    setWarehouseCode("");
    setEditMode(false);
    setEditingStaffId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getRoleLabel = (role: string | undefined) => {
    if (!role) return "-";
    switch (role.toLowerCase()) {
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

  const getCityLabel = (city: string) => {
    switch (city.toLowerCase()) {
      case "hanoi":
        return "Hà Nội";
      case "hcmc":
        return "TP. Hồ Chí Minh";
      case "danang":
        return "Đà Nẵng";
      default:
        return city;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý nhân viên</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="mb-4">Danh sách nhân viên</CardTitle>
                <CardDescription className="mb-4">Quản lý tài khoản nhân viên hệ thống</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm nhân viên
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editMode ? "Cập nhật thông tin nhân viên" : "Tạo tài khoản nhân viên mới"}
                    </DialogTitle>
                    <DialogDescription>
                      {editMode ? "Cập nhật thông tin nhân viên" : "Điền thông tin để tạo tài khoản mới"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editMode ? handleUpdateStaff : handleCreateStaff} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Họ và tên *</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Số điện thoại *</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Giới tính *</Label>
                      <Select value={gender} onValueChange={setGender} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Nam</SelectItem>
                          <SelectItem value="FEMALE">Nữ</SelectItem>
                          <SelectItem value="OTHER">Khác</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {!editMode && (
                      <div className="space-y-2">
                        <Label htmlFor="password">Mật khẩu *</Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-muted-foreground">Tối thiểu 6 ký tự</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="role">Vai trò *</Label>
                      <Select value={role} onValueChange={setRole} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vai trò" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="store_manager">Quản lý cửa hàng</SelectItem>
                          <SelectItem value="support_agent">Nhân viên hỗ trợ</SelectItem>
                          <SelectItem value="warehouse_manager">Quản lý kho</SelectItem>
                          <SelectItem value="warehouse_staff">Nhân viên kho</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(role === "store_manager" || role === "warehouse_manager" || role === "warehouse_staff") && (
                      <div className="space-y-2">
                        <Label htmlFor="city">Thành phố *</Label>
                        <Select value={city} onValueChange={setCity} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn thành phố" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HANOI">Hà Nội</SelectItem>
                            <SelectItem value="HCMC">TP. Hồ Chí Minh</SelectItem>
                            <SelectItem value="DANANG">Đà Nẵng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {(role === "warehouse_manager" || role === "warehouse_staff") && (
                      <div className="space-y-2">
                        <Label htmlFor="warehouse">Kho *</Label>
                        <Select value={warehouseCode} onValueChange={setWarehouseCode} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn kho" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WH-HN-001">WH-HN-001 (Hà Nội)</SelectItem>
                            <SelectItem value="WH-HCM-001">WH-HCM-001 (TP. Hồ Chí Minh)</SelectItem>
                            <SelectItem value="WH-DN-001">WH-DN-001 (Đà Nẵng)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {createMutation.isPending || updateMutation.isPending 
                        ? "Đang xử lý..." 
                        : editMode 
                          ? "Cập nhật" 
                          : "Tạo tài khoản"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="filter-role">Lọc theo vai trò</Label>
                <Select
                  value={filterStaffType || "all"}
                  onValueChange={(value) => {
                    setFilterStaffType(value === "all" ? undefined : (value as StaffRole));
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger id="filter-role">
                    <SelectValue placeholder="Tất cả vai trò" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả vai trò</SelectItem>
                    <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                    <SelectItem value="STORE_MANAGER">Quản lý cửa hàng</SelectItem>
                    <SelectItem value="WAREHOUSE_MANAGER">Quản lý kho</SelectItem>
                    <SelectItem value="WAREHOUSE_STAFF">Nhân viên kho</SelectItem>
                    <SelectItem value="SUPPORT_AGENT">Nhân viên hỗ trợ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-city">Lọc theo thành phố</Label>
                <Select
                  value={filterCity || "all"}
                  onValueChange={(value) => {
                    setFilterCity(value === "all" ? undefined : (value as City));
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger id="filter-city">
                    <SelectValue placeholder="Tất cả thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thành phố</SelectItem>
                    <SelectItem value="HANOI">Hà Nội</SelectItem>
                    <SelectItem value="HCMC">TP. Hồ Chí Minh</SelectItem>
                    <SelectItem value="DANANG">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-warehouse">Kho hàng</Label>
                <Select
                  value={filterWarehouse || "all"}
                  onValueChange={(value) => {
                    setFilterWarehouse(value === "all" ? "" : value);
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger id="filter-warehouse">
                    <SelectValue placeholder="Tất cả kho hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả kho hàng</SelectItem>
                    <SelectItem value="WH-HN-001">WH-HN-001 (Hà Nội)</SelectItem>
                    <SelectItem value="WH-HCM-001">WH-HCM-001 (TP. Hồ Chí Minh)</SelectItem>
                    <SelectItem value="WH-DN-001">WH-DN-001 (Đà Nẵng)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* <div className="space-y-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterStaffType(undefined);
                    setFilterCity(undefined);
                    setFilterWarehouse("");
                    setCurrentPage(0);
                  }}
                  className="w-full"
                >
                  Xóa bộ lọc
                </Button>
              </div> */}
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Lỗi tải danh sách nhân viên</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  Thử lại
                </Button>
              </div>
            ) : staff.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Chưa có nhân viên nào</p>
              </div>
            ) : (
              <>
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ và tên</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Thành phố</TableHead>
                    <TableHead>Kho</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s, index) => (
                    <TableRow key={s.id ?? `staff-${index}`}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                      <TableCell>{s.username || "-"}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>{s.phone || "-"}</TableCell>
                      <TableCell>{getRoleLabel(s.role)}</TableCell>
                      <TableCell>{s.city ? getCityLabel(s.city) : "-"}</TableCell>
                      <TableCell>{s.warehouse || "-"}</TableCell>
                      <TableCell>{formatDate(s.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStaff(s)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(s.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Trang {pagination.currentPage} / {pagination.totalPages} 
                    {" "}(Tổng: {pagination.totalResults} nhân viên)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={!pagination.hasPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages - 1, p + 1))}
                      disabled={!pagination.hasNext}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
