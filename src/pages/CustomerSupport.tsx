import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, Search, X } from "lucide-react";
import { CustomerSupportService } from "../services/CustomerSupportService";
import { AdminAuthService, getAuthData } from "../services/AdminAuthService";
import type { Customer, Order, OrderDetails } from "../models";

export default function CustomerSupport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchType, setSearchType] = useState<"email" | "phone">("email");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const userInfo = getAuthData();
  // Normalize role: remove ROLE_ prefix if present and convert to lowercase
  let userRole = '';
  if (userInfo?.roles && userInfo.roles.length > 0) {
    userRole = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
  } else if (userInfo?.userType) {
    userRole = userInfo.userType.toLowerCase();
  }

  // Check access
  useEffect(() => {
    if (!userInfo) {
      navigate("/admin/login");
      return;
    }

    if (userRole !== 'admin' && userRole !== 'support_agent') {
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ quản trị viên và nhân viên hỗ trợ mới có thể truy cập trang này",
        variant: "destructive",
      });
      navigate("/admin/dashboard");
    }
  }, [navigate, toast, userInfo, userRole]);

  // Customer lookup query
  const { data: customer, isLoading: isSearching, refetch: searchCustomer } = useQuery({
    queryKey: ['customerLookup', searchQuery, searchType],
    queryFn: () => {
      const query = searchType === "email" 
        ? { email: searchQuery }
        : { phone: searchQuery };
      return CustomerSupportService.getInstance().lookupCustomer(query);
    },
    enabled: false, // Manual trigger
  });

  // Customer orders query
  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['customerOrders', selectedCustomer?.id, currentPage],
    queryFn: () => selectedCustomer 
      ? CustomerSupportService.getInstance().getCustomerOrders(selectedCustomer.id, currentPage)
      : Promise.resolve({ orders: [], pagination: { page: 1, size: 20, totalElements: 0, totalPages: 0 } }),
    enabled: !!selectedCustomer,
  });

  // Order details query
  const { data: orderDetails } = useQuery({
    queryKey: ['orderDetails', selectedOrderId],
    queryFn: () => selectedOrderId 
      ? CustomerSupportService.getInstance().getOrderDetails(selectedOrderId)
      : Promise.resolve(null),
    enabled: !!selectedOrderId,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason?: string }) => 
      CustomerSupportService.getInstance().cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerOrders'] });
      queryClient.invalidateQueries({ queryKey: ['orderDetails'] });
      toast({
        title: "Hủy đơn hàng thành công",
        description: "Đơn hàng đã được hủy và số lượng tồn kho đã được giải phóng",
      });
      setCancelDialogOpen(false);
      setCancelReason("");
      setSelectedOrderId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi hủy đơn hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng nhập email hoặc số điện thoại",
        variant: "destructive",
      });
      return;
    }
    await searchCustomer();
  };

  useEffect(() => {
    if (customer) {
      setSelectedCustomer(customer);
      setCurrentPage(1);
    }
  }, [customer]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId) return;
    cancelOrderMutation.mutate({ orderId: selectedOrderId, reason: cancelReason.trim() || undefined });
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xử lý";
      case "CONFIRMED":
        return "Đã xác nhận";
      case "PROCESSING":
        return "Đang xử lý";
      case "SHIPPED":
        return "Đã giao hàng";
      case "DELIVERED":
        return "Đã nhận hàng";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case "BRONZE":
        return "Đồng";
      case "SILVER":
        return "Bạc";
      case "GOLD":
        return "Vàng";
      case "PLATINUM":
        return "Bạch kim";
      default:
        return tier;
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

  const canCancelOrder = (order: Order) => {
    return order.status === "PENDING" || order.status === "CONFIRMED";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Hỗ trợ khách hàng</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Customer Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm khách hàng</CardTitle>
            <CardDescription>Tìm kiếm khách hàng theo email hoặc số điện thoại</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  type={searchType === "email" ? "email" : "tel"}
                  placeholder={searchType === "email" ? "Nhập email..." : "Nhập số điện thoại..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={searchType === "email" ? "default" : "outline"}
                  onClick={() => setSearchType("email")}
                >
                  Email
                </Button>
                <Button
                  type="button"
                  variant={searchType === "phone" ? "default" : "outline"}
                  onClick={() => setSearchType("phone")}
                >
                  Số điện thoại
                </Button>
                <Button type="submit" disabled={isSearching}>
                  <Search className="mr-2 h-4 w-4" />
                  {isSearching ? "Đang tìm..." : "Tìm kiếm"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Customer Profile */}
        {selectedCustomer && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Thông tin khách hàng</CardTitle>
                  <CardDescription>
                    {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </CardDescription>
                </div>
                <Button variant="ghost" onClick={() => {
                  setSelectedCustomer(null);
                  setSelectedOrderId(null);
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCustomer.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số điện thoại</p>
                  <p className="font-medium">{selectedCustomer.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hạng thành viên</p>
                  <p className="font-medium">{getTierLabel(selectedCustomer.loyaltyTier)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Điểm tích lũy</p>
                  <p className="font-medium">{selectedCustomer.pointsBalance || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Orders */}
        {selectedCustomer && ordersData && (
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử đơn hàng</CardTitle>
              <CardDescription>
                Trang {ordersData.pagination.page} / {ordersData.pagination.totalPages}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : ordersData.orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Khách hàng chưa có đơn hàng nào</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Ngày đặt</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Tổng tiền</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ordersData.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{getStatusLabel(order.status)}</TableCell>
                          <TableCell>{order.totalAmount.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrderId(order.id)}
                              >
                                Xem chi tiết
                              </Button>
                              {canCancelOrder(order) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  Hủy đơn
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Trang {currentPage} / {ordersData.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(ordersData.pagination.totalPages, p + 1))}
                      disabled={currentPage >= ordersData.pagination.totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {orderDetails && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Chi tiết đơn hàng #{orderDetails.orderNumber}</CardTitle>
                  <CardDescription>Trạng thái: {getStatusLabel(orderDetails.status)}</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedOrderId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Thông tin giao hàng</h4>
                  <p className="text-sm">{orderDetails.shippingAddress}</p>
                  {orderDetails.phone && <p className="text-sm">Điện thoại: {orderDetails.phone}</p>}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Sản phẩm</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Đơn giá</TableHead>
                        <TableHead>Tổng</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderDetails.items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{item.bookTitle}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unitPrice.toLocaleString('vi-VN')} VNĐ</TableCell>
                          <TableCell>{item.subtotal.toLocaleString('vi-VN')} VNĐ</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {orderDetails.consignments && orderDetails.consignments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Lô hàng</h4>
                    <div className="space-y-2">
                      {orderDetails.consignments.map((consignment) => (
                        <div key={consignment.id} className="border p-3 rounded">
                          <p className="text-sm">
                            <strong>Kho:</strong> {consignment.warehouseCity} | 
                            <strong> Trạng thái:</strong> {getStatusLabel(consignment.status)}
                            {consignment.trackingNumber && (
                              <> | <strong>Mã vận đơn:</strong> {consignment.trackingNumber}</>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hủy đơn hàng</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn hủy đơn hàng này? Số lượng tồn kho sẽ được giải phóng.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Lý do hủy (tùy chọn)</Label>
                <Input
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy đơn hàng..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" variant="destructive" disabled={cancelOrderMutation.isPending}>
                  {cancelOrderMutation.isPending ? "Đang xử lý..." : "Xác nhận hủy"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

