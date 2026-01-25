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
import { Loader2, Sparkles, CheckCircle, XCircle, Edit, Wand2, RefreshCw, ArrowUp, ArrowDown, Upload, X, Save, BookOpen, BookMarked, Eye, EyeOff } from "lucide-react";
import { CatalogService } from "../services/CatalogService";
import { ReviewService } from "../services/ReviewService";
import { useToast } from "../hooks/use-toast";
import { ImageViewerDialog } from "./ImageViewerDialog";

interface BookDetailsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly bookId: number | null;
}

export function BookDetailsDialog({
  open,
  onOpenChange,
  bookId,
}: BookDetailsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<{ src: string; label: string } | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewRating, setReviewRating] = useState<number | undefined>(undefined);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isEditingPhysicalBook, setIsEditingPhysicalBook] = useState(false);
  const [isEditingEbook, setIsEditingEbook] = useState(false);
  const [selectedEbookFiles, setSelectedEbookFiles] = useState<File[]>([]);
  const [uploadingEbookFiles, setUploadingEbookFiles] = useState<{ [key: string]: boolean }>({});
  
  // Physical book form state
  const [physicalBookForm, setPhysicalBookForm] = useState({
    isbn: "",
    coverType: "",
    publicationDate: "",
    weightGrams: "",
    heightCm: "",
    widthCm: "",
    lengthCm: "",
    currentPrice: "",
  });

  // Ebook form state
  const [ebookForm, setEbookForm] = useState({
    isbn: "",
    publicationDate: "",
    currentPrice: "",
  });

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

  // Sync physical book data to form state
  useEffect(() => {
    if (bookDetails?.physicalBookInfo) {
      setPhysicalBookForm({
        isbn: bookDetails.physicalBookInfo.isbn || "",
        coverType: bookDetails.physicalBookInfo.coverType || "",
        publicationDate: bookDetails.physicalBookInfo.publicationDate 
          ? new Date(bookDetails.physicalBookInfo.publicationDate).toISOString().split('T')[0]
          : "",
        weightGrams: bookDetails.physicalBookInfo.weightGrams?.toString() || "",
        heightCm: bookDetails.physicalBookInfo.heightCm?.toString() || "",
        widthCm: bookDetails.physicalBookInfo.widthCm?.toString() || "",
        lengthCm: bookDetails.physicalBookInfo.lengthCm?.toString() || "",
        currentPrice: bookDetails.physicalBookInfo.currentPrice?.toString() || "",
      });
    } else {
      setPhysicalBookForm({
        isbn: "",
        coverType: "",
        publicationDate: "",
        weightGrams: "",
        heightCm: "",
        widthCm: "",
        lengthCm: "",
        currentPrice: "",
      });
    }
  }, [bookDetails?.physicalBookInfo]);

  // Sync ebook data to form state
  useEffect(() => {
    if (bookDetails?.ebookInfo) {
      setEbookForm({
        isbn: bookDetails.ebookInfo.isbn || "",
        publicationDate: bookDetails.ebookInfo.publicationDate 
          ? new Date(bookDetails.ebookInfo.publicationDate).toISOString().split('T')[0]
          : "",
        currentPrice: bookDetails.ebookInfo.currentPrice?.toString() || "",
      });
    } else {
      setEbookForm({
        isbn: "",
        publicationDate: "",
        currentPrice: "",
      });
    }
  }, [bookDetails?.ebookInfo]);

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

  // Create/Update physical book mutation
  const createUpdatePhysicalBookMutation = useMutation({
    mutationFn: () => bookId 
      ? CatalogService.getInstance().createOrUpdatePhysicalBook(bookId, {
          isbn: physicalBookForm.isbn || undefined,
          coverType: physicalBookForm.coverType || undefined,
          publicationDate: physicalBookForm.publicationDate || undefined,
          weightGrams: physicalBookForm.weightGrams ? Number(physicalBookForm.weightGrams) : undefined,
          heightCm: physicalBookForm.heightCm ? Number(physicalBookForm.heightCm) : undefined,
          widthCm: physicalBookForm.widthCm ? Number(physicalBookForm.widthCm) : undefined,
          lengthCm: physicalBookForm.lengthCm ? Number(physicalBookForm.lengthCm) : undefined,
          currentPrice: physicalBookForm.currentPrice ? Number(physicalBookForm.currentPrice) : undefined,
        })
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      setIsEditingPhysicalBook(false);
      toast({ 
        title: "Cập nhật thông tin sách giấy thành công", 
        description: "Thông tin sách giấy đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi cập nhật thông tin sách giấy", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Create/Update ebook mutation
  const createUpdateEbookMutation = useMutation({
    mutationFn: () => bookId 
      ? CatalogService.getInstance().createOrUpdateEbook(bookId, {
          isbn: ebookForm.isbn,
          publicationDate: ebookForm.publicationDate || undefined,
          currentPrice: Number(ebookForm.currentPrice),
        })
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      setIsEditingEbook(false);
      toast({ 
        title: "Cập nhật thông tin sách điện tử thành công", 
        description: "Thông tin sách điện tử đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi cập nhật thông tin sách điện tử", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Update book status mutation
  const updateBookStatusMutation = useMutation({
    mutationFn: (status: 'PUBLISHED' | 'UNPUBLISHED') => bookId 
      ? CatalogService.getInstance().updateBookStatus(bookId, status)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ 
        title: "Cập nhật trạng thái sách thành công", 
        description: "Trạng thái sách đã được cập nhật",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi cập nhật trạng thái", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const uploadEbookFileMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      if (!bookId) throw new Error("Book ID is required");
      
      // Step 1: Prepare upload
      const uploadResponse = await CatalogService.getInstance().prepareEbookFileUpload(
        bookId,
        file.name,
        file.type
      );
      
      // Step 2: Upload to presigned URL
      await CatalogService.getInstance().uploadFileToPresignedUrl(
        uploadResponse.uploadUrl,
        file
      );
      
      // Step 3: Confirm upload
      await CatalogService.getInstance().confirmEbookFileUpload(
        bookId,
        file.name,
        uploadResponse.key
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      setSelectedEbookFiles([]);
      toast({ 
        title: "Upload ebook file thành công", 
        description: "File đã được tải lên thành công",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi upload ebook file", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const deleteEbookFileMutation = useMutation({
    mutationFn: (fileId: number) => bookId 
      ? CatalogService.getInstance().deleteEbookFile(bookId, fileId)
      : Promise.reject(new Error("Book ID is required")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookDetails', bookId] });
      toast({ 
        title: "Xóa ebook file thành công", 
        description: "File đã được xóa thành công",
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi xóa ebook file", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleStatusToggle = () => {
    if (!bookDetails) return;
    const newStatus = bookDetails.status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    updateBookStatusMutation.mutate(newStatus);
  };

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
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Trạng thái</p>
                    <Badge 
                      variant={bookDetails.status === 'PUBLISHED' ? 'default' : 'secondary'}
                      className={bookDetails.status === 'PUBLISHED' ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {bookDetails.status === 'PUBLISHED' ? 'Đã xuất bản' : bookDetails.status === 'UNPUBLISHED' ? 'Chưa xuất bản' : '-'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStatusToggle}
                      disabled={updateBookStatusMutation.isPending}
                      title={bookDetails.status === 'PUBLISHED' ? 'Ẩn sách' : 'Đăng bán'}
                    >
                      {updateBookStatusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : bookDetails.status === 'PUBLISHED' ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-2" />
                          Ẩn sách
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Đăng bán
                        </>
                      )}
                    </Button>
                  </div>
                </div>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Thông tin sách giấy</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingPhysicalBook(true)}
                  className="border-0 h-6 w-6"
                  title="Chỉnh sửa thông tin sách giấy"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {bookDetails.physicalBookInfo && (
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
              )}
              {!bookDetails.physicalBookInfo && (
                <p className="text-sm text-muted-foreground">Chưa có thông tin sách giấy</p>
              )}
            </div>

            {/* Ebook Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold">Thông tin sách điện tử</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingEbook(true)}
                  className="border-0 h-6 w-6"
                  title="Chỉnh sửa thông tin sách điện tử"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {bookDetails.ebookInfo && (
                <div>
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
                  <div className="flex items-center justify-between mb-3 mt-6">
                    <h4 className="text-sm font-medium text-muted-foreground">Ebook Files</h4>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf,.epub,.mobi,.azw,.azw3"
                        className="hidden"
                        id="upload-ebook-file"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (files.length > 0) {
                            const file = files[0];
                            // Validate file size (max 100MB)
                            if (file.size > 100 * 1024 * 1024) {
                              toast({
                                title: "Lỗi",
                                description: "File quá lớn. Kích thước tối đa là 100MB",
                                variant: "destructive",
                              });
                              return;
                            }
                            setSelectedEbookFiles([file]);
                          }
                        }}
                      />
                      <Label htmlFor="upload-ebook-file" className="cursor-pointer">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          asChild
                          disabled={uploadEbookFileMutation.isPending}
                          className="border-0"
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                          </span>
                        </Button>
                      </Label>
                      {selectedEbookFiles.length > 0 && (
                        <Button
                          type="button"
                          variant="default"
                          size="sm"
                          onClick={() => {
                            const file = selectedEbookFiles[0];
                            setUploadingEbookFiles(prev => ({ ...prev, [file.name]: true }));
                            uploadEbookFileMutation.mutate(
                              { file },
                              {
                                onSettled: () => {
                                  setUploadingEbookFiles(prev => {
                                    const newState = { ...prev };
                                    delete newState[file.name];
                                    return newState;
                                  });
                                },
                              }
                            );
                          }}
                          disabled={uploadEbookFileMutation.isPending}
                        >
                          {uploadEbookFileMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Đang upload...
                            </>
                          ) : (
                            "Upload"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {/* Existing ebook files */}
                    {bookDetails.ebookInfo.files && bookDetails.ebookInfo.files.length > 0 && (
                      <>
                        {bookDetails.ebookInfo.files.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-3 border rounded-md group">
                            <div className="flex items-center gap-3">
                              <BookOpen className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.fileName}</p>
                                {file.downloadCount !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    Đã tải: {file.downloadCount} lần
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                if (confirm('Bạn có chắc chắn muốn xóa file này?')) {
                                  deleteEbookFileMutation.mutate(file.id);
                                }
                              }}
                              disabled={deleteEbookFileMutation.isPending}
                            >
                              {deleteEbookFileMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                    {/* Preview selected file */}
                    {selectedEbookFiles.map((file, index) => (
                      <div key={`preview-${index}`} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedEbookFiles([]);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!bookDetails.ebookInfo.files || bookDetails.ebookInfo.files.length === 0) && selectedEbookFiles.length === 0 && (
                      <p className="text-sm text-muted-foreground">Chưa có ebook file nào. Hãy tải lên file cho cuốn sách này.</p>
                    )}
                  </div>
                </div>
              )}
              {!bookDetails.ebookInfo && (
                <p className="text-sm text-muted-foreground">Chưa có thông tin sách điện tử</p>
              )}
            </div>
            
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

      {/* Physical Book Edit Dialog */}
      <Dialog open={isEditingPhysicalBook} onOpenChange={setIsEditingPhysicalBook}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin sách giấy</DialogTitle>
            <DialogDescription>
              {bookDetails?.physicalBookInfo ? "Cập nhật" : "Thêm"} thông tin sách giấy
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createUpdatePhysicalBookMutation.mutate();
            }}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="physical-isbn">ISBN</Label>
                <Input
                  id="physical-isbn"
                  value={physicalBookForm.isbn}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, isbn: e.target.value })}
                  placeholder="Nhập ISBN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-coverType">Loại bìa</Label>
                <select
                  id="physical-coverType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={physicalBookForm.coverType}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, coverType: e.target.value })}
                >
                  <option value="">Chọn loại bìa</option>
                  <option value="HARDCOVER">Bìa cứng</option>
                  <option value="PAPERBACK">Bìa mềm</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-publicationDate">Ngày xuất bản</Label>
                <Input
                  id="physical-publicationDate"
                  type="date"
                  value={physicalBookForm.publicationDate}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, publicationDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-currentPrice">Giá (VNĐ)</Label>
                <Input
                  id="physical-currentPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={physicalBookForm.currentPrice}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, currentPrice: e.target.value })}
                  placeholder="Nhập giá"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-weightGrams">Trọng lượng (gram)</Label>
                <Input
                  id="physical-weightGrams"
                  type="number"
                  min="0"
                  value={physicalBookForm.weightGrams}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, weightGrams: e.target.value })}
                  placeholder="Nhập trọng lượng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-heightCm">Chiều cao (cm)</Label>
                <Input
                  id="physical-heightCm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={physicalBookForm.heightCm}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, heightCm: e.target.value })}
                  placeholder="Nhập chiều cao"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-widthCm">Chiều rộng (cm)</Label>
                <Input
                  id="physical-widthCm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={physicalBookForm.widthCm}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, widthCm: e.target.value })}
                  placeholder="Nhập chiều rộng"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="physical-lengthCm">Chiều dài (cm)</Label>
                <Input
                  id="physical-lengthCm"
                  type="number"
                  step="0.1"
                  min="0"
                  value={physicalBookForm.lengthCm}
                  onChange={(e) => setPhysicalBookForm({ ...physicalBookForm, lengthCm: e.target.value })}
                  placeholder="Nhập chiều dài"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingPhysicalBook(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createUpdatePhysicalBookMutation.isPending}
              >
                {createUpdatePhysicalBookMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ebook Edit Dialog */}
      <Dialog open={isEditingEbook} onOpenChange={setIsEditingEbook}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin sách điện tử</DialogTitle>
            <DialogDescription>
              {bookDetails?.ebookInfo ? "Cập nhật" : "Thêm"} thông tin sách điện tử
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!ebookForm.isbn || !ebookForm.currentPrice) {
                toast({
                  title: "Lỗi",
                  description: "ISBN và giá là bắt buộc",
                  variant: "destructive",
                });
                return;
              }
              createUpdateEbookMutation.mutate();
            }}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ebook-isbn">E-ISBN <span className="text-red-500">*</span></Label>
                <Input
                  id="ebook-isbn"
                  value={ebookForm.isbn}
                  onChange={(e) => setEbookForm({ ...ebookForm, isbn: e.target.value })}
                  placeholder="Nhập E-ISBN"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ebook-publicationDate">Ngày xuất bản</Label>
                <Input
                  id="ebook-publicationDate"
                  type="date"
                  value={ebookForm.publicationDate}
                  onChange={(e) => setEbookForm({ ...ebookForm, publicationDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ebook-currentPrice">Giá (VNĐ) <span className="text-red-500">*</span></Label>
                <Input
                  id="ebook-currentPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={ebookForm.currentPrice}
                  onChange={(e) => setEbookForm({ ...ebookForm, currentPrice: e.target.value })}
                  placeholder="Nhập giá"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingEbook(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createUpdateEbookMutation.isPending}
              >
                {createUpdateEbookMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
