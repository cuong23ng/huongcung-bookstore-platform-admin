import { useState } from "react";
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
import { ArrowLeft, Loader2, Ship, Package, X, Eye } from "lucide-react";
import { InventoryService } from "../../services/InventoryService";
import { getAuthData } from "../../services/AdminAuthService";
import { Header } from "../../components/Header";
import type { Consignment, City, ConsignmentShipRequest, PaginatedConsignmentResponse, SaleOrder, SaleOrderStatus, PaginatedSaleOrdersResponse } from "../../models";

export default function AllConsignments() {
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
  const userCity = userInfo?.city as City | undefined;
  
  // Consignments management filters
  const [codeFilter, setCodeFilter] = useState<string | undefined>();
  const [consignmentCityFilter, setConsignmentCityFilter] = useState<City | undefined>(userRole === 'store_manager' ? userCity : undefined);
  const [warehouseFilter, setWarehouseFilter] = useState<string | undefined>();
  const [consignmentStatusFilter, setConsignmentStatusFilter] = useState<SaleOrderStatus | undefined>('PENDING');
  const [startDateFilter, setStartDateFilter] = useState<string | undefined>();
  const [endDateFilter, setEndDateFilter] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [consignmentPage, setConsignmentPage] = useState(0);
  const [consignmentPageSize] = useState(20);
  
  // Form state for ship consignment
  const [shipStatus, setShipStatus] = useState<'PICKED_UP' | 'IN_TRANSIT'>('PICKED_UP');
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);

  // State for sale order details dialog
  const [saleOrderDetailsDialogOpen, setSaleOrderDetailsDialogOpen] = useState(false);
  const [selectedSaleOrderId, setSelectedSaleOrderId] = useState<number | null>(null);

  // Helper function to format date for API (yyyy-MM-dd HH:mm:ss)
  const formatDateForAPI = (dateString: string | undefined, isEndDate: boolean = false): string | undefined => {
    if (!dateString) return undefined;
    // HTML5 date input returns YYYY-MM-DD format
    // Append time: 00:00:00 for start, 23:59:59 for end
    return isEndDate ? `${dateString} 23:59:59` : `${dateString} 00:00:00`;
  };

  // Helper function to format date and time for display
  const formatDateTime = (dateString: string | undefined | null): string => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    } catch (error) {
      return "-";
    }
  };

  // Helper function to map SaleOrder to Consignment format
  const mapSaleOrderToConsignment = (saleOrder: SaleOrder): Consignment => {
    return {
      id: saleOrder.id,
      code: saleOrder.code,
      orderId: saleOrder.orderId || 0,
      orderNumber: saleOrder.orderNumber,
      status: saleOrder.status as any,
      trackingNumber: saleOrder.trackingNumber,
      shippingCompany: saleOrder.shippingCompany,
      estimatedDeliveryDate: saleOrder.estimatedDeliveryDate,
      actualDeliveryDate: saleOrder.actualDeliveryDate,
      shippingAddress: saleOrder.shippingAddress ? JSON.stringify(saleOrder.shippingAddress) : undefined,
      notes: saleOrder.notes,
      totalPrice: saleOrder.totalPrice,
      codAmount: saleOrder.codAmount,
      warehouseCity: saleOrder.warehouseCity,
      warehouseId: saleOrder.warehouseId,
      warehouseCode: saleOrder.warehouseCode,
      customerName: saleOrder.customerName,
      customerEmail: saleOrder.customerEmail,
      entries: saleOrder.entries.map(entry => ({
        id: entry.id,
        orderEntryId: 0, // Not available in SaleOrderEntry
        bookId: 0, // Not available in SaleOrderEntry
        bookTitle: entry.sku, // Using SKU as fallback
        bookCode: entry.sku,
        quantity: entry.quantity,
        shippedQuantity: entry.shippedQuantity,
        unitPrice: entry.unitPrice,
        totalPrice: entry.totalPrice
      })),
      createdAt: saleOrder.createdAt,
      updatedAt: saleOrder.updatedAt
    };
  };

  // Fetch sale orders for management section
  const { data: saleOrdersData, isLoading: isLoadingConsignments } = useQuery<PaginatedSaleOrdersResponse>({
    queryKey: ['saleOrdersList', codeFilter, consignmentCityFilter, warehouseFilter, consignmentStatusFilter, startDateFilter, endDateFilter, sortOrder, consignmentPage, consignmentPageSize],
    queryFn: () => InventoryService.getInstance().getSaleOrders({
      page: consignmentPage,
      size: consignmentPageSize,
      code: codeFilter,
      city: consignmentCityFilter,
      warehouse: warehouseFilter,
      status: consignmentStatusFilter,
      startTime: formatDateForAPI(startDateFilter, false),
      endTime: formatDateForAPI(endDateFilter, true),
      sort: `createdAt,${sortOrder}`
    }),
  });

  // Map sale orders to consignments for display
  const consignmentsData: PaginatedConsignmentResponse | undefined = saleOrdersData ? {
    consignments: saleOrdersData.saleOrders.map(mapSaleOrderToConsignment),
    pagination: saleOrdersData.pagination
  } : undefined;

  // Fetch sale order details
  const { data: saleOrderDetails, isLoading: isLoadingSaleOrderDetails } = useQuery<SaleOrder>({
    queryKey: ['saleOrderDetails', selectedSaleOrderId],
    queryFn: () => InventoryService.getInstance().getSaleOrderById(selectedSaleOrderId!),
    enabled: !!selectedSaleOrderId && saleOrderDetailsDialogOpen,
  });

  // Ship consignment mutation
  const shipConsignmentMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: ConsignmentShipRequest }) => 
      InventoryService.getInstance().shipSaleOrder(id, request.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saleOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['createdSaleOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillmentQueue'] });
      toast({
        title: "Gửi hàng thành công",
        description: "Lô hàng đã được đánh dấu là đã gửi",
      });
      setShipDialogOpen(false);
      resetShipForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi gửi hàng",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetShipForm = () => {
    setShipStatus('PICKED_UP');
    setEditingConsignmentId(null);
  };

  const handleShipDialogClose = (open: boolean) => {
    setShipDialogOpen(open);
    if (!open) {
      resetShipForm();
    }
  };

  const handleShipConsignment = (consignment: Consignment) => {
    if (consignment.status !== 'PENDING') {
      toast({
        title: "Không thể gửi hàng",
        description: "Chỉ có thể gửi hàng cho lô hàng ở trạng thái 'Chờ xử lý'",
        variant: "destructive",
      });
      return;
    }
    setEditingConsignmentId(consignment.id);
    setShipDialogOpen(true);
  };

  const handleShipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingConsignmentId) return;

    const shipRequest: ConsignmentShipRequest = {
      status: shipStatus,
    };

    shipConsignmentMutation.mutate({ id: editingConsignmentId, request: shipRequest });
  };

  // Create shipping order mutation
  const createShippingOrderMutation = useMutation({
    mutationFn: (saleOrderId: number) => 
      InventoryService.getInstance().createShippingOrder(saleOrderId),
    onSuccess: (trackingNumber) => {
      queryClient.invalidateQueries({ queryKey: ['saleOrdersList'] });
      queryClient.invalidateQueries({ queryKey: ['createdSaleOrdersList'] });
      toast({
        title: "Tạo đơn vận chuyển thành công",
        description: `Mã vận đơn: ${trackingNumber}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi tạo đơn vận chuyển",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateShippingOrder = (consignmentId: number) => {
    if (!confirm("Bạn có chắc chắn muốn tạo đơn vận chuyển cho lô hàng này?")) return;
    createShippingOrderMutation.mutate(consignmentId);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CREATED":
        return "Đã tạo";
      case "PENDING":
        return "Chờ xử lý";
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
      default:
        return status;
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "CREATED":
        return "outline";
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
        return "destructive";
      default:
        return "outline";
    }
  };

  const getCityLabel = (city: string | City) => {
    switch (city) {
      case "HANOI":
      case "Hanoi":
        return "Hà Nội";
      case "HCMC":
        return "TP. Hồ Chí Minh";
      case "DANANG":
      case "Da Nang":
        return "Đà Nẵng";
      default:
        return city;
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
          <h1 className="text-2xl font-bold text-foreground">Tất cả lô hàng</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Tất cả lô hàng</CardTitle>
            <CardDescription>
              {userRole === 'store_manager' 
                ? `Lô hàng tại ${getCityLabel(userCity || '')}` 
                : 'Tất cả lô hàng'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="code-filter">Mã lô hàng</Label>
                  <Input
                    id="code-filter"
                    placeholder="Nhập mã lô hàng"
                    value={codeFilter || ''}
                    onChange={(e) => setCodeFilter(e.target.value || undefined)}
                  />
                </div>
              {userRole === 'admin' && (
                  <>
                    <div>
                  <Label htmlFor="city-filter">Thành phố</Label>
                  <Select
                    value={consignmentCityFilter || 'all'}
                    onValueChange={(value) => setConsignmentCityFilter(value === 'all' ? undefined : value as City)}
                  >
                    <SelectTrigger id="city-filter">
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
                    <div>
                      <Label htmlFor="warehouse-filter">Kho</Label>
                      <Select
                        value={warehouseFilter || 'all'}
                        onValueChange={(value) => setWarehouseFilter(value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger id="warehouse-filter">
                          <SelectValue placeholder="Tất cả kho" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả kho</SelectItem>
                          <SelectItem value="WH-HN-001">WH-HN-001</SelectItem>
                          <SelectItem value="WH-DN-001">WH-DN-001</SelectItem>
                          <SelectItem value="WH-HCM-001">WH-HCM-001</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div>
                <Label htmlFor="status-filter">Trạng thái</Label>
                <Select
                  value={consignmentStatusFilter || 'all'}
                    onValueChange={(value) => setConsignmentStatusFilter(value === 'all' ? undefined : value as SaleOrderStatus)}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="CREATED">Đã tạo</SelectItem>
                      <SelectItem value="PENDING">Chờ xử lý</SelectItem>
                      <SelectItem value="PICKED_UP">Đã lấy hàng</SelectItem>
                      <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                      <SelectItem value="OUT_FOR_DELIVERY">Đang giao hàng</SelectItem>
                      <SelectItem value="DELIVERED">Đã giao hàng</SelectItem>
                      <SelectItem value="FAILED_DELIVERY">Giao hàng thất bại</SelectItem>
                      <SelectItem value="RETURNED">Đã trả hàng</SelectItem>
                    </SelectContent>
                </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="start-date">Từ ngày</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDateFilter || ''}
                    onChange={(e) => setStartDateFilter(e.target.value || undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Đến ngày</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDateFilter || ''}
                    onChange={(e) => setEndDateFilter(e.target.value || undefined)}
                    min={startDateFilter || undefined}
                  />
                </div>
                <div>
                  <Label htmlFor="sort">Sắp xếp</Label>
                  <Select
                    value={sortOrder}
                    onValueChange={(value) => setSortOrder(value as 'asc' | 'desc')}
                  >
                    <SelectTrigger id="sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Mới nhất</SelectItem>
                      <SelectItem value="asc">Cũ nhất</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCodeFilter(undefined);
                      setConsignmentCityFilter(userRole === 'store_manager' ? userCity : undefined);
                      setWarehouseFilter(undefined);
                      setConsignmentStatusFilter('PENDING');
                      setStartDateFilter(undefined);
                      setEndDateFilter(undefined);
                      setSortOrder('desc');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>

            {/* Consignments Table */}
            {isLoadingConsignments ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : !consignmentsData?.consignments || consignmentsData.consignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có lô hàng nào</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã lô hàng</TableHead>
                      <TableHead>Đơn hàng</TableHead>
                      <TableHead>Kho</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Mã vận đơn</TableHead>
                      <TableHead>Thời gian tạo</TableHead>
                      <TableHead>Số lượng sản phẩm</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consignmentsData.consignments.map((consignment) => (
                      <TableRow key={consignment.id}>
                        <TableCell className="font-medium">{consignment.code}</TableCell>
                        <TableCell>{consignment.orderNumber}</TableCell>
                        <TableCell>{getCityLabel(consignment.warehouseCity)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(consignment.status)}>
                            {getStatusLabel(consignment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{consignment.trackingNumber || "-"}</TableCell>
                        <TableCell>{formatDateTime(consignment.createdAt)}</TableCell>
                        <TableCell>{consignment.entries?.length || 0}</TableCell>
                        <TableCell>{consignment.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="border-0 h-8 w-8 p-0"
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedSaleOrderId(consignment.id);
                                setSaleOrderDetailsDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="border-0 h-8 w-8 p-0"
                              title={consignment.status === 'CREATED' ? "Tạo đơn vận chuyển" : "Chỉ có thể tạo đơn vận chuyển khi trạng thái là 'Đã tạo'"}
                              onClick={() => handleCreateShippingOrder(consignment.id)}
                              disabled={consignment.status !== 'CREATED' || createShippingOrderMutation.isPending}
                            >
                              {createShippingOrderMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Package className="h-4 w-4" />
                              )}
                            </Button>
                          {consignment.status === 'PENDING' && (
                            <Button
                                variant="ghost"
                              size="sm"
                                className="border-0 h-8 w-8 p-0"
                                title="Gửi hàng"
                              onClick={() => handleShipConsignment(consignment)}
                              disabled={shipConsignmentMutation.isPending}
                            >
                                {shipConsignmentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Ship className="h-4 w-4" />
                                )}
                            </Button>
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {consignmentsData.pagination && consignmentsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Trang {consignmentsData.pagination.page + 1} / {consignmentsData.pagination.totalPages} 
                      ({consignmentsData.pagination.totalElements} lô hàng)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConsignmentPage(Math.max(0, consignmentPage - 1))}
                        disabled={consignmentPage === 0}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConsignmentPage(Math.min(consignmentsData.pagination.totalPages - 1, consignmentPage + 1))}
                        disabled={consignmentPage >= consignmentsData.pagination.totalPages - 1}
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

        {/* Ship Consignment Dialog */}
        <Dialog open={shipDialogOpen} onOpenChange={handleShipDialogClose}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Gửi lô hàng</DialogTitle>
              <DialogDescription>
                Đánh dấu lô hàng đã được gửi
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleShipSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ship-status">Trạng thái *</Label>
                <Select value={shipStatus} onValueChange={(value) => setShipStatus(value as 'PICKED_UP' | 'IN_TRANSIT')} required>
                  <SelectTrigger id="ship-status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PICKED_UP">Đã lấy hàng</SelectItem>
                    <SelectItem value="IN_TRANSIT">Đang vận chuyển</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={shipConsignmentMutation.isPending}
              >
                {shipConsignmentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Ship className="mr-2 h-4 w-4" />
                    Gửi hàng
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Sale Order Details Dialog */}
        <Dialog open={saleOrderDetailsDialogOpen} onOpenChange={setSaleOrderDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chi tiết lô hàng</DialogTitle>
              <DialogDescription>
                Thông tin chi tiết của lô hàng
              </DialogDescription>
            </DialogHeader>
            {isLoadingSaleOrderDetails ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : saleOrderDetails ? (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mã lô hàng</Label>
                    <p className="font-semibold">{saleOrderDetails.code}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Đơn hàng</Label>
                    <p>{saleOrderDetails.orderNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Trạng thái</Label>
                    <div>
                      <Badge variant={getStatusBadgeVariant(saleOrderDetails.status)}>
                        {getStatusLabel(saleOrderDetails.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Kho</Label>
                    <p>{getCityLabel(saleOrderDetails.warehouseCity || '')} - {saleOrderDetails.warehouseCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Mã vận đơn</Label>
                    <p>{saleOrderDetails.trackingNumber || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Thời gian tạo</Label>
                    <p>{formatDateTime(saleOrderDetails.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tổng tiền</Label>
                    <p className="font-semibold">{saleOrderDetails.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phí vận chuyển</Label>
                    <p>{saleOrderDetails.shippingAmount?.toLocaleString('vi-VN') || 0} VNĐ</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">COD</Label>
                    <p>{saleOrderDetails.codAmount?.toLocaleString('vi-VN') || 0} VNĐ</p>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">Thông tin khách hàng</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tên khách hàng</Label>
                      <p>{saleOrderDetails.customerName || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Số điện thoại</Label>
                      <p>{saleOrderDetails.customerPhone || '-'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Địa chỉ giao hàng</Label>
                      <p className="break-words">{saleOrderDetails.formattedShippingAddress || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Entries */}
                {saleOrderDetails.entries && saleOrderDetails.entries.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Danh sách sản phẩm</Label>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sản phẩm</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Số lượng</TableHead>
                          <TableHead>Đã giao</TableHead>
                          <TableHead>Trọng lượng</TableHead>
                          <TableHead>Kích thước</TableHead>
                          <TableHead>Đơn giá</TableHead>
                          <TableHead>Thành tiền</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleOrderDetails.entries.map((entry) => {
                          const dimensions = [];
                          if (entry.length) dimensions.push(`${entry.length}cm`);
                          if (entry.width) dimensions.push(`${entry.width}cm`);
                          if (entry.height) dimensions.push(`${entry.height}cm`);
                          const dimensionStr = dimensions.length > 0 ? dimensions.join(' x ') : '-';
                          
                          return (
                            <TableRow key={entry.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{entry.bookTitle || entry.sku || '-'}</div>
                                  {entry.bookCode && (
                                    <div className="text-xs text-muted-foreground">Mã: {entry.bookCode}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{entry.sku}</TableCell>
                              <TableCell>{entry.quantity}</TableCell>
                              <TableCell>{entry.shippedQuantity || 0}</TableCell>
                              <TableCell>{entry.weight ? `${entry.weight}g` : '-'}</TableCell>
                              <TableCell>{dimensionStr}</TableCell>
                              <TableCell>{entry.unitPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                              <TableCell>{entry.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Notes */}
                {saleOrderDetails.notes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ghi chú</Label>
                    <p className="mt-1">{saleOrderDetails.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không tìm thấy thông tin lô hàng</p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
