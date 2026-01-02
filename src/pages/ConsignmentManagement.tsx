import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, Loader2, Ship, Package } from "lucide-react";
import { OrderFulfillmentService } from "../services/OrderFulfillmentService";
import { getAuthData } from "../services/AdminAuthService";
import type { Consignment, ConsignmentStatus, City, ConsignmentShipRequest, PaginatedConsignmentResponse } from "../models";

export default function ConsignmentManagement() {
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
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("created");
  
  // Consignments management filters
  const [consignmentCityFilter, setConsignmentCityFilter] = useState<City | undefined>(userRole === 'store_manager' ? userCity : undefined);
  const [consignmentStatusFilter, setConsignmentStatusFilter] = useState<ConsignmentStatus | undefined>('PENDING');
  const [consignmentPage, setConsignmentPage] = useState(0);
  const [consignmentPageSize] = useState(20);
  
  // Filters for CREATED consignments (new section)
  const [createdConsignmentCityFilter, setCreatedConsignmentCityFilter] = useState<City | undefined>(userRole === 'store_manager' ? userCity : undefined);
  const [createdConsignmentPage, setCreatedConsignmentPage] = useState(0);
  const [createdConsignmentPageSize] = useState(20);
  
  // Form state for ship consignment
  const [shipStatus, setShipStatus] = useState<'PICKED_UP' | 'IN_TRANSIT'>('PICKED_UP');
  const [shipDialogOpen, setShipDialogOpen] = useState(false);
  const [editingConsignmentId, setEditingConsignmentId] = useState<number | null>(null);

  // Fetch consignments for management section
  const { data: consignmentsData, isLoading: isLoadingConsignments } = useQuery<PaginatedConsignmentResponse>({
    queryKey: ['consignmentsList', consignmentCityFilter, consignmentStatusFilter, consignmentPage, consignmentPageSize, userRole],
    queryFn: () => OrderFulfillmentService.getInstance().getConsignments(
      consignmentPage,
      consignmentPageSize,
      consignmentCityFilter,
      consignmentStatusFilter,
      userRole
    ),
  });

  // Fetch CREATED consignments (new section - consignments that haven't created shipping order yet)
  const { data: createdConsignmentsData, isLoading: isLoadingCreatedConsignments } = useQuery<PaginatedConsignmentResponse>({
    queryKey: ['createdConsignmentsList', createdConsignmentCityFilter, createdConsignmentPage, createdConsignmentPageSize, userRole],
    queryFn: () => OrderFulfillmentService.getInstance().getConsignments(
      createdConsignmentPage,
      createdConsignmentPageSize,
      createdConsignmentCityFilter,
      'CREATED',
      userRole
    ),
  });

  // Ship consignment mutation
  const shipConsignmentMutation = useMutation({
    mutationFn: ({ id, request }: { id: number; request: ConsignmentShipRequest }) => 
      OrderFulfillmentService.getInstance().shipConsignment(id, request, userRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consignmentsList'] });
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
    mutationFn: (consignmentId: number) => 
      OrderFulfillmentService.getInstance().createShippingOrderForConsignment(consignmentId),
    onSuccess: (trackingNumber) => {
      queryClient.invalidateQueries({ queryKey: ['consignmentsList'] });
      queryClient.invalidateQueries({ queryKey: ['createdConsignmentsList'] });
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý lô hàng</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="created">Lô hàng chưa tạo đơn vận chuyển</TabsTrigger>
            <TabsTrigger value="all">Tất cả lô hàng</TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="mt-6">
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
            <div className="flex gap-4 mb-6">
              {userRole === 'admin' && (
                <div className="flex-1">
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
              )}
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
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Kho</TableHead>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">{consignment.customerName || '-'}</div>
                            <div className="text-xs text-muted-foreground">{consignment.customerEmail || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getCityLabel(consignment.warehouseCity)}</TableCell>
                        <TableCell>{consignment.entries?.length || 0}</TableCell>
                        <TableCell>{consignment.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCreateShippingOrder(consignment.id)}
                            disabled={createShippingOrderMutation.isPending}
                          >
                            <Package className="h-4 w-4 mr-1" />
                            {createShippingOrderMutation.isPending ? "Đang tạo..." : "Tạo đơn vận chuyển"}
                          </Button>
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
          </TabsContent>

          <TabsContent value="all" className="mt-6">
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
            <div className="flex gap-4 mb-6">
              {userRole === 'admin' && (
                <div className="flex-1">
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
              )}
              <div className="flex-1">
                <Label htmlFor="status-filter">Trạng thái</Label>
                <Select
                  value={consignmentStatusFilter || 'all'}
                  onValueChange={(value) => setConsignmentStatusFilter(value === 'all' ? undefined : value as ConsignmentStatus)}
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
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Kho</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Mã vận đơn</TableHead>
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
                        <TableCell>
                          <div>
                            <div className="font-medium">{consignment.customerName || '-'}</div>
                            <div className="text-xs text-muted-foreground">{consignment.customerEmail || '-'}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getCityLabel(consignment.warehouseCity)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(consignment.status)}>
                            {getStatusLabel(consignment.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>{consignment.trackingNumber || "-"}</TableCell>
                        <TableCell>{consignment.entries?.length || 0}</TableCell>
                        <TableCell>{consignment.totalPrice?.toLocaleString('vi-VN') || 0} VNĐ</TableCell>
                        <TableCell className="text-right">
                          {consignment.status === 'PENDING' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShipConsignment(consignment)}
                              disabled={shipConsignmentMutation.isPending}
                            >
                              <Ship className="h-4 w-4 mr-1" />
                              Gửi hàng
                            </Button>
                          )}
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
          </TabsContent>
        </Tabs>

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
      </main>
    </div>
  );
}
