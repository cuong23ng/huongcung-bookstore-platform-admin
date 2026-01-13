import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { GenresTable } from "../../components/catalog/GenresTable";
import { GenreFormDialog } from "../../components/catalog/GenreFormDialog";
import { useToast } from "../../hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { CatalogService } from "../../services/CatalogService";
import { getAuthData } from "../../services/AdminAuthService";
import { Header } from "../../components/Header";
import type { Genre, CreateGenreRequest } from "../../models";

export default function GenresManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [genreDialogOpen, setGenreDialogOpen] = useState(false);
  
  // Genre form state
  const [genreFormData, setGenreFormData] = useState<Partial<CreateGenreRequest>>({
    name: "",
    description: "",
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

  // Genres
  const { data: genres = [], isLoading: isLoadingGenres, error: genresError, refetch: refetchGenres } = useQuery({
    queryKey: ['genres'],
    queryFn: () => CatalogService.getInstance().getAllGenres(),
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

  // Delete genre mutation
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

  const handleDelete = (genreId: number, genreName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ${genreName}?`)) return;
    deleteGenreMutation.mutate(genreId);
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

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý thể loại</h1>
        </div>
      </header> */}
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách thể loại</CardTitle>
            <CardDescription>Quản lý thông tin thể loại trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
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
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
