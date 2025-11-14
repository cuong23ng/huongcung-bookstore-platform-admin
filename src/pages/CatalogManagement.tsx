import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { CatalogService } from "../services/CatalogService";
import { AdminAuthService, getAuthData } from "../services/AdminAuthService";
import type { Book, Author, Genre } from "../models";

export default function CatalogManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("books");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

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
  const { data: books = [], isLoading: isLoadingBooks, error: booksError } = useQuery({
    queryKey: ['books'],
    queryFn: () => CatalogService.getInstance().getAllBooks(),
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi tải danh sách sách", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Authors
  const { data: authors = [], isLoading: isLoadingAuthors, error: authorsError } = useQuery({
    queryKey: ['authors'],
    queryFn: () => CatalogService.getInstance().getAllAuthors(),
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi tải danh sách tác giả", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  // Genres
  const { data: genres = [], isLoading: isLoadingGenres, error: genresError } = useQuery({
    queryKey: ['genres'],
    queryFn: () => CatalogService.getInstance().getAllGenres(),
    onError: (error: Error) => {
      toast({ 
        title: "Lỗi tải danh sách thể loại", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Quản lý danh mục</h1>
        </div>
      </header>

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
              </TabsList>

              <TabsContent value="books" className="mt-4">
                {isLoadingBooks ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : booksError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive">Lỗi tải danh sách sách</p>
                    <p className="text-sm text-muted-foreground mt-2">{booksError.message}</p>
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chưa có sách nào</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tiêu đề</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">{book.title || '-'}</TableCell>
                          <TableCell>{book.price ? book.price.toLocaleString('vi-VN') + ' VNĐ' : '-'}</TableCell>
                          <TableCell>{book.bookType || '-'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("book", book.id, book.title)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="authors" className="mt-4">
                {isLoadingAuthors ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : authorsError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive">Lỗi tải danh sách tác giả</p>
                    <p className="text-sm text-muted-foreground mt-2">{authorsError.message}</p>
                  </div>
                ) : authors.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chưa có tác giả nào</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Quốc tịch</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {authors.map((author) => (
                        <TableRow key={author.id}>
                          <TableCell className="font-medium">{author.name || '-'}</TableCell>
                          <TableCell>{author.nationality || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("author", author.id, author.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="genres" className="mt-4">
                {isLoadingGenres ? (
                  <div className="text-center py-8">Đang tải...</div>
                ) : genresError ? (
                  <div className="text-center py-8">
                    <p className="text-destructive">Lỗi tải danh sách thể loại</p>
                    <p className="text-sm text-muted-foreground mt-2">{genresError.message}</p>
                  </div>
                ) : genres.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Chưa có thể loại nào</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {genres.map((genre) => (
                        <TableRow key={genre.id}>
                          <TableCell className="font-medium">{genre.name || '-'}</TableCell>
                          <TableCell>{genre.description || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete("genre", genre.id, genre.name)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

