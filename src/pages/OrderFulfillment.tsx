import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, Package, Truck } from "lucide-react";
import { OrderFulfillmentService } from "../services/OrderFulfillmentService";
import { AdminAuthService, getAuthData } from "../services/AdminAuthService";
import type { Order, Consignment, UpdateConsignmentRequest, ConsignmentStatus, City } from "../models";

export default function OrderFulfillment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [consignmentDialogOpen, setConsignmentDialogOpen] = useState(false);
  const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);
  
  // Form state
  const [status, setStatus] = useState<ConsignmentStatus>("PENDING");
  const [trackingNumber, setTrackingNumber] = useState("");

  const userInfo = getAuthData();
  // Normalize role: remove ROLE_ prefix if present and convert to lowercase
  let userRole: 'admin' | 'store_manager' = 'store_manager';
  if (userInfo?.roles && userInfo.roles.length > 0) {
    const role = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
    if (role === 'admin' || role === 'store_manager') {
      userRole = role as 'admin' | 'store_manager';
    }
  } else if (userInfo?.userType) {
    const role = userInfo.userType.toLowerCase();
    if (role === 'admin' || role === 'store_manager') {
      userRole = role as 'admin' | 'store_manager';
    }
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

  // Determine city filter: Store Managers see only their city
  const effectiveCity = userRole === 'store_manager' ? userCity : undefined;

  // Fetch fulfillment queue
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ['fulfillmentQueue', effectiveCity, userRole],
    queryFn: () => OrderFulfillmentService.getInstance().getFulfillmentQueue(effectiveCity, userRole),
  });

  // Fetch consignments for selected order
  const { data: consignments = [], refetch: refetchConsignments } = useQuery({
    queryKey: ['consignments', selectedOrderId],
    queryFn: () => selectedOrderId 
      ? OrderFulfillmentService.getInstance().getConsignmentsByOrder(selectedOrderId)
      : Promise.resolve([]),
    enabled: !!selectedOrderId,
  });

  // Create consignments mutation
  const createConsignmentsMutation = useMutation({
    mutationFn: (orderId: number) => 
      OrderFulfillmentService.getInstance().createConsignments(orderId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consignments', data[0]?.orderId] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentQueue'] });
      toast({
        title: "Tạo lô hàng thành công",
        description: `Đã tạo ${data.length} lô hàng cho đơn hàng`,
      });
      if (data[0]?.orderId) {
        setSelectedOrderId(data[0].orderId);
        refetchConsignments();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo lô hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update consignment mutation
  const updateConsignmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConsignmentRequest }) => 
      OrderFulfillmentService.getInstance().updateConsignmentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignments'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentQueue'] });
      toast({
        title: "Cập nhật trạng thái thành công",
        description: "Trạng thái lô hàng đã được cập nhật",
      });
      setConsignmentDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi cập nhật trạng thái",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateConsignments = (orderId: number) => {
    if (!confirm("Bạn có chắc chắn muốn tạo lô hàng cho đơn hàng này?")) return;
    createConsignmentsMutation.mutate(orderId);
  };

  const handleUpdateConsignment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingConsignmentId) return;

    if (status === 'IN_TRANSIT' && !trackingNumber.trim()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng nhập mã vận đơn khi cập nhật trạng thái 'Đang vận chuyển'",
        variant: "destructive",
      });
      return;
    }

    const updateData: UpdateConsignmentRequest = {
      status,
      trackingNumber: trackingNumber.trim() || undefined,
    };

    updateConsignmentMutation.mutate({ id: editingConsignmentId, data: updateData });
  };

  const handleEditConsignment = (consignment: Consignment) => {
    setEditingConsignmentId(consignment.id);
    setStatus(consignment.status);
    setTrackingNumber(consignment.trackingNumber || "");
    setConsignmentDialogOpen(true);
  };

  const resetForm = () => {
    setStatus("PENDING");
    setTrackingNumber("");
    setEditingConsignmentId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setConsignmentDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xử lý";
      case "PICKED_UP":
        return "Đã lấy hàng";
      case "IN_TRANSIT":
        return "Đang vận chuyển";
      case "DELIVERED":
        return "Đã giao hàng";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Xử lý đơn hàng</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Hàng đợi xử lý</CardTitle>
            <CardDescription>
              {userRole === 'store_manager' 
                ? `Đơn hàng tại ${getCityLabel(userCity || '')}` 
                : 'Tất cả đơn hàng đã xác nhận'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Lỗi tải hàng đợi xử lý</p>
                <Button variant="outline" onClick={() => refetch()} className="mt-4">
                  Thử lại
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có đơn hàng nào cần xử lý</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Đơn hàng #{order.orderNumber}</CardTitle>
                          <CardDescription>
                            Khách hàng: {order.customerName || order.customerEmail} | 
                            Tổng tiền: {order.totalAmount.toLocaleString('vi-VN')} VNĐ
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            if (selectedOrderId === order.id) {
                              setSelectedOrderId(null);
                            }
                          }}
                          variant="outline"
                        >
                          {selectedOrderId === order.id ? "Ẩn" : "Xem"} lô hàng
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <p className="text-sm"><strong>Ngày đặt:</strong> {formatDate(order.createdAt)}</p>
                        <p className="text-sm"><strong>Trạng thái:</strong> {getStatusLabel(order.status)}</p>
                        <div className="text-sm">
                          <strong>Sản phẩm:</strong>
                          <ul className="list-disc list-inside ml-4">
                            {order.items.map((item, idx) => (
                              <li key={idx}>
                                {item.bookTitle} x{item.quantity} - {item.subtotal.toLocaleString('vi-VN')} VNĐ
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      {!consignments.length && selectedOrderId === order.id && (
                        <Button
                          onClick={() => handleCreateConsignments(order.id)}
                          disabled={createConsignmentsMutation.isPending}
                          className="w-full"
                        >
                          <Package className="mr-2 h-4 w-4" />
                          {createConsignmentsMutation.isPending ? "Đang tạo..." : "Tạo lô hàng"}
                        </Button>
                      )}

                      {selectedOrderId === order.id && consignments.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-2">Lô hàng:</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Kho</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Mã vận đơn</TableHead>
                                <TableHead>Số lượng sản phẩm</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {consignments
                                .filter(c => c.orderId === order.id)
                                .map((consignment) => (
                                <TableRow key={consignment.id}>
                                  <TableCell>{getCityLabel(consignment.warehouseCity)}</TableCell>
                                  <TableCell>{getStatusLabel(consignment.status)}</TableCell>
                                  <TableCell>{consignment.trackingNumber || "-"}</TableCell>
                                  <TableCell>{consignment.items.length}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditConsignment(consignment)}
                                    >
                                      <Truck className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={consignmentDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Cập nhật trạng thái lô hàng</DialogTitle>
              <DialogDescription>
                Cập nhật trạng thái và mã vận đơn cho lô hàng
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateConsignment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái *</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ConsignmentStatus)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="PICKED_UP">Đã lấy hàng</SelectItem>
                    <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                    <SelectItem value="DELIVERED">Đã giao hàng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="trackingNumber">Mã vận đơn</Label>
                <Input
                  id="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Nhập mã vận đơn (bắt buộc khi 'Đang vận chuyển')"
                />
                <p className="text-xs text-muted-foreground">
                  Bắt buộc khi trạng thái là "Đang vận chuyển"
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={updateConsignmentMutation.isPending}
              >
                {updateConsignmentMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

