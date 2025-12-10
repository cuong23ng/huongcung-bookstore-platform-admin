import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus } from "lucide-react";
import type { CreateGenreRequest } from "../../models";

interface GenreFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly formData: Partial<CreateGenreRequest>;
  readonly onFormDataChange: (data: Partial<CreateGenreRequest>) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly isSubmitting: boolean;
}

export function GenreFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: GenreFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm thể loại mới
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm thể loại mới</DialogTitle>
          <DialogDescription>
            Điền thông tin thể loại
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="genreName">Tên thể loại <span className="text-destructive">*</span></Label>
            <Input
              id="genreName"
              value={formData.name || ""}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="genreDescription">Mô tả</Label>
            <textarea
              id="genreDescription"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.description || ""}
              onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm thể loại"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
