import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { AuthorsTable } from "../../components/catalog/AuthorsTable";
import { AuthorFormDialog } from "../../components/catalog/AuthorFormDialog";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { CatalogService } from "../../services/CatalogService";
import { getAuthData } from "../../services/AdminAuthService";
import { Header } from "../../components/Header";
import type { Author, CreateAuthorRequest, ImageData } from "../../models";

export default function AuthorsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [authorDialogOpen, setAuthorDialogOpen] = useState(false);
  
  // Author form state
  const [authorFormData, setAuthorFormData] = useState<Partial<CreateAuthorRequest>>({
    name: "",
    bio: "",
    nationality: "",
    birthDate: "",
  });
  const [authorAvatar, setAuthorAvatar] = useState<File | null>(null);
  const [authorAvatarPreview, setAuthorAvatarPreview] = useState<string | null>(null);

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

  // Authors
  const { data: authors = [], isLoading: isLoadingAuthors, error: authorsError, refetch: refetchAuthors } = useQuery({
    queryKey: ['authors'],
    queryFn: () => CatalogService.getInstance().getAllAuthors(),
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

  // Delete author mutation
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
        bio: "",
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

  const handleDelete = (authorId: number, authorName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${authorName}?`)) return;
    deleteAuthorMutation.mutate(authorId);
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
      bio: authorFormData.bio?.trim() || undefined,
      nationality: authorFormData.nationality?.trim() || undefined,
      birthDate: authorFormData.birthDate || undefined,
      image: imageData,
    };

    createAuthorMutation.mutate(requestData);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý tác giả</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách tác giả</CardTitle>
            <CardDescription>Quản lý thông tin tác giả trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
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
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
