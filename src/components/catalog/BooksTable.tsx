import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import type { Book, Author } from "../../models";

interface BooksTableProps {
  readonly books: Book[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly onViewDetails: (bookId: number) => void;
  readonly onDelete: (bookId: number, bookTitle: string) => void;
  readonly onStatusUpdate: (bookId: number, currentStatus: 'PUBLISHED' | 'UNPUBLISHED' | undefined) => void;
  readonly isUpdatingStatus: boolean;
}

export function BooksTable({
  books,
  isLoading,
  error,
  onViewDetails,
  onDelete,
  onStatusUpdate,
  isUpdatingStatus,
}: BooksTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Lỗi tải danh sách sách</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có sách nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tiêu đề</TableHead>
          <TableHead>Tác giả</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Ngôn ngữ</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {books.map((book) => (
          <TableRow key={book.id}>
            <TableCell>
              <button
                onClick={() => onViewDetails(book.id)}
                className="font-medium hover:text-primary hover:underline cursor-pointer text-left"
              >
                {book.title || '-'}
              </button>
            </TableCell>
            <TableCell>
              {book.authors && book.authors.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {book.authors.map((author: Author, index: number) => (
                    <span key={author.id || index} className="text-sm">
                      {author.name}
                      {index < book.authors.length - 1 && <span className="text-muted-foreground">,</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">-</span>
              )}
            </TableCell>
            <TableCell>
              <div className="flex gap-2 flex-wrap">
                {book.hasPhysicalEdition && (
                  <Badge variant="blue">Sách giấy</Badge>
                )}
                {book.hasEbookEdition && (
                  <Badge variant="green">Ebook</Badge>
                )}
                {!book.hasPhysicalEdition && !book.hasEbookEdition && (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <span className="text-sm">{book.language || '-'}</span>
            </TableCell>
            <TableCell>
              <Badge 
                variant={book.status === 'PUBLISHED' ? 'default' : 'secondary'}
                className={book.status === 'PUBLISHED' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                {book.status ? book.status : "-"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onStatusUpdate(book.id, book.status)}
                  disabled={isUpdatingStatus}
                  title={book.status === 'PUBLISHED' ? 'Ẩn sách' : 'Xuất bản sách'}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : book.status === 'PUBLISHED' ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(book.id, book.title)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button> */}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
