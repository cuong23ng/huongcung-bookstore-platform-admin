import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Badge } from "../../components/ui/badge";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Package, Loader2, Eye } from "lucide-react";
import { OrderFulfillmentService } from "../../services/OrderFulfillmentService";
import { getAuthData } from "../../services/AdminAuthService";
import type { Order } from "../../models";
import { Header } from "../../components/Header";

export default function AllOrders() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get user info first before using in state initialization
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

  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<number | null>(null);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  
  // Orders list filters, pagination and sort
  const [orderStatusFilter, setOrderStatusFilter] = useState<string | undefined>(undefined);
  const [orderNumberFilter, setOrderNumberFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [orderPage, setOrderPage] = useState(0);
  const [orderPageSize] = useState(20);
  const [orderSort, setOrderSort] = useState<"createdAt,desc" | "createdAt,asc">("createdAt,desc");

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

  // Fetch all orders
  const { data: ordersData, isLoading: isLoadingOrders, refetch: refetchOrders } = useQuery<{ orders: Order[]; pagination: { page: number; size: number; totalElements: number; totalPages: number } }>({
    queryKey: ['allOrders', orderStatusFilter, orderNumberFilter, customerFilter, orderPage, orderPageSize, orderSort],
    queryFn: () => OrderFulfillmentService.getInstance().getOrders(
      orderPage,
      orderPageSize,
      orderStatusFilter,
      orderNumberFilter || undefined,
      customerFilter || undefined,
      undefined,
      undefined,
      orderSort
    ),
  });

  // Fetch order details
  const { data: orderDetails, isLoading: isLoadingOrderDetails } = useQuery<Order>({
    queryKey: ['orderDetails', selectedOrderForDetails],
    queryFn: () => selectedOrderForDetails 
      ? OrderFulfillmentService.getInstance().getOrderDetails(selectedOrderForDetails)
      : Promise.resolve({} as Order),
    enabled: !!selectedOrderForDetails && orderDetailsDialogOpen,
  });

  // Create consignments mutation
  const createConsignmentsMutation = useMutation({
    mutationFn: (orderId: number) => 
      OrderFulfillmentService.getInstance().createConsignments(orderId),
    onSuccess: (data, orderId) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['consignments', orderId] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentQueue'] });
      queryClient.invalidateQueries({ queryKey: ['orderDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['allOrders'] });
      toast({
        title: "Tạo lô hàng thành công",
        description: "Đã tạo lô hàng và dự trữ kho cho đơn hàng",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo lô hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateConsignments = (orderId: number) => {
    if (!confirm("Bạn có chắc chắn muốn tạo lô hàng cho đơn hàng này?")) return;
    createConsignmentsMutation.mutate(orderId);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Chờ xử lý";
      case "WAITING_PAYMENT":
        return "Chờ thanh toán";
      case "PICKED_UP":
        return "Đã lấy hàng";
      case "IN_TRANSIT":
        return "Đang vận chuyển";
      case "OUT_FOR_DELIVERY":
        return "Đang giao hàng";
      case "DELIVERED":
        return "Đã giao hàng";
      case "FAILED_DELIVERY":
        return "Giao hàng thất bại";
      case "RETURNED":
        return "Đã trả hàng";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "PENDING":
        return "secondary";
      case "PICKED_UP":
      case "IN_TRANSIT":
      case "OUT_FOR_DELIVERY":
        return "default";
      case "DELIVERED":
        return "default";
      case "FAILED_DELIVERY":
      case "RETURNED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
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
      {/* <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Tất cả đơn hàng</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tất cả đơn hàng</CardTitle>
            <CardDescription>
              Xem và quản lý tất cả đơn hàng trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <Label htmlFor="order-number-filter">Mã đơn hàng</Label>
                <Input
                  id="order-number-filter"
                  placeholder="Nhập mã đơn hàng"
                  value={orderNumberFilter}
                  onChange={(e) => {
                    setOrderNumberFilter(e.target.value);
                    setOrderPage(0);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="customer-filter">Khách hàng</Label>
                <Input
                  id="customer-filter"
                  placeholder="Tên hoặc email"
                  value={customerFilter}
                  onChange={(e) => {
                    setCustomerFilter(e.target.value);
                    setOrderPage(0);
                  }}
                />
              </div>
              <div>
                <Label htmlFor="order-status-filter">Trạng thái</Label>
                <Select
                  value={orderStatusFilter || 'all'}
                  onValueChange={(value) => {
                    setOrderStatusFilter(value === 'all' ? undefined : value);
                    setOrderPage(0);
                  }}
                >
                  <SelectTrigger id="order-status-filter">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                    <SelectItem value="WAITING_PAYMENT">Chờ thanh toán</SelectItem>
                    <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                    <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                    <SelectItem value="SHIPPED">Đã gửi hàng</SelectItem>
                    <SelectItem value="DELIVERED">Đã giao hàng</SelectItem>
                    <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order-sort">Sắp xếp</Label>
                <Select
                  value={orderSort}
                  onValueChange={(value: "createdAt,desc" | "createdAt,asc") => {
                    setOrderSort(value);
                    setOrderPage(0);
                  }}
                >
                  <SelectTrigger id="order-sort">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt,desc">Mới nhất</SelectItem>
                    <SelectItem value="createdAt,asc">Cũ nhất</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orders Table */}
            {isLoadingOrders ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : !ordersData?.orders || ordersData.orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có đơn hàng nào</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn hàng</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordersData.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customerName || '-'}</div>
                            <div className="text-xs text-muted-foreground">{order.customerEmail || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{order.totalAmount?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrderForDetails(order.id);
                                setOrderDetailsDialogOpen(true);
                              }}
                              title="Xem chi tiết"
                              className="border-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateConsignments(order.id)}
                              disabled={createConsignmentsMutation.isPending || order.status !== 'CONFIRMED'}
                              title="Tạo lô hàng"
                              className="border-0"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {ordersData.pagination && ordersData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Trang {ordersData.pagination.page + 1} / {ordersData.pagination.totalPages} 
                      ({ordersData.pagination.totalElements} đơn hàng)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderPage(Math.max(0, orderPage - 1))}
                        disabled={orderPage === 0}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOrderPage(Math.min(ordersData.pagination.totalPages - 1, orderPage + 1))}
                        disabled={orderPage >= ordersData.pagination.totalPages - 1}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết đơn hàng</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về đơn hàng
              </DialogDescription>
            </DialogHeader>
            {isLoadingOrderDetails ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : orderDetails ? (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mã đơn hàng</Label>
                    <p className="text-lg font-semibold">{orderDetails.orderNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Trạng thái</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusBadgeVariant(orderDetails.status)}>
                        {getStatusLabel(orderDetails.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ngày đặt</Label>
                    <p>{formatDate(orderDetails.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Thanh toán</Label>
                    <div className="mt-1">
                      {orderDetails.paymentStatus ? (
                        <Badge variant={orderDetails.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                          {orderDetails.paymentStatus === 'PAID' ? 'Đã thanh toán' : orderDetails.paymentStatus === 'PENDING' ? 'Chờ thanh toán' : 'Đã hoàn tiền'}
                        </Badge>
                      ) : '-'}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                {(orderDetails.customerName || orderDetails.customerEmail) && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Khách hàng</Label>
                    <div className="mt-1 space-y-1">
                      {orderDetails.customerName && <p className="font-medium">{orderDetails.customerName}</p>}
                      {orderDetails.customerEmail && <p className="text-sm text-muted-foreground">{orderDetails.customerEmail}</p>}
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                {orderDetails.shippingAddress && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Địa chỉ giao hàng</Label>
                    <div className="mt-1 space-y-1">
                      {typeof orderDetails.shippingAddress === 'object' && orderDetails.shippingAddress !== null ? (
                        <>
                          {orderDetails.shippingAddress.name && (
                            <p className="font-medium">{orderDetails.shippingAddress.name}</p>
                          )}
                          {orderDetails.shippingAddress.phone && (
                            <p className="text-sm text-muted-foreground">Điện thoại: {orderDetails.shippingAddress.phone}</p>
                          )}
                          {orderDetails.shippingAddress.address && (
                            <p>{orderDetails.shippingAddress.address}</p>
                          )}
                          {(orderDetails.shippingAddress.ward?.wardName || 
                            orderDetails.shippingAddress.district?.districtName || 
                            orderDetails.shippingAddress.province?.provinceName) && (
                            <p className="text-sm text-muted-foreground">
                              {[
                                orderDetails.shippingAddress.ward?.wardName,
                                orderDetails.shippingAddress.district?.districtName,
                                orderDetails.shippingAddress.province?.provinceName
                              ].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p>{orderDetails.shippingAddress}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Consignments */}
                {orderDetails.consignments && orderDetails.consignments.length > 0 ? (
                  <div className="space-y-6">
                    {orderDetails.consignments.map((consignment) => (
                      <Card key={consignment.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">Lô hàng: {consignment.code}</CardTitle>
                              <CardDescription>
                                Kho: {getCityLabel(consignment.warehouseCity)} | 
                                Trạng thái: {getStatusLabel(consignment.status)}
                                {consignment.trackingNumber && ` | Mã vận đơn: ${consignment.trackingNumber}`}
                              </CardDescription>
                            </div>
                            <Badge variant={getStatusBadgeVariant(consignment.status)}>
                              {getStatusLabel(consignment.status)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Consignment Info */}
                          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                            {consignment.shippingCompany && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Đơn vị vận chuyển</Label>
                                <p>{consignment.shippingCompany}</p>
                              </div>
                            )}
                            {consignment.estimatedDeliveryDate && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Ngày dự kiến giao</Label>
                                <p>{formatDate(consignment.estimatedDeliveryDate)}</p>
                              </div>
                            )}
                            {consignment.actualDeliveryDate && (
                              <div>
                                <Label className="text-xs text-muted-foreground">Ngày giao thực tế</Label>
                                <p>{formatDate(consignment.actualDeliveryDate)}</p>
                              </div>
                            )}
                            <div>
                              <Label className="text-xs text-muted-foreground">Tổng tiền lô hàng</Label>
                              <p className="font-semibold">{consignment.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</p>
                            </div>
                          </div>

                          {/* Consignment Items */}
                          {consignment.entries && consignment.entries.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Sản phẩm trong lô hàng</Label>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Sản phẩm</TableHead>
                                    <TableHead>Số lượng</TableHead>
                                    <TableHead>Đã gửi</TableHead>
                                    <TableHead>Đơn giá</TableHead>
                                    <TableHead className="text-right">Thành tiền</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {consignment.entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                      <TableCell className="font-medium">{entry.bookTitle}</TableCell>
                                      <TableCell>{entry.quantity}</TableCell>
                                      <TableCell>{entry.shippedQuantity || 0}</TableCell>
                                      <TableCell>{entry.unitPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                                      <TableCell className="text-right">{entry.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
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
                ) : orderDetails.items && orderDetails.items.length > 0 ? (
                  // Fallback to items if no consignments
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Sản phẩm</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>Loại</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Đơn giá</TableHead>
                          <TableHead className="text-right">Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orderDetails.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.bookTitle}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.itemType === 'PHYSICAL' ? 'Sách giấy' : 'Sách điện tử'}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{item.unitPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                            <TableCell className="text-right">{item.subtotal?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="space-y-2 text-right">
                      <div className="text-lg font-semibold">
                        Tổng tiền: {orderDetails.totalAmount?.toLocaleString('vi-VN') || 0} VNĐ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không tìm thấy thông tin đơn hàng</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
