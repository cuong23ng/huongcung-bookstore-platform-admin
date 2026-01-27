import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BookDetailsDialog } from "../components/BookDetailsDialog";
import { BooksTable } from "../components/catalog/BooksTable";
import { AuthorsTable } from "../components/catalog/AuthorsTable";
import { GenresTable } from "../components/catalog/GenresTable";
import { TranslatorsTable } from "../components/catalog/TranslatorsTable";
import { BookFormDialog } from "../components/catalog/BookFormDialog";
import { AuthorFormDialog } from "../components/catalog/AuthorFormDialog";
import { GenreFormDialog } from "../components/catalog/GenreFormDialog";
import { TranslatorFormDialog } from "../components/catalog/TranslatorFormDialog";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { CatalogService } from "../services/CatalogService";
import { getAuthData } from "../services/AdminAuthService";
import { Header } from "../components/Header";
import type { CreateBookRequest, Book, Author, Genre, Publisher, Translator, BookImageData, CreateAuthorRequest, CreateGenreRequest, CreateTranslatorRequest, ImageData } from "../models";

export default function CatalogManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("books");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authorDialogOpen, setAuthorDialogOpen] = useState(false);
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  const [translatorDialogOpen, setTranslatorDialogOpen] = useState(false);
  const [bookDetailsDialogOpen, setBookDetailsDialogOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  // Author form state
  const [authorFormData, setAuthorFormData] = useState<Partial<CreateAuthorRequest>>({
    name: "",
    biography: "",
    nationality: "",
    birthDate: "",
  });
  const [authorAvatar, setAuthorAvatar] = useState<File | null>(null);
  const [authorAvatarPreview, setAuthorAvatarPreview] = useState<string | null>(null);
  
  // Genre form state
  const [genreFormData, setGenreFormData] = useState<Partial<CreateGenreRequest>>({
    name: "",
    description: "",
  });
  
  // Translator form state
  const [translatorFormData, setTranslatorFormData] = useState<Partial<CreateTranslatorRequest>>({
    name: "",
    biography: "",
    birthDate: "",
  });
  const [translatorAvatar, setTranslatorAvatar] = useState<File | null>(null);
  const [translatorAvatarPreview, setTranslatorAvatarPreview] = useState<string | null>(null);
  
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
    queryKey: ['books'],
    queryFn: () => CatalogService.getInstance().getAllBooks(),
    enabled: activeTab === 'books',
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

  // Authors
  const { data: authors = [], isLoading: isLoadingAuthors, error: authorsError, refetch: refetchAuthors } = useQuery({
    queryKey: ['authors'],
    queryFn: () => CatalogService.getInstance().getAllAuthors(),
    enabled: activeTab === 'authors' || (activeTab === 'books' && dialogOpen), // Only load when authors tab is active or when book form dialog is open
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

  // Genres
  const { data: genres = [], isLoading: isLoadingGenres, error: genresError, refetch: refetchGenres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => CatalogService.getInstance().getAllGenres(),
    enabled: activeTab === 'genres' || (activeTab === 'books' && dialogOpen), // Only load when genres tab is active or when book form dialog is open
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
    enabled: activeTab === 'books' && dialogOpen, // Only load when book form dialog is open
  });

  // Translators
  const { data: translators = [], isLoading: isLoadingTranslators, error: translatorsError, refetch: refetchTranslators } = useQuery({
    queryKey: ['translators'],
    queryFn: () => CatalogService.getInstance().getAllTranslators(),
    enabled: activeTab === 'translators' || (activeTab === 'books' && dialogOpen),
  });

  useEffect(() => {
    if (translatorsError && !isLoadingTranslators) {
      toast({ 
        title: "Lỗi tải danh sách dịch giả", 
        description: translatorsError instanceof Error ? translatorsError.message : "Có lỗi xảy ra", 
        variant: "destructive" 
      });
    }
  }, [translatorsError, isLoadingTranslators, toast]);

  // Delete mutations
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

  const deleteAuthorMutation = useMutation({
    mutationFn: (id: number) => CatalogService.getInstance().deleteAuthor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authors'] });
      toast({ title: "Xóa tác giả thành công" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi xóa tác giả", description: error.message, variant: "destructive" });
    },
  });

  const deleteGenreMutation = useMutation({
    mutationFn: (id: number) => CatalogService.getInstance().deleteGenre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genres'] });
      toast({ title: "Xóa thể loại thành công" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi xóa thể loại", description: error.message, variant: "destructive" });
    },
  });

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

  // Create author mutation
  const createAuthorMutation = useMutation({
    mutationFn: (data: CreateAuthorRequest) => CatalogService.getInstance().createAuthor(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['authors'] });
      await refetchAuthors();
      toast({ title: "Thêm tác giả thành công" });
      setAuthorDialogOpen(false);
      setAuthorFormData({
        name: "",
        biography: "",
        nationality: "",
        birthDate: "",
      });
      setAuthorAvatar(null);
      setAuthorAvatarPreview(null);
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi thêm tác giả", description: error.message, variant: "destructive" });
    },
  });

  // Create genre mutation
  const createGenreMutation = useMutation({
    mutationFn: (data: CreateGenreRequest) => CatalogService.getInstance().createGenre(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['genres'] });
      await refetchGenres();
      toast({ title: "Thêm thể loại thành công" });
      setGenreDialogOpen(false);
      setGenreFormData({
        name: "",
        description: "",
      });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi thêm thể loại", description: error.message, variant: "destructive" });
    },
  });

  // Create translator mutation
  const createTranslatorMutation = useMutation({
    mutationFn: (data: CreateTranslatorRequest) => CatalogService.getInstance().createTranslator(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['translators'] });
      await refetchTranslators();
      toast({ title: "Thêm dịch giả thành công" });
      setTranslatorDialogOpen(false);
      setTranslatorFormData({
        name: "",
        biography: "",
        birthDate: "",
      });
      setTranslatorAvatar(null);
      setTranslatorAvatarPreview(null);
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi thêm dịch giả", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (type: string, id: number, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${name}?`)) return;
    
    switch (type) {
      case "book":
        deleteBookMutation.mutate(id);
        break;
      case "author":
        deleteAuthorMutation.mutate(id);
        break;
      case "genre":
        deleteGenreMutation.mutate(id);
        break;
    }
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

  const handleAuthorAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng chọn file ảnh hợp lệ", 
        variant: "destructive" 
      });
      return;
    }

    setAuthorAvatar(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAuthorAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAuthorAvatar = () => {
    setAuthorAvatar(null);
    setAuthorAvatarPreview(null);
  };

  const handleAuthorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authorFormData.name || !authorFormData.name.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên tác giả", variant: "destructive" });
      return;
    }

    // Convert avatar to base64 if provided
    let imageData: ImageData | undefined = undefined;
    if (authorAvatar) {
      try {
        const base64Data = await convertFileToBase64(authorAvatar);
        imageData = {
          fileName: authorAvatar.name,
          fileType: authorAvatar.type,
          base64Data: base64Data,
        };
      } catch (error) {
        toast({ 
          title: "Lỗi", 
          description: "Không thể chuyển đổi ảnh sang base64", 
          variant: "destructive" 
        });
        return;
      }
    }

    const requestData: CreateAuthorRequest = {
      name: authorFormData.name.trim(),
      biography: authorFormData.biography?.trim() || undefined,
      nationality: authorFormData.nationality?.trim() || undefined,
      birthDate: authorFormData.birthDate || undefined,
      image: imageData,
    };

    createAuthorMutation.mutate(requestData);
  };

  const handleGenreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!genreFormData.name || !genreFormData.name.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên thể loại", variant: "destructive" });
      return;
    }

    const requestData: CreateGenreRequest = {
      name: genreFormData.name.trim(),
      description: genreFormData.description?.trim() || undefined,
    };

    createGenreMutation.mutate(requestData);
  };

  const handleTranslatorAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng chọn file ảnh hợp lệ", 
        variant: "destructive" 
      });
      return;
    }

    setTranslatorAvatar(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setTranslatorAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeTranslatorAvatar = () => {
    setTranslatorAvatar(null);
    setTranslatorAvatarPreview(null);
  };

  const handleTranslatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!translatorFormData.name || !translatorFormData.name.trim()) {
      toast({ title: "Lỗi", description: "Vui lòng nhập tên dịch giả", variant: "destructive" });
      return;
    }

    // Convert avatar to base64 if provided
    let imageData: ImageData | undefined = undefined;
    if (translatorAvatar) {
      try {
        const base64Data = await convertFileToBase64(translatorAvatar);
        imageData = {
          fileName: translatorAvatar.name,
          fileType: translatorAvatar.type,
          base64Data: base64Data,
        };
      } catch (error) {
        toast({ 
          title: "Lỗi", 
          description: "Không thể chuyển đổi ảnh sang base64", 
          variant: "destructive" 
        });
        return;
      }
    }

    const requestData: CreateTranslatorRequest = {
      name: translatorFormData.name.trim(),
      biography: translatorFormData.biography?.trim() || undefined,
      birthDate: translatorFormData.birthDate || undefined,
      image: imageData,
    };

    createTranslatorMutation.mutate(requestData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý danh mục</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Danh mục sách</CardTitle>
            <CardDescription>Quản lý sách, tác giả, và thể loại</CardDescription>
          </CardHeader>
          <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="books">Sách</TabsTrigger>
                  <TabsTrigger value="authors">Tác giả</TabsTrigger>
                  <TabsTrigger value="genres">Thể loại</TabsTrigger>
                  <TabsTrigger value="translators">Dịch giả</TabsTrigger>
                </TabsList>

                <TabsContent value="books" className="mt-4">
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
                    onDelete={(bookId, bookTitle) => handleDelete("book", bookId, bookTitle)}
                    onStatusUpdate={handleStatusUpdate}
                    isUpdatingStatus={updateBookStatusMutation.isPending}
                  />
                </TabsContent>

              <TabsContent value="authors" className="mt-4">
                <div className="flex justify-end mb-4">
                  <AuthorFormDialog
                    open={authorDialogOpen}
                    onOpenChange={setAuthorDialogOpen}
                    formData={authorFormData}
                    onFormDataChange={setAuthorFormData}
                    avatar={authorAvatar}
                    avatarPreview={authorAvatarPreview}
                    onAvatarSelect={handleAuthorAvatarSelect}
                    onAvatarRemove={removeAuthorAvatar}
                    onSubmit={handleAuthorSubmit}
                    isSubmitting={createAuthorMutation.isPending}
                          />
                        </div>
                <AuthorsTable
                  authors={authors as Author[]}
                  isLoading={isLoadingAuthors}
                  error={authorsError}
                  onDelete={(authorId, authorName) => handleDelete("author", authorId, authorName)}
                />
              </TabsContent>

              <TabsContent value="genres" className="mt-4">
                <div className="flex justify-end mb-4">
                  <GenreFormDialog
                    open={genreDialogOpen}
                    onOpenChange={setGenreDialogOpen}
                    formData={genreFormData}
                    onFormDataChange={setGenreFormData}
                    onSubmit={handleGenreSubmit}
                    isSubmitting={createGenreMutation.isPending}
                          />
                        </div>
                <GenresTable
                  genres={genres as Genre[]}
                  isLoading={isLoadingGenres}
                  error={genresError}
                  onDelete={(genreId, genreName) => handleDelete("genre", genreId, genreName)}
                />
              </TabsContent>

              <TabsContent value="translators" className="mt-4">
                <div className="flex justify-end mb-4">
                  <TranslatorFormDialog
                    open={translatorDialogOpen}
                    onOpenChange={setTranslatorDialogOpen}
                    formData={translatorFormData}
                    onFormDataChange={setTranslatorFormData}
                    avatar={translatorAvatar}
                    avatarPreview={translatorAvatarPreview}
                    onAvatarSelect={handleTranslatorAvatarSelect}
                    onAvatarRemove={removeTranslatorAvatar}
                    onSubmit={handleTranslatorSubmit}
                    isSubmitting={createTranslatorMutation.isPending}
                          />
                        </div>
                <TranslatorsTable
                  translators={translators as Translator[]}
                  isLoading={isLoadingTranslators}
                  error={translatorsError}
                  onDelete={(translatorId, translatorName) => handleDelete("translator", translatorId, translatorName)}
                />
              </TabsContent>
            </Tabs>

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

