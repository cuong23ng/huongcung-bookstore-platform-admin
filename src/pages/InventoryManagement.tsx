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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, Eye, ChevronLeft, ChevronRight, AlertTriangle, Edit, History } from "lucide-react";
import { InventoryService } from "../services/InventoryService";
import { getAuthData } from "../services/AdminAuthService";
import type { StockLevel, City, AvailabilityStatus, StockAdjustmentRequest, StockAdjustment } from "../models";

export default function InventoryManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockLevel | null>(null);
  const [bookTitleFilter, setBookTitleFilter] = useState("");
  const [cityFilter, setCityFilter] = useState<City | "all">("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityStatus>("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [adjustmentHistoryPage, setAdjustmentHistoryPage] = useState(0);
  
  // Adjust stock form state
  const [quantityToAdd, setQuantityToAdd] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

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

  // Determine city filter: Store Managers see only their city, Admins can filter
  const effectiveCity = userRole === 'store_manager' ? userCity : (cityFilter === 'all' ? undefined : cityFilter);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [bookTitleFilter, cityFilter, availabilityFilter]);

  // Fetch stock levels with pagination and filters
  const { data: stockData, isLoading, error, refetch } = useQuery({
    queryKey: ['stockLevels', currentPage, pageSize, effectiveCity, bookTitleFilter, availabilityFilter, userRole],
    queryFn: () => InventoryService.getInstance().getStockLevels({
      page: currentPage,
      size: pageSize,
      city: effectiveCity,
      bookTitle: bookTitleFilter || undefined,
      availabilityStatus: availabilityFilter !== 'all' ? availabilityFilter : undefined,
      role: userRole,
    }),
  });

  // Fetch adjustment history for selected stock
  const { data: adjustmentHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['stockAdjustments', selectedStock?.id, adjustmentHistoryPage, pageSize],
    queryFn: async () => {
      if (!selectedStock?.id) {
        return { adjustments: [], pagination: { currentPage: 1, pageSize: 20, totalResults: 0, totalPages: 0 } };
      }
      return InventoryService.getInstance().getStockAdjustments(selectedStock.id, adjustmentHistoryPage, pageSize);
    },
    enabled: !!selectedStock?.id && detailsDialogOpen,
  });

  // Adjust stock mutation
  const adjustStockMutation = useMutation({
    mutationFn: ({ stockLevelId, request }: { stockLevelId: number; request: StockAdjustmentRequest }) =>
      InventoryService.getInstance().adjustStock(stockLevelId, request, userRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] });
      queryClient.invalidateQueries({ queryKey: ['stockAdjustments'] });
      toast({
        title: "Điều chỉnh tồn kho thành công",
        description: "Số lượng tồn kho đã được cập nhật",
      });
      setAdjustDialogOpen(false);
      setQuantityToAdd("");
      setAdjustReason("");
      // Refresh selected stock data
      if (selectedStock) {
        refetch();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi điều chỉnh tồn kho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (stock: StockLevel) => {
    setSelectedStock(stock);
    setDetailsDialogOpen(true);
    setAdjustmentHistoryPage(0);
  };

  const handleDialogClose = (open: boolean) => {
    setDetailsDialogOpen(open);
    if (!open) {
      setSelectedStock(null);
      setAdjustmentHistoryPage(0);
    }
  };

  const handleOpenAdjustDialog = () => {
    if (selectedStock) {
      setQuantityToAdd("");
      setAdjustReason("");
      setAdjustDialogOpen(true);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    const currentQty = selectedStock.quantity ?? selectedStock.totalQuantity;
    const addQty = Number.parseInt(quantityToAdd, 10);

    if (Number.isNaN(addQty) || addQty < 0) {
      toast({
        title: "Lỗi xác thực",
        description: "Số lượng thêm mới phải là số nguyên không âm",
        variant: "destructive",
      });
      return;
    }

    // Calculate new total quantity
    const newTotalQuantity = currentQty + addQty;

    // Validate that new quantity is at least reserved quantity
    if (newTotalQuantity < selectedStock.reservedQuantity) {
      toast({
        title: "Lỗi xác thực",
        description: `Tổng số lượng sau điều chỉnh (${newTotalQuantity}) phải lớn hơn hoặc bằng số lượng đã đặt trước (${selectedStock.reservedQuantity})`,
        variant: "destructive",
      });
      return;
    }

    if (!adjustReason.trim() || adjustReason.trim().length < 1 || adjustReason.trim().length > 1000) {
      toast({
        title: "Lỗi xác thực",
        description: "Lý do phải có từ 1 đến 1000 ký tự",
        variant: "destructive",
      });
      return;
    }

    const request: StockAdjustmentRequest = {
      newQuantity: addQty,
      reason: adjustReason.trim(),
    };

    adjustStockMutation.mutate({ stockLevelId: selectedStock.id, request });
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
      return new Date(dateString).toLocaleString('vi-VN');
    } catch {
      return dateString;
    }
  };

  // Use backend flags if available, otherwise calculate client-side
  const isLowStock = (stock: StockLevel): boolean => {
    if (stock.isLowStock !== undefined) {
      return stock.isLowStock;
    }
    // Fallback calculation if backend flag not available
    if (stock.reorderLevel === undefined || stock.reorderLevel === null) {
      return false;
    }
    const quantity = stock.quantity ?? stock.totalQuantity;
    return quantity <= stock.reorderLevel;
  };

  const isOutOfStock = (stock: StockLevel): boolean => {
    if (stock.isOutOfStock !== undefined) {
      return stock.isOutOfStock;
    }
    // Fallback calculation if backend flag not available
    return stock.availableQuantity <= 0;
  };

  const getWarehouseDisplay = (stock: StockLevel): string => {
    if (stock.warehouseCity && stock.warehouseCode) {
      return `${stock.warehouseCode} (${getCityLabel(stock.warehouseCity)})`;
    }
    if (stock.warehouseCity) {
      return getCityLabel(stock.warehouseCity);
    }
    if (stock.city) {
      return getCityLabel(stock.city);
    }
    return "-";
  };

  const stockLevels = stockData?.stockLevels || [];
  const pagination = stockData?.pagination || { currentPage: 1, pageSize: 20, totalResults: 0, totalPages: 0 };

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
            <div className="flex gap-4 mt-4 flex-wrap">
              <Input
                placeholder="Tìm kiếm theo tên sách..."
                value={bookTitleFilter}
                onChange={(e) => setBookTitleFilter(e.target.value)}
                className="max-w-sm"
              />
              {userRole === 'admin' && (
                <Select value={cityFilter} onValueChange={(value) => setCityFilter(value as City | "all")}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo thành phố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả thành phố</SelectItem>
                    <SelectItem value="HANOI">Hà Nội</SelectItem>
                    <SelectItem value="HCMC">TP. Hồ Chí Minh</SelectItem>
                    <SelectItem value="DANANG">Đà Nẵng</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select 
                value={availabilityFilter} 
                onValueChange={(value) => setAvailabilityFilter(value as AvailabilityStatus)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="available">Có sẵn</SelectItem>
                  <SelectItem value="low_stock">Tồn kho thấp</SelectItem>
                  <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                </SelectContent>
              </Select>
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
            ) : stockLevels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {bookTitleFilter || availabilityFilter !== 'all' || cityFilter !== 'all'
                    ? "Không tìm thấy sách nào phù hợp với bộ lọc"
                    : "Chưa có dữ liệu tồn kho"}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên sách</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead>Tổng số lượng</TableHead>
                      <TableHead>Đã đặt trước</TableHead>
                      <TableHead>Có sẵn</TableHead>
                      <TableHead>Mức đặt lại</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockLevels.map((stock) => {
                      const lowStock = isLowStock(stock);
                      const outOfStock = isOutOfStock(stock);
                      const quantity = stock.quantity ?? stock.totalQuantity;
                      const reservedPercent = quantity > 0 ? Math.round((stock.reservedQuantity / quantity) * 100) : 0;
                      
                      return (
                        <TableRow 
                          key={stock.id}
                          className={outOfStock ? "bg-red-50 dark:bg-red-950/20" : lowStock ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {stock.bookTitle || `Book ID: ${stock.bookId}`}
                              {outOfStock && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Hết hàng
                                </span>
                              )}
                              {!outOfStock && lowStock && (
                                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  Tồn kho thấp
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getWarehouseDisplay(stock)}</TableCell>
                          <TableCell>
                            <div className="font-semibold">{quantity}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{stock.reservedQuantity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={
                              outOfStock
                                ? "text-destructive font-semibold" 
                                : stock.availableQuantity < 0
                                ? "text-orange-600 font-semibold"
                                : stock.availableQuantity === 0
                                ? "text-yellow-600 font-semibold"
                                : "font-semibold"
                            }>
                          {stock.availableQuantity}
                            </div>
                            {stock.availableQuantity < 0 && (
                              <div className="text-xs text-orange-600 mt-0.5">
                                (Thiếu {Math.abs(stock.availableQuantity)})
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {stock.reorderLevel !== undefined && stock.reorderLevel !== null ? (
                              <div className="flex items-center gap-2">
                                <span>{stock.reorderLevel}</span>
                                {lowStock && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                              onClick={() => handleViewDetails(stock)}
                          >
                              <Eye className="h-4 w-4 mr-1" />
                              See Details
                          </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Trang {pagination.currentPage} / {pagination.totalPages} 
                      {" "}(Tổng: {pagination.totalResults} mục)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(pagination.totalPages - 1, p + 1))}
                        disabled={currentPage >= pagination.totalPages - 1}
                      >
                        Sau
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Details Dialog */}
                <Dialog open={detailsDialogOpen} onOpenChange={handleDialogClose}>
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Chi tiết tồn kho</DialogTitle>
                      <DialogDescription>
                        Thông tin đầy đủ về mặt hàng và kho
                      </DialogDescription>
                    </DialogHeader>
                    {selectedStock && (
                      <Tabs defaultValue="details" className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <TabsList>
                            <TabsTrigger value="details">Chi tiết</TabsTrigger>
                            <TabsTrigger value="history">
                              <History className="h-4 w-4 mr-1" />
                              Lịch sử điều chỉnh
                            </TabsTrigger>
                          </TabsList>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleOpenAdjustDialog}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Điều chỉnh tồn kho
                          </Button>
                        </div>
                        <TabsContent value="details" className="space-y-6 mt-4">
                        {/* Book Information */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold border-b pb-2">Thông tin sách</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">ID</p>
                              <p className="text-sm">{selectedStock.bookId}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Mã sách</p>
                              <p className="text-sm">{selectedStock.bookCode || "-"}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-muted-foreground">Tên sách</p>
                              <p className="text-sm">{selectedStock.bookTitle || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                              <p className="text-sm">{selectedStock.bookIsbn || "-"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Warehouse Information */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold border-b pb-2">Thông tin kho</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">ID Kho</p>
                              <p className="text-sm">{selectedStock.warehouseId || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Mã kho</p>
                              <p className="text-sm">{selectedStock.warehouseCode || "-"}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Thành phố</p>
                              <p className="text-sm">
                                {selectedStock.warehouseCity 
                                  ? getCityLabel(selectedStock.warehouseCity)
                                  : selectedStock.city 
                                  ? getCityLabel(selectedStock.city)
                                  : "-"}
                              </p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-sm font-medium text-muted-foreground">Địa chỉ</p>
                              <p className="text-sm">{selectedStock.warehouseAddress || "-"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Stock Information */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-semibold">Thông tin tồn kho</h3>
                            <div className="flex gap-2">
                              {isOutOfStock(selectedStock) && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Hết hàng
                                </span>
                              )}
                              {!isOutOfStock(selectedStock) && isLowStock(selectedStock) && (
                                <span className="px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  Tồn kho thấp
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                              <div className="p-4 rounded-lg border bg-muted/50">
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Tổng số lượng</p>
                                    <p className="text-2xl font-bold">
                                      {selectedStock.quantity ?? selectedStock.totalQuantity}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Đã đặt trước
                                      {(() => {
                                        const qty = selectedStock.quantity ?? selectedStock.totalQuantity;
                                        const percent = qty > 0 ? Math.round((selectedStock.reservedQuantity / qty) * 100) : 0;
                                        return percent > 0 ? ` (${percent}%)` : '';
                                      })()}
                                    </p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                      {selectedStock.reservedQuantity}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Đã cam kết cho đơn hàng
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Có sẵn</p>
                                    <p className={`text-2xl font-bold ${
                                      isOutOfStock(selectedStock)
                                        ? "text-destructive" 
                                        : selectedStock.availableQuantity < 0
                                        ? "text-orange-600"
                                        : selectedStock.availableQuantity === 0
                                        ? "text-yellow-600"
                                        : "text-green-600 dark:text-green-400"
                                    }`}>
                                      {selectedStock.availableQuantity}
                                    </p>
                                    {selectedStock.availableQuantity < 0 && (
                                      <p className="text-xs text-orange-600 mt-1">
                                        Thiếu {Math.abs(selectedStock.availableQuantity)} đơn vị
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Có thể bán
                                    </p>
                                  </div>
                                </div>
                                {/* Progress bar showing reserved vs available */}
                                {(() => {
                                  const totalQty = selectedStock.quantity ?? selectedStock.totalQuantity;
                                  const reservedPercent = totalQty > 0 ? (selectedStock.reservedQuantity / totalQty) * 100 : 0;
                                  const availablePercent = totalQty > 0 ? (selectedStock.availableQuantity / totalQty) * 100 : 0;
                                  return totalQty > 0 ? (
                                    <div className="mt-4">
                                      <div className="flex h-4 rounded-full overflow-hidden border">
                                        <div 
                                          className="bg-blue-500 transition-all"
                                          style={{ width: `${Math.min(reservedPercent, 100)}%` }}
                                          title={`Đã đặt trước: ${selectedStock.reservedQuantity}`}
                                        />
                                        <div 
                                          className={`transition-all ${
                                            availablePercent > 0 
                                              ? "bg-green-500" 
                                              : availablePercent < 0
                                              ? "bg-orange-500"
                                              : "bg-yellow-500"
                                          }`}
                                          style={{ width: `${Math.max(0, Math.min(availablePercent, 100))}%` }}
                                          title={`Có sẵn: ${selectedStock.availableQuantity}`}
                                        />
                                      </div>
                                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>Đã đặt: {selectedStock.reservedQuantity}</span>
                                        <span>Có sẵn: {selectedStock.availableQuantity}</span>
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Mức đặt lại</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold">
                                  {selectedStock.reorderLevel ?? "-"}
                                </p>
                                {selectedStock.reorderLevel !== undefined && 
                                 selectedStock.reorderLevel !== null &&
                                 isLowStock(selectedStock) && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Số lượng đặt lại</p>
                              <p className="text-sm">{selectedStock.reorderQuantity ?? "-"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Timestamps */}
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold border-b pb-2">Thông tin thời gian</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Lần nhập hàng cuối</p>
                              <p className="text-sm">{formatDate(selectedStock.lastRestocked)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Cập nhật lần cuối</p>
                              <p className="text-sm">{formatDate(selectedStock.updatedAt || selectedStock.lastUpdated)}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">Ngày tạo</p>
                              <p className="text-sm">{formatDate(selectedStock.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        </TabsContent>
                        <TabsContent value="history" className="mt-4">
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Lịch sử điều chỉnh tồn kho</h3>
                            {isLoadingHistory ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-2 text-muted-foreground">Đang tải...</p>
                              </div>
                            ) : adjustmentHistory && adjustmentHistory.adjustments.length > 0 ? (
                              <>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Thời gian</TableHead>
                                      <TableHead>Số lượng trước</TableHead>
                                      <TableHead>Số lượng mới</TableHead>
                                      <TableHead>Thay đổi</TableHead>
                                      <TableHead>Người điều chỉnh</TableHead>
                                      <TableHead>Lý do</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {adjustmentHistory.adjustments.map((adjustment: StockAdjustment) => (
                                      <TableRow key={adjustment.id}>
                                        <TableCell>{formatDate(adjustment.adjustedAt)}</TableCell>
                                        <TableCell>{adjustment.previousQuantity}</TableCell>
                                        <TableCell className="font-semibold">{adjustment.newQuantity}</TableCell>
                                        <TableCell className={
                                          adjustment.difference > 0 
                                            ? "text-green-600 font-semibold" 
                                            : adjustment.difference < 0
                                            ? "text-red-600 font-semibold"
                                            : ""
                                        }>
                                          {adjustment.difference > 0 ? '+' : ''}{adjustment.difference}
                                        </TableCell>
                                        <TableCell>{adjustment.adjustedByEmail || `User ID: ${adjustment.adjustedBy}`}</TableCell>
                                        <TableCell className="max-w-xs truncate" title={adjustment.reason}>
                                          {adjustment.reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                                {adjustmentHistory.pagination.totalPages > 1 && (
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <div className="text-sm text-muted-foreground">
                                      Trang {adjustmentHistory.pagination.currentPage} / {adjustmentHistory.pagination.totalPages}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAdjustmentHistoryPage(p => Math.max(0, p - 1))}
                                        disabled={adjustmentHistoryPage === 0}
                                      >
                                        <ChevronLeft className="h-4 w-4 mr-1" />
                                        Trước
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAdjustmentHistoryPage(p => Math.min(adjustmentHistory.pagination.totalPages - 1, p + 1))}
                                        disabled={adjustmentHistoryPage >= adjustmentHistory.pagination.totalPages - 1}
                                      >
                                        Sau
                                        <ChevronRight className="h-4 w-4 ml-1" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-8">
                                <p className="text-muted-foreground">Chưa có lịch sử điều chỉnh</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Adjust Stock Dialog */}
                <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
                      <DialogDescription>
                        Nhập số lượng thêm mới và lý do điều chỉnh
                      </DialogDescription>
                    </DialogHeader>
                    {selectedStock && (() => {
                      const currentQty = selectedStock.quantity ?? selectedStock.totalQuantity;
                      const addQty = Number.parseInt(quantityToAdd, 10) || 0;
                      const newTotalQty = currentQty + addQty;
                      
                      return (
                    <form onSubmit={handleAdjustStock} className="space-y-4">
                      <div className="space-y-2">
                            <Label htmlFor="currentQuantity">Số lượng hiện tại</Label>
                            <Input
                              id="currentQuantity"
                              type="number"
                              value={currentQty}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="quantityToAdd">Số lượng thêm mới *</Label>
                        <Input
                              id="quantityToAdd"
                          type="number"
                              min="0"
                              value={quantityToAdd}
                              onChange={(e) => setQuantityToAdd(e.target.value)}
                              placeholder="Nhập số lượng thêm mới"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                              Số lượng sách mới nhập kho (số dương)
                        </p>
                      </div>
                          {quantityToAdd && !Number.isNaN(Number.parseInt(quantityToAdd, 10)) && (
                            <div className="space-y-2 p-3 rounded-lg border bg-muted/50">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-muted-foreground">Tổng số lượng sau điều chỉnh:</span>
                                <span className="text-lg font-bold">
                                  {currentQty} + {addQty} = <span className="text-primary">{newTotalQty}</span>
                                </span>
                              </div>
                              {newTotalQty < selectedStock.reservedQuantity && (
                                <p className="text-xs text-destructive mt-1">
                                  ⚠️ Tổng số lượng ({newTotalQty}) phải lớn hơn hoặc bằng số lượng đã đặt trước ({selectedStock.reservedQuantity})
                                </p>
                              )}
                            </div>
                          )}
                      <div className="space-y-2">
                            <Label htmlFor="adjustReason">Lý do *</Label>
                        <Input
                              id="adjustReason"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                              placeholder="Nhập lý do điều chỉnh (1-1000 ký tự)"
                              maxLength={1000}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                              {adjustReason.length}/1000 ký tự. Lý do sẽ được ghi lại trong nhật ký kiểm toán.
                        </p>
                      </div>
                          <div className="flex gap-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setAdjustDialogOpen(false)}
                              className="flex-1"
                            >
                              Hủy
                            </Button>
                      <Button 
                        type="submit" 
                              className="flex-1"
                              disabled={adjustStockMutation.isPending}
                      >
                              {adjustStockMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
                      </Button>
                          </div>
                    </form>
                      );
                    })()}
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
