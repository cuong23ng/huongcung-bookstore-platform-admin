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
import { ArrowLeft, Edit } from "lucide-react";
import { InventoryService } from "../services/InventoryService";
import { AdminAuthService, getAuthData } from "../services/AdminAuthService";
import type { StockLevel, AdjustStockRequest, City } from "../models";

export default function InventoryManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState<City | "all">("all");
  
  // Form state
  const [quantityChange, setQuantityChange] = useState("");
  const [reason, setReason] = useState("");

  const userInfo = getAuthData();
  // Normalize role: remove ROLE_ prefix if present and convert to lowercase
  let userRole = '';
  if (userInfo?.roles && userInfo.roles.length > 0) {
    userRole = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
  } else if (userInfo?.userType) {
    userRole = userInfo.userType.toLowerCase();
  }
  const userCity = userInfo?.city as City | undefined;

  // Check access
  useEffect(() => {
    if (!userInfo) {
      navigate("/admin/login");
      return;
    }

    if (userRole !== 'admin' && userRole !== 'store_manager') {
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ quản trị viên và quản lý cửa hàng mới có thể truy cập trang này",
        variant: "destructive",
      });
      navigate("/admin/dashboard");
    }
  }, [navigate, toast, userInfo, userRole]);

  // Determine city filter: Store Managers see only their city, Admins can filter
  const effectiveCity = userRole === 'store_manager' ? userCity : (cityFilter === 'all' ? undefined : cityFilter);

  // Fetch stock levels
  const { data: stockLevels = [], isLoading, error, refetch } = useQuery({
    queryKey: ['stockLevels', effectiveCity],
    queryFn: () => InventoryService.getInstance().getStockLevels(effectiveCity),
  });

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AdjustStockRequest }) => 
      InventoryService.getInstance().adjustStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      toast({
        title: "Điều chỉnh tồn kho thành công",
        description: "Số lượng tồn kho đã được cập nhật",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi điều chỉnh tồn kho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStockId) return;

    if (!quantityChange || !reason.trim()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    const quantity = Number.parseInt(quantityChange, 10);
    if (Number.isNaN(quantity) || quantity === 0) {
      toast({
        title: "Lỗi xác thực",
        description: "Số lượng thay đổi phải khác 0",
        variant: "destructive",
      });
      return;
    }

    const adjustData: AdjustStockRequest = {
      quantityChange: quantity,
      reason: reason.trim(),
    };

    adjustMutation.mutate({ id: editingStockId, data: adjustData });
  };

  const handleEditStock = (stock: StockLevel) => {
    setEditingStockId(stock.id);
    setQuantityChange("");
    setReason("");
    setDialogOpen(true);
  };

  const resetForm = () => {
    setQuantityChange("");
    setReason("");
    setEditingStockId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getCityLabel = (city: string) => {
    switch (city) {
      case "Hanoi":
        return "Hà Nội";
      case "HCMC":
        return "TP. Hồ Chí Minh";
      case "Da Nang":
        return "Đà Nẵng";
      default:
        return city;
    }
  };

  // Filter stock levels by search query
  const filteredStock = stockLevels.filter((stock) =>
    stock.bookTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý kho</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Mức tồn kho</CardTitle>
                <CardDescription>
                  {userRole === 'store_manager' 
                    ? `Tồn kho tại ${getCityLabel(userCity || '')}` 
                    : 'Quản lý tồn kho theo thành phố'}
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <Input
                placeholder="Tìm kiếm theo tên sách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
              {userRole === 'admin' && (
                <Select value={cityFilter} onValueChange={(value) => setCityFilter(value as City | "all")}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thành phố</SelectItem>
                    <SelectItem value="Hanoi">Hà Nội</SelectItem>
                    <SelectItem value="HCMC">TP. Hồ Chí Minh</SelectItem>
                    <SelectItem value="Da Nang">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Lỗi tải dữ liệu tồn kho</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  Thử lại
                </Button>
              </div>
            ) : filteredStock.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? "Không tìm thấy sách nào" : "Chưa có dữ liệu tồn kho"}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên sách</TableHead>
                      <TableHead>Thành phố</TableHead>
                      <TableHead>Tổng số lượng</TableHead>
                      <TableHead>Đã đặt trước</TableHead>
                      <TableHead>Có sẵn</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">{stock.bookTitle || `Book ID: ${stock.bookId}`}</TableCell>
                        <TableCell>{getCityLabel(stock.city)}</TableCell>
                        <TableCell>{stock.totalQuantity}</TableCell>
                        <TableCell>{stock.reservedQuantity}</TableCell>
                        <TableCell className={stock.availableQuantity === 0 ? "text-destructive font-semibold" : ""}>
                          {stock.availableQuantity}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStock(stock)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
                      <DialogDescription>
                        Nhập số lượng thay đổi (dương để tăng, âm để giảm) và lý do
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAdjustStock} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantityChange">Số lượng thay đổi *</Label>
                        <Input
                          id="quantityChange"
                          type="number"
                          value={quantityChange}
                          onChange={(e) => setQuantityChange(e.target.value)}
                          placeholder="Ví dụ: +10 hoặc -5"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Số dương để tăng, số âm để giảm tồn kho
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Lý do *</Label>
                        <Input
                          id="reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Nhập lý do điều chỉnh..."
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Lý do sẽ được ghi lại trong nhật ký kiểm toán
                        </p>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={adjustMutation.isPending}
                      >
                        {adjustMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

