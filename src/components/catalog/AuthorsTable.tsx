import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2 } from "lucide-react";
import type { Author } from "../../models";

interface AuthorsTableProps {
  readonly authors: Author[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly onDelete: (authorId: number, authorName: string) => void;
}

export function AuthorsTable({
  authors,
  isLoading,
  error,
  onDelete,
}: AuthorsTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Lỗi tải danh sách tác giả</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (authors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có tác giả nào</p>
      </div>
    );
  }

  return (
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
                onClick={() => onDelete(author.id, author.name)}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
