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
import { ArrowLeft, Loader2, Package, X, Eye } from "lucide-react";
import { InventoryService } from "../../services/InventoryService";
import { getAuthData } from "../../services/AdminAuthService";
import type { Consignment, City, PaginatedConsignmentResponse, SaleOrder, PaginatedSaleOrdersResponse } from "../../models";
import { Header } from "../../components/Header";

export default function CreatedConsignments() {
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
  
  // Filters for CREATED consignments
  const [createdCodeFilter, setCreatedCodeFilter] = useState<string | undefined>();
  const [createdConsignmentCityFilter, setCreatedConsignmentCityFilter] = useState<City | undefined>(userRole === 'store_manager' ? userCity : undefined);
  const [createdWarehouseFilter, setCreatedWarehouseFilter] = useState<string | undefined>();
  const [createdStartDateFilter, setCreatedStartDateFilter] = useState<string | undefined>();
  const [createdEndDateFilter, setCreatedEndDateFilter] = useState<string | undefined>();
  const [createdSortOrder, setCreatedSortOrder] = useState<'asc' | 'desc'>('desc');
  const [createdConsignmentPage, setCreatedConsignmentPage] = useState(0);
  const [createdConsignmentPageSize] = useState(20);

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

  // Fetch CREATED sale orders
  const { data: createdSaleOrdersData, isLoading: isLoadingCreatedConsignments } = useQuery<PaginatedSaleOrdersResponse>({
    queryKey: ['createdSaleOrdersList', createdCodeFilter, createdConsignmentCityFilter, createdWarehouseFilter, createdStartDateFilter, createdEndDateFilter, createdSortOrder, createdConsignmentPage, createdConsignmentPageSize],
    queryFn: () => InventoryService.getInstance().getSaleOrders({
      page: createdConsignmentPage,
      size: createdConsignmentPageSize,
      code: createdCodeFilter,
      city: createdConsignmentCityFilter,
      warehouse: createdWarehouseFilter,
      status: 'CREATED',
      startTime: formatDateForAPI(createdStartDateFilter, false),
      endTime: formatDateForAPI(createdEndDateFilter, true),
      sort: `createdAt,${createdSortOrder}`
    }),
  });

  const createdConsignmentsData: PaginatedConsignmentResponse | undefined = createdSaleOrdersData ? {
    consignments: createdSaleOrdersData.saleOrders.map(mapSaleOrderToConsignment),
    pagination: createdSaleOrdersData.pagination
  } : undefined;

  // Fetch sale order details
  const { data: saleOrderDetails, isLoading: isLoadingSaleOrderDetails } = useQuery<SaleOrder>({
    queryKey: ['saleOrderDetails', selectedSaleOrderId],
    queryFn: () => InventoryService.getInstance().getSaleOrderById(selectedSaleOrderId!),
    enabled: !!selectedSaleOrderId && saleOrderDetailsDialogOpen,
  });

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
          <h1 className="text-2xl font-bold text-foreground">Lô hàng chưa tạo đơn vận chuyển</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Lô hàng chưa tạo đơn vận chuyển</CardTitle>
            <CardDescription>
              {userRole === 'store_manager' 
                ? `Lô hàng tại ${getCityLabel(userCity || '')} chưa tạo đơn vận chuyển` 
                : 'Tất cả lô hàng chưa tạo đơn vận chuyển'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters for CREATED consignments */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="created-code-filter">Mã lô hàng</Label>
                  <Input
                    id="created-code-filter"
                    placeholder="Nhập mã lô hàng"
                    value={createdCodeFilter || ''}
                    onChange={(e) => setCreatedCodeFilter(e.target.value || undefined)}
                  />
                </div>
              {userRole === 'admin' && (
                  <>
                    <div>
                  <Label htmlFor="created-city-filter">Thành phố</Label>
                  <Select
                    value={createdConsignmentCityFilter || 'all'}
                    onValueChange={(value) => setCreatedConsignmentCityFilter(value === 'all' ? undefined : value as City)}
                  >
                    <SelectTrigger id="created-city-filter">
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
                      <Label htmlFor="created-warehouse-filter">Kho</Label>
                      <Select
                        value={createdWarehouseFilter || 'all'}
                        onValueChange={(value) => setCreatedWarehouseFilter(value === 'all' ? undefined : value)}
                      >
                        <SelectTrigger id="created-warehouse-filter">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="created-start-date">Từ ngày</Label>
                  <Input
                    id="created-start-date"
                    type="date"
                    value={createdStartDateFilter || ''}
                    onChange={(e) => setCreatedStartDateFilter(e.target.value || undefined)}
                  />
                </div>
                <div>
                  <Label htmlFor="created-end-date">Đến ngày</Label>
                  <Input
                    id="created-end-date"
                    type="date"
                    value={createdEndDateFilter || ''}
                    onChange={(e) => setCreatedEndDateFilter(e.target.value || undefined)}
                    min={createdStartDateFilter || undefined}
                  />
                </div>
                <div>
                  <Label htmlFor="created-sort">Sắp xếp</Label>
                  <Select
                    value={createdSortOrder}
                    onValueChange={(value) => setCreatedSortOrder(value as 'asc' | 'desc')}
                  >
                    <SelectTrigger id="created-sort">
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
                      setCreatedCodeFilter(undefined);
                      setCreatedConsignmentCityFilter(userRole === 'store_manager' ? userCity : undefined);
                      setCreatedWarehouseFilter(undefined);
                      setCreatedStartDateFilter(undefined);
                      setCreatedEndDateFilter(undefined);
                      setCreatedSortOrder('desc');
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>

            {/* CREATED Consignments Table */}
            {isLoadingCreatedConsignments ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="mt-2 text-muted-foreground">Đang tải...</p>
              </div>
            ) : !createdConsignmentsData?.consignments || createdConsignmentsData.consignments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Không có lô hàng nào chưa tạo đơn vận chuyển</p>
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
                    {createdConsignmentsData.consignments.map((consignment) => (
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination for CREATED consignments */}
                {createdConsignmentsData.pagination && createdConsignmentsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Trang {createdConsignmentsData.pagination.page + 1} / {createdConsignmentsData.pagination.totalPages} 
                      ({createdConsignmentsData.pagination.totalElements} lô hàng)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreatedConsignmentPage(Math.max(0, createdConsignmentPage - 1))}
                        disabled={createdConsignmentPage === 0}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreatedConsignmentPage(Math.min(createdConsignmentsData.pagination.totalPages - 1, createdConsignmentPage + 1))}
                        disabled={createdConsignmentPage >= createdConsignmentsData.pagination.totalPages - 1}
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
