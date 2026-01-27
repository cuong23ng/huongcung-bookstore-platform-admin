import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { TranslatorsTable } from "../../components/catalog/TranslatorsTable";
import { TranslatorFormDialog } from "../../components/catalog/TranslatorFormDialog";
import { useToast } from "../../hooks/use-toast";
import { CatalogService } from "../../services/CatalogService";
import { getAuthData } from "../../services/AdminAuthService";
import { Header } from "../../components/Header";
import type { CreateTranslatorRequest, ImageData } from "../../models";

export default function TranslatorsManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [translatorDialogOpen, setTranslatorDialogOpen] = useState(false);
  
  // Translator form state
  const [translatorFormData, setTranslatorFormData] = useState<Partial<CreateTranslatorRequest>>({
    name: "",
    biography: "",
    birthDate: "",
  });
  const [translatorAvatar, setTranslatorAvatar] = useState<File | null>(null);
  const [translatorAvatarPreview, setTranslatorAvatarPreview] = useState<string | null>(null);

  const userInfo = getAuthData();
  let userRole = '';
  if (userInfo?.roles && userInfo.roles.length > 0) {
    userRole = userInfo.roles[0].toLowerCase().replace(/^role_/, '');
  } else if (userInfo?.userType) {
    userRole = userInfo.userType.toLowerCase();
  }

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

  // Translators
  const { data: translators = [], isLoading: isLoadingTranslators, error: translatorsError, refetch: refetchTranslators } = useQuery({
    queryKey: ['translators'],
    queryFn: () => CatalogService.getInstance().getAllTranslators(),
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

  // Delete translator mutation
  const deleteTranslatorMutation = useMutation({
    mutationFn: (id: number) => CatalogService.getInstance().deleteTranslator(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translators'] });
      toast({ title: "Xóa dịch giả thành công" });
    },
    onError: (error: Error) => {
      toast({ title: "Lỗi xóa dịch giả", description: error.message, variant: "destructive" });
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

  const handleDelete = (translatorId: number, translatorName: string) => {
    if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa ${translatorName}?`)) return;
    deleteTranslatorMutation.mutate(translatorId);
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

  const handleTranslatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!translatorFormData.name?.trim()) {
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
        const errorMessage = error instanceof Error ? error.message : "Không thể chuyển đổi ảnh sang base64";
        toast({ 
          title: "Lỗi", 
          description: errorMessage, 
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
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Danh sách dịch giả</CardTitle>
            <CardDescription>Quản lý thông tin dịch giả trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
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
              translators={translators}
              isLoading={isLoadingTranslators}
              error={translatorsError}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
