import { Button } from "../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2 } from "lucide-react";
import type { Translator } from "../../models";

interface TranslatorsTableProps {
  readonly translators: Translator[];
  readonly isLoading: boolean;
  readonly error: Error | null;
  readonly onDelete: (translatorId: number, translatorName: string) => void;
}

const formatDate = (dateStr: string): string => {
  return dateStr.split('T')[0];
};

export function TranslatorsTable({
  translators,
  isLoading,
  error,
  onDelete,
}: TranslatorsTableProps) {
  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Lỗi tải danh sách dịch giả</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  if (translators.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Chưa có dịch giả nào</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên</TableHead>
          <TableHead>Tiểu sử</TableHead>
          <TableHead>Ngày sinh</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {translators.map((translator) => (
          <TableRow key={translator.id}>
            <TableCell className="font-medium">{translator.name || '-'}</TableCell>
            <TableCell className="max-w-md truncate">
              {translator.biography || translator.bio || "-"}
            </TableCell>
            <TableCell>{formatDate(translator.birthDate) || "-"}</TableCell>
            <TableCell className="text-right">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(translator.id, translator.name)}
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
