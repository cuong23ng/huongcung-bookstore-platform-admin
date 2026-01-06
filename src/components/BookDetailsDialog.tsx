import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Loader2, Sparkles, CheckCircle, XCircle, Edit, Wand2, RefreshCw, ArrowUp, ArrowDown, Upload, X, Save } from "lucide-react";
import { CatalogService } from "../services/CatalogService";
import { ReviewService } from "../services/ReviewService";
import { useToast } from "../hooks/use-toast";
import { ImageViewerDialog } from "./ImageViewerDialog";

interface BookDetailsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly bookId: number | null;
  readonly onGenerateAiReview: (bookId: number) => void;
  readonly isGeneratingReview: boolean;
}

export function BookDetailsDialog({
  open,
  onOpenChange,
  bookId,
  onGenerateAiReview,
  isGeneratingReview,
}: BookDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<{ src: string; label: string } | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState<number | undefined>(undefined);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Fetch book details
  const { data: bookDetails, isLoading: isLoadingBookDetails, refetch: refetchBookDetails } = useQuery({
    queryKey: ['bookDetails', bookId],
    queryFn: () => bookId 
      ? CatalogService.getInstance().getBookById(bookId)
      : Promise.resolve(null),
    enabled: !!bookId && open,
  });

  // Fetch review for selected book (OneToOne - single review)
  const { data: review, isLoading: isLoadingReview, refetch: refetchReview } = useQuery({
    queryKey: ['review', bookId],
    queryFn: () => bookId 
      ? ReviewService.getInstance().getReviewByBookId(bookId)
      : Promise.resolve(null),
    enabled: !!bookId && open,
  });

  // Sync review data to form state
  useEffect(() => {
    if (review) {
      setReviewContent(review.content || "");
      setReviewRating(review.rating);
    } else {
      setReviewContent("");
      setReviewRating(undefined);
    }
    if (!isEditingReview) {
      // Reset editing state when review changes externally
    }
  }, [review, isEditingReview]);

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: () => bookId 
      ? ReviewService.getInstance().createReview(bookId, reviewRating, reviewContent)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', bookId] });
      setIsEditingReview(false);
      toast({ 
        title: "Tạo review thành công", 
        description: "Review đã được tạo",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi tạo review", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Update review mutation
  const updateReviewMutation = useMutation({
    mutationFn: () => bookId 
      ? ReviewService.getInstance().updateReview(bookId, reviewRating, reviewContent)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', bookId] });
      setIsEditingReview(false);
      toast({ 
        title: "Cập nhật review thành công", 
        description: "Review đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi cập nhật review", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Helper function to count words
  const countWords = (text: string | null | undefined): number => {
    if (!text?.trim()) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Check if review has minimum 200 words
  const hasMinimumWords = countWords(review?.content) >= 100;

  // Enhance review mutation (generic for all enhancement types)
  const enhanceReviewMutation = useMutation({
    mutationFn: (enhancementType: 'improve' | 'expand' | 'shorten') => bookId 
      ? ReviewService.getInstance().enhanceReview(bookId, enhancementType)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: (message) => {
      queryClient.invalidateQueries({ queryKey: ['review', bookId] });
      toast({ 
        title: "Yêu cầu đã được tiếp nhận", 
        description: message,
        duration: 5000,
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi cải thiện review", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Approve review mutation
  const approveReviewMutation = useMutation({
    mutationFn: (reviewId: number) => ReviewService.getInstance().approveReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', bookId] });
      toast({ 
        title: "Duyệt review thành công", 
        description: "Review đã được duyệt và sẽ hiển thị công khai",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi duyệt review", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Reject review mutation
  const rejectReviewMutation = useMutation({
    mutationFn: (reviewId: number) => ReviewService.getInstance().rejectReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review', bookId] });
      toast({ 
        title: "Từ chối review thành công", 
        description: "Review đã bị từ chối",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi từ chối review", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => bookId 
      ? CatalogService.getInstance().uploadBookImages(bookId, files)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      // Cleanup preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      toast({ 
        title: "Upload ảnh thành công", 
        description: "Ảnh đã được tải lên thành công",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi upload ảnh", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: number) => bookId 
      ? CatalogService.getInstance().deleteBookImage(bookId, imageId)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      toast({ 
        title: "Xóa ảnh thành công", 
        description: "Ảnh đã được xóa thành công",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi xóa ảnh", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleRefresh = () => {
    refetchReview();
    refetchBookDetails();
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (review) {
      updateReviewMutation.mutate();
    } else {
      createReviewMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi tiết sách</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết và reviews của sách
          </DialogDescription>
        </DialogHeader>
        {isLoadingBookDetails && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải thông tin sách...</span>
          </div>
        )}
        {!isLoadingBookDetails && bookDetails && (
          <div className="space-y-6 mt-4">
            {/* General Book Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Thông tin chung</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="text-sm">{bookDetails.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mã sách</p>
                  <p className="text-sm">{bookDetails.code || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Tiêu đề</p>
                  <p className="text-sm font-medium">{bookDetails.title}</p>
                </div>
                {bookDetails.description && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Mô tả</p>
                    <p className="text-sm whitespace-pre-wrap">{bookDetails.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ngôn ngữ</p>
                  <p className="text-sm">{bookDetails.language || "-"}</p>
                </div>
                {bookDetails.pageCount !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Số trang</p>
                    <p className="text-sm">{bookDetails.pageCount}</p>
                  </div>
                )}
                {bookDetails.edition !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Lần tái bản</p>
                    <p className="text-sm">{bookDetails.edition}</p>
                  </div>
                )}
                {bookDetails.authors && bookDetails.authors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tác giả</p>
                    <p className="text-sm">{bookDetails.authors.map(a => a.name).join(", ")}</p>
                  </div>
                )}
                {bookDetails.genres && bookDetails.genres.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Thể loại</p>
                    <p className="text-sm">{bookDetails.genres.map(g => g.code || g.name || '').filter(Boolean).join(", ")}</p>
                  </div>
                )}
                {bookDetails.translators && bookDetails.translators.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dịch giả</p>
                    <p className="text-sm">{bookDetails.translators.map(t => t.name).join(", ")}</p>
                  </div>
                )}
                {bookDetails.publisher && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nhà xuất bản</p>
                    <p className="text-sm">{bookDetails.publisher.name}</p>
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold">Ảnh sách</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="upload-images"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        setSelectedFiles(files);
                        // Create preview URLs
                        const urls = files.map(file => URL.createObjectURL(file));
                        setPreviewUrls(urls);
                      }}
                    />
                    <Label htmlFor="upload-images" className="cursor-pointer">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        asChild
                        disabled={uploadImagesMutation.isPending}
                        className="border-0"
                      >
                        <span>
                          <Upload className="h-4 w-4" />
                        </span>
                      </Button>
                    </Label>
                    {selectedFiles.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => uploadImagesMutation.mutate(selectedFiles)}
                        disabled={uploadImagesMutation.isPending}
                        className="border-0"
                        title="Lưu ảnh"
                      >
                        {uploadImagesMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {/* Existing images */}
                  {bookDetails.images && bookDetails.images.length > 0 && (
                    <>
                    {bookDetails.images.map((image) => {
                      let imageSrc: string | undefined;
                      if (image.url) {
                        imageSrc = image.url;
                      } else if (image.base64Data) {
                        const fileType = image.fileType || 'image/jpeg';
                        imageSrc = `data:${fileType};base64,${image.base64Data}`;
                      }
                      
                      const imageKey = image.url || image.fileName || `image-${image.position ?? 'unknown'}`;
                      let imageLabel = 'Sách';
                      if (image.isCover) {
                        imageLabel = 'Bìa trước';
                      } else if (image.isBackCover) {
                        imageLabel = 'Bìa sau';
                      } else if (image.position !== undefined) {
                        imageLabel = `Vị trí ${image.position}`;
                      }
                      
                      return (
                        <div key={imageKey} className="relative group">
                          <button
                            type="button"
                            className="relative w-full cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
                            onClick={() => imageSrc && setSelectedImage({ src: imageSrc, label: imageLabel })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                imageSrc && setSelectedImage({ src: imageSrc, label: imageLabel });
                              }
                            }}
                          >
                            {imageSrc && (
                              <img
                                src={imageSrc}
                                alt={imageLabel}
                                className="w-full h-32 object-cover rounded-md border"
                              />
                            )}
                            <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {imageLabel}
                            </div>
                          </button>
                          {image.id && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
                                  deleteImageMutation.mutate(image.id!);
                                }
                              }}
                              disabled={deleteImageMutation.isPending}
                            >
                              {deleteImageMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                    </>
                  )}
                  {/* Preview selected images - displayed on the right */}
                  {previewUrls.map((url, index) => {
                    const previewKey = `preview-${url}-${index}`;
                    return (
                    <div key={previewKey} className="relative group">
                      <button
                        type="button"
                        className="relative w-full cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
                        onClick={() => setSelectedImage({ src: url, label: `Preview ${index + 1}` })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedImage({ src: url, label: `Preview ${index + 1}` });
                          }
                        }}
                      >
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Mới
                        </div>
                      </button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Remove from selectedFiles and previewUrls
                          const newFiles = selectedFiles.filter((_, i) => i !== index);
                          const newUrls = previewUrls.filter((_, i) => i !== index);
                          // Revoke the URL being removed
                          URL.revokeObjectURL(url);
                          setSelectedFiles(newFiles);
                          setPreviewUrls(newUrls);
                        }}
                        title="Xóa ảnh"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    );
                  })}
                </div>
                {(!bookDetails.images || bookDetails.images.length === 0) && previewUrls.length === 0 && (
                  <p className="text-sm text-muted-foreground">Chưa có ảnh nào. Hãy tải lên ảnh cho cuốn sách này.</p>
                )}
              </div>
            </div>

            {/* Physical Book Information */}
            {bookDetails.physicalBookInfo && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Thông tin sách giấy</h3>
                <div className="grid grid-cols-2 gap-4">
                  {bookDetails.physicalBookInfo.isbn && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ISBN</p>
                      <p className="text-sm">{bookDetails.physicalBookInfo.isbn}</p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.publicationDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ngày xuất bản</p>
                      <p className="text-sm">{new Date(bookDetails.physicalBookInfo.publicationDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.coverType && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Loại bìa</p>
                      <p className="text-sm">
                        {(() => {
                          if (bookDetails.physicalBookInfo?.coverType === 'HARDCOVER') return 'Bìa cứng';
                          if (bookDetails.physicalBookInfo?.coverType === 'PAPERBACK') return 'Bìa mềm';
                          return bookDetails.physicalBookInfo.coverType;
                        })()}
                      </p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.currentPrice && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Giá</p>
                      <p className="text-sm font-medium">{bookDetails.physicalBookInfo.currentPrice.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.weightGrams && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Trọng lượng</p>
                      <p className="text-sm">{bookDetails.physicalBookInfo.weightGrams} gram</p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.heightCm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chiều cao</p>
                      <p className="text-sm">{bookDetails.physicalBookInfo.heightCm} cm</p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.widthCm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chiều rộng</p>
                      <p className="text-sm">{bookDetails.physicalBookInfo.widthCm} cm</p>
                    </div>
                  )}
                  {bookDetails.physicalBookInfo.lengthCm && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Chiều dài</p>
                      <p className="text-sm">{bookDetails.physicalBookInfo.lengthCm} cm</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ebook Information */}
            {bookDetails.ebookInfo && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Thông tin sách điện tử</h3>
                <div className="grid grid-cols-2 gap-4">
                  {bookDetails.ebookInfo.isbn && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">E-ISBN</p>
                      <p className="text-sm">{bookDetails.ebookInfo.isbn}</p>
                    </div>
                  )}
                  {bookDetails.ebookInfo.publicationDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ngày xuất bản</p>
                      <p className="text-sm">{new Date(bookDetails.ebookInfo.publicationDate).toLocaleDateString('vi-VN')}</p>
                    </div>
                  )}
                  {bookDetails.ebookInfo.currentPrice && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Giá</p>
                      <p className="text-sm font-medium">{bookDetails.ebookInfo.currentPrice.toLocaleString('vi-VN')} VNĐ</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Review Section */}
            {/* <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Đánh giá sách</h3>
                  {!isLoadingReview && review && (
                    <Badge
                      variant={
                        review.status === 'PUBLISHED'
                          ? 'default'
                          : review.status === 'DRAFT'
                          ? 'secondary'
                          : review.status === 'RETRACT'
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {review.status === 'DRAFT' && 'DRAFT'}
                      {review.status === 'PUBLISHED' && 'PUBLISHED'}
                      {review.status === 'REJECTED' && 'REJECTED'}
                      {review.status === 'RETRACT' && 'RETRACT'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isEditingReview && review && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditingReview(true)}
                      disabled={review.status === 'PUBLISHED'}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isGeneratingReview || enhanceReviewMutation.isPending || !bookId}
                        title="AI Tools"
                      >
                        {isGeneratingReview || enhanceReviewMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => bookId && onGenerateAiReview(bookId)}
                        disabled={isGeneratingReview || !bookId}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Giúp tôi viết
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => enhanceReviewMutation.mutate('improve')}
                        disabled={!hasMinimumWords || enhanceReviewMutation.isPending || !bookId}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Cải thiện/Hoàn thiện
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => enhanceReviewMutation.mutate('expand')}
                        disabled={!hasMinimumWords || enhanceReviewMutation.isPending || !bookId}
                      >
                        <ArrowUp className="h-4 w-4 mr-2" />
                        Mở rộng
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => enhanceReviewMutation.mutate('shorten')}
                        disabled={!hasMinimumWords || enhanceReviewMutation.isPending || !bookId}
                      >
                        <ArrowDown className="h-4 w-4 mr-2" />
                        Rút gọn
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    title="Làm mới"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isLoadingReview && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Đang tải review...</span>
                </div>
              )}

              {!isLoadingReview && !review && !isEditingReview && (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">Chưa có review cho sách này</p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingReview(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Viết review
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bookId && onGenerateAiReview(bookId)}
                      disabled={isGeneratingReview || !bookId}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Tạo review
                    </Button>
                  </div>
                </div>
              )}

              {isEditingReview && (
                <Card>
                  <CardContent className="pt-4">
                    <form onSubmit={handleSaveReview} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reviewRating">Đánh giá (1-5 sao)</Label>
                        <Input
                          id="reviewRating"
                          type="number"
                          min="1"
                          max="5"
                          value={reviewRating || ""}
                          onChange={(e) => setReviewRating(e.target.value ? Number(e.target.value) : undefined)}
                          placeholder="Nhập điểm từ 1 đến 5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reviewContent">Nội dung review</Label>
                        <textarea
                          id="reviewContent"
                          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={reviewContent}
                          onChange={(e) => setReviewContent(e.target.value)}
                          placeholder="Nhập nội dung review..."
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsEditingReview(false);
                            if (review) {
                              setReviewContent(review.content || "");
                              setReviewRating(review.rating);
                            } else {
                              setReviewContent("");
                              setReviewRating(undefined);
                            }
                          }}
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          disabled={createReviewMutation.isPending || updateReviewMutation.isPending}
                        >
                          {(() => {
                            if (createReviewMutation.isPending || updateReviewMutation.isPending) {
                              return "Đang lưu...";
                            }
                            if (review) {
                              return "Cập nhật";
                            }
                            return "Tạo review";
                          })()}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {!isLoadingReview && review && !isEditingReview && (
                <Card className={(() => {
                  if (review.status === 'DRAFT') return "border-l-4 border-l-primary";
                  if (review.status === 'PUBLISHED') return "border-l-4 border-l-green-500";
                  if (review.status === 'RETRACT') return "border-l-4 border-l-orange-500";
                  return "";
                })()}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {review.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              <span className="text-sm font-medium">{review.rating}</span>
                              <span className="text-yellow-500">★</span>
                            </div>
                          )}
                          {review.title && (
                            <h4 className="text-base font-semibold mb-2">{review.title}</h4>
                          )}
                          {review.content && (
                            <p className="text-sm whitespace-pre-wrap">{review.content}</p>
                          )}
                          {review.sources && review.sources.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Nguồn tham khảo:</p>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {review.sources.map((source, idx) => (
                                  <li key={`${review.id}-source-${idx}`}>
                                    {source.url ? (
                                      <a 
                                        href={source.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="hover:underline"
                                      >
                                        {source.title || source.url}
                                      </a>
                                    ) : (
                                      source.title || 'Nguồn không có tiêu đề'
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {review.createdAt && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Tạo lúc: {new Date(review.createdAt).toLocaleString('vi-VN')}
                            </p>
                          )}
                          {review.updatedAt && review.updatedAt !== review.createdAt && (
                            <p className="text-xs text-muted-foreground">
                              Cập nhật lúc: {new Date(review.updatedAt).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </div>
                      </div>
                      {review.status === 'DRAFT' && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => review.id && approveReviewMutation.mutate(review.id)}
                            disabled={approveReviewMutation.isPending || rejectReviewMutation.isPending}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {approveReviewMutation.isPending ? "Đang duyệt..." : "Duyệt"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => review.id && rejectReviewMutation.mutate(review.id)}
                            disabled={approveReviewMutation.isPending || rejectReviewMutation.isPending}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {rejectReviewMutation.isPending ? "Đang từ chối..." : "Từ chối"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div> */}
          </div>
        )}
        {!isLoadingBookDetails && !bookDetails && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Không tìm thấy thông tin sách</p>
          </div>
        )}
      </DialogContent>

      {/* Image Preview Dialog */}
      <ImageViewerDialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
        imageSrc={selectedImage?.src || null}
        imageLabel={selectedImage?.label}
      />
    </Dialog>
  );
}
