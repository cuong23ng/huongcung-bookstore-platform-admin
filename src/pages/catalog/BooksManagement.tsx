import { useEffect, useState, useDeferredValue } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { BookDetailsDialog } from "../../components/BookDetailsDialog";
import { BooksTable } from "../../components/catalog/BooksTable";
import { BookFormDialog } from "../../components/catalog/BookFormDialog";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft, Search, X } from "lucide-react";
import { CatalogService } from "../../services/CatalogService";
import { getAuthData } from "../../services/AdminAuthService";
import { Header } from "../../components/Header";
import type { CreateBookRequest, Book, Author, Genre, Publisher, Translator, BookImageData } from "../../models";

export default function BooksManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookDetailsDialogOpen, setBookDetailsDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  
  // Deferred value for search to debounce API calls
  const deferredSearchQuery = useDeferredValue(searchQuery);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CreateBookRequest>>({
    title: "",
    description: "",
    language: "VIETNAMESE",
    publicationDate: "",
    pageCount: undefined,
    edition: undefined,
    authorIds: [],
    translatorIds: [],
    publisherId: undefined,
    genreIds: [],
    hasPhysicalEdition: false,
    hasElectricEdition: false,
    isbn: "",
    eisbn: "",
    coverType: undefined,
    weightGrams: undefined,
    heightCm: undefined,
    widthCm: undefined,
    lengthCm: undefined,
    physicalBookPrice: undefined,
    ebookPrice: undefined,
  });

  const userInfo = getAuthData();
  // Normalize role: remove ROLE_ prefix if present and convert to lowercase
  let userRole = '';
  if (userInfo?.roles && userInfo.roles.length > 0) {
    userRole = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
  } else if (userInfo?.userType) {
    userRole = userInfo.userType.toLowerCase();
  }

  // Check admin access
  useEffect(() => {
    if (!userInfo) {
      navigate("/admin/login");
      return;
    }

    if (userRole !== 'admin') {
      toast({
        title: "Không có quyền truy cập",
        description: "Chỉ quản trị viên mới có thể truy cập trang này",
        variant: "destructive",
      });
      navigate("/admin/dashboard");
    }
  }, [navigate, toast, userInfo, userRole]);

  // Books
  const { data: books = [], isLoading: isLoadingBooks, error: booksError, refetch: refetchBooks } = useQuery({
    queryKey: ['books', deferredSearchQuery, selectedLanguage, selectedGenres],
    queryFn: () => CatalogService.getInstance().getAllBooks({
      q: deferredSearchQuery || undefined,
      languages: selectedLanguage ? [selectedLanguage] : undefined,
      genres: selectedGenres.length > 0 ? selectedGenres : undefined,
    }),
  });

  useEffect(() => {
    if (booksError && !isLoadingBooks) {
      toast({ 
        title: "Lỗi tải danh sách sách", 
        description: booksError instanceof Error ? booksError.message : "Có lỗi xảy ra", 
        variant: "destructive" 
      });
    }
  }, [booksError, isLoadingBooks, toast]);

  // Authors (needed for book form)
  const { data: authors = [], isLoading: isLoadingAuthors, error: authorsError } = useQuery({
    queryKey: ['authors'],
    queryFn: () => CatalogService.getInstance().getAllAuthors(),
    enabled: dialogOpen, // Only load when book form dialog is open
  });

  useEffect(() => {
    if (authorsError && !isLoadingAuthors) {
      toast({ 
        title: "Lỗi tải danh sách tác giả", 
        description: authorsError instanceof Error ? authorsError.message : "Có lỗi xảy ra", 
        variant: "destructive" 
      });
    }
  }, [authorsError, isLoadingAuthors, toast]);

  // Genres (needed for book form and filter)
  const { data: genres = [], isLoading: isLoadingGenres, error: genresError } = useQuery({
    queryKey: ['genres'],
    queryFn: () => CatalogService.getInstance().getAllGenres(),
    enabled: true, // Load genres early for filter dropdown
  });

  useEffect(() => {
    if (genresError && !isLoadingGenres) {
      toast({ 
        title: "Lỗi tải danh sách thể loại", 
        description: genresError instanceof Error ? genresError.message : "Có lỗi xảy ra", 
        variant: "destructive" 
      });
    }
  }, [genresError, isLoadingGenres, toast]);

  // Publishers (only needed for book form)
  const { data: publishers = [] } = useQuery({
    queryKey: ['publishers'],
    queryFn: () => CatalogService.getInstance().getAllPublishers(),
    enabled: dialogOpen, // Only load when book form dialog is open
  });

  // Translators (only needed for book form)
  const { data: translators = [], isLoading: isLoadingTranslators } = useQuery({
    queryKey: ['translators'],
    queryFn: () => CatalogService.getInstance().getAllTranslators(),
    enabled: dialogOpen,
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: (id: number) => CatalogService.getInstance().deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast({ title: "Xóa sách thành công" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi xóa sách", description: error.message, variant: "destructive" });
    },
  });

  // Update book status mutation
  const updateBookStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'PUBLISHED' | 'UNPUBLISHED' }) => 
      CatalogService.getInstance().updateBookStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['bookDetails'] });
      toast({ title: "Cập nhật trạng thái sách thành công" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi cập nhật trạng thái", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const handleStatusUpdate = (bookId: number, currentStatus: 'PUBLISHED' | 'UNPUBLISHED' | undefined) => {
    const newStatus = currentStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
    updateBookStatusMutation.mutate({ id: bookId, status: newStatus });
  };

  const handleViewBookDetails = (bookId: number) => {
    setSelectedBookId(bookId);
    setBookDetailsDialogOpen(true);
  };

  const handleCloseBookDetails = (open: boolean) => {
    setBookDetailsDialogOpen(open);
    if (!open) {
      setSelectedBookId(null);
    }
  };

  // Create book mutation
  const createBookMutation = useMutation({
    mutationFn: (data: CreateBookRequest) => CatalogService.getInstance().createBook(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['books'] });
      await refetchBooks();
      toast({ title: "Thêm sách thành công" });
      setDialogOpen(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        language: "VIETNAMESE",
        publicationDate: "",
        pageCount: undefined,
        edition: undefined,
        authorIds: [],
        translatorIds: [],
        publisherId: undefined,
        genreIds: [],
        hasPhysicalEdition: false,
        hasElectricEdition: false,
        isbn: "",
        eisbn: "",
        coverType: undefined,
        weightGrams: undefined,
        heightCm: undefined,
        widthCm: undefined,
        lengthCm: undefined,
        physicalBookPrice: undefined,
        ebookPrice: undefined,
      });
      setSelectedImages([]);
      setImagePreviews([]);
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi thêm sách", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (bookId: number, bookTitle: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${bookTitle}?`)) return;
    deleteBookMutation.mutate(bookId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.title || !formData.title.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tiêu đề sách", variant: "destructive" });
      return;
    }
    
    if (!formData.authorIds || formData.authorIds.length === 0) {
      toast({ title: "Lỗi", description: "Vui lòng chọn ít nhất một tác giả", variant: "destructive" });
      return;
    }

    if (!formData.hasPhysicalEdition && !formData.hasElectricEdition) {
      toast({ title: "Lỗi", description: "Vui lòng chọn ít nhất một loại sách (sách giấy hoặc ebook)", variant: "destructive" });
      return;
    }

    // Convert images to base64
    const images: BookImageData[] = [];
    if (selectedImages.length > 0) {
      for (let i = 0; i < selectedImages.length; i++) {
        const file = selectedImages[i];
        try {
          const base64Data = await convertFileToBase64(file);
          images.push({
            fileName: file.name,
            fileType: file.type,
            base64Data: base64Data,
            position: i + 1, // Position starts from 1
          });
        } catch (error) {
          toast({ 
            title: "Lỗi", 
            description: `Không thể chuyển đổi ảnh ${file.name} sang base64`, 
            variant: "destructive" 
          });
          return;
        }
      }
    }

    const requestData: CreateBookRequest = {
      title: formData.title.trim(),
      description: formData.description?.trim() || undefined,
      language: formData.language || "VIETNAMESE",
      publicationDate: formData.publicationDate || undefined,
      pageCount: formData.pageCount ? Number(formData.pageCount) : undefined,
      edition: formData.edition ? Number(formData.edition) : undefined,
      authorIds: formData.authorIds || [],
      translatorIds: formData.translatorIds && formData.translatorIds.length > 0 ? formData.translatorIds : undefined,
      publisherId: formData.publisherId || undefined,
      genreIds: formData.genreIds && formData.genreIds.length > 0 ? formData.genreIds : undefined,
      hasPhysicalEdition: formData.hasPhysicalEdition || false,
      hasElectricEdition: formData.hasElectricEdition || false,
      isbn: formData.hasPhysicalEdition && formData.isbn ? formData.isbn.trim() : undefined,
      eisbn: formData.hasElectricEdition && formData.eisbn ? formData.eisbn.trim() : undefined,
      coverType: formData.hasPhysicalEdition && formData.coverType ? formData.coverType : undefined,
      weightGrams: formData.hasPhysicalEdition && formData.weightGrams ? Number(formData.weightGrams) : undefined,
      heightCm: formData.hasPhysicalEdition && formData.heightCm ? Number(formData.heightCm) : undefined,
      widthCm: formData.hasPhysicalEdition && formData.widthCm ? Number(formData.widthCm) : undefined,
      lengthCm: formData.hasPhysicalEdition && formData.lengthCm ? Number(formData.lengthCm) : undefined,
      physicalBookPrice: formData.hasPhysicalEdition && formData.physicalBookPrice ? Number(formData.physicalBookPrice) : undefined,
      ebookPrice: formData.hasElectricEdition && formData.ebookPrice ? Number(formData.ebookPrice) : undefined,
      images: images.length > 0 ? images : undefined,
    };

    createBookMutation.mutate(requestData);
  };

  const toggleAuthor = (authorId: number) => {
    const currentIds = formData.authorIds || [];
    const newIds = currentIds.includes(authorId)
      ? currentIds.filter(id => id !== authorId)
      : [...currentIds, authorId];
    setFormData({ ...formData, authorIds: newIds });
  };

  const toggleTranslator = (translatorId: number) => {
    const currentIds = formData.translatorIds || [];
    const newIds = currentIds.includes(translatorId)
      ? currentIds.filter(id => id !== translatorId)
      : [...currentIds, translatorId];
    setFormData({ ...formData, translatorIds: newIds });
  };

  const toggleGenre = (genreId: number) => {
    const currentIds = formData.genreIds || [];
    const newIds = currentIds.includes(genreId)
      ? currentIds.filter(id => id !== genreId)
      : [...currentIds, genreId];
    setFormData({ ...formData, genreIds: newIds });
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng chọn file ảnh hợp lệ", 
        variant: "destructive" 
      });
      return;
    }

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = await Promise.all(
      validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        });
      })
    );
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (data:image/jpeg;base64,)
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedLanguage(undefined);
    setSelectedGenres([]);
  };

  const hasActiveFilters = searchQuery.trim() !== '' || selectedLanguage !== undefined || selectedGenres.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý sách</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách sách</CardTitle>
            <CardDescription>Quản lý thông tin sách trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filters Section */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Label htmlFor="search-books">Tìm kiếm sách</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-books"
                      placeholder="Nhập tên sách..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Language Filter */}
                <div>
                  <Label htmlFor="language-filter">Ngôn ngữ</Label>
                  <Select
                    value={selectedLanguage || 'all'}
                    onValueChange={(value) => setSelectedLanguage(value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger id="language-filter">
                      <SelectValue placeholder="Tất cả ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả ngôn ngữ</SelectItem>
                      <SelectItem value="VIETNAMESE">Tiếng Việt</SelectItem>
                      <SelectItem value="ENGLISH">Tiếng Anh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Genre Filter */}
                <div>
                  <Label htmlFor="genre-filter">Thể loại</Label>
                  <Select
                    value={selectedGenres.length > 0 ? selectedGenres[0] : 'all'}
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setSelectedGenres([]);
                      } else {
                        setSelectedGenres([value]);
                      }
                    }}
                  >
                    <SelectTrigger id="genre-filter">
                      <SelectValue placeholder="Tất cả thể loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả thể loại</SelectItem>
                      {genres.map((genre) => (
                        <SelectItem key={genre.id || genre.code} value={genre.code || genre.name || ''}>
                          {genre.name || genre.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {/* {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                </div>
              )} */}
            </div>

            <div className="flex justify-end mb-4">
              <BookFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                formData={formData}
                onFormDataChange={setFormData}
                imagePreviews={imagePreviews}
                onImageSelect={handleImageSelect}
                onImageRemove={removeImage}
                authors={authors as Author[]}
                isLoadingAuthors={isLoadingAuthors}
                translators={translators as Translator[]}
                isLoadingTranslators={isLoadingTranslators}
                publishers={publishers as Publisher[]}
                genres={genres as Genre[]}
                isLoadingGenres={isLoadingGenres}
                onToggleAuthor={toggleAuthor}
                onToggleTranslator={toggleTranslator}
                onToggleGenre={toggleGenre}
                onSubmit={handleSubmit}
                isSubmitting={createBookMutation.isPending}
              />
            </div>
            <BooksTable
              books={books as Book[]}
              isLoading={isLoadingBooks}
              error={booksError}
              onViewDetails={handleViewBookDetails}
              onDelete={handleDelete}
              onStatusUpdate={handleStatusUpdate}
              isUpdatingStatus={updateBookStatusMutation.isPending}
            />

            {/* Book Details Dialog */}
            <BookDetailsDialog
              open={bookDetailsDialogOpen}
              onOpenChange={handleCloseBookDetails}
              bookId={selectedBookId}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
