import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2 } from "lucide-react";
import type { Genre } from "../../models";

interface GenresTableProps {
  readonly genres: Genre[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly onDelete: (genreId: number, genreName: string) => void;
}

export function GenresTable({
  genres,
  isLoading,
  error,
  onDelete,
}: GenresTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Lỗi tải danh sách thể loại</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (genres.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có thể loại nào</p>
      </div>
    );
  }

  return (
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
                onClick={() => onDelete(genre.id, genre.name)}
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
