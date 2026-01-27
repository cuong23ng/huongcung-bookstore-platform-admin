import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Plus, X } from "lucide-react";
import type { CreateTranslatorRequest } from "../../models";

interface TranslatorFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly formData: Partial<CreateTranslatorRequest>;
  readonly onFormDataChange: (data: Partial<CreateTranslatorRequest>) => void;
  readonly avatar: File | null;
  readonly avatarPreview: string | null;
  readonly onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onAvatarRemove: () => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly isSubmitting: boolean;
}

export function TranslatorFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  avatar,
  avatarPreview,
  onAvatarSelect,
  onAvatarRemove,
  onSubmit,
  isSubmitting,
}: TranslatorFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm dịch giả mới
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm dịch giả mới</DialogTitle>
          <DialogDescription>
            Điền thông tin dịch giả
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="translatorName">Tên dịch giả <span className="text-destructive">*</span></Label>
            <Input
              id="translatorName"
              value={formData.name || ""}
              onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="translatorBio">Tiểu sử</Label>
            <textarea
              id="translatorBio"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.biography || ""}
              onChange={(e) => onFormDataChange({ ...formData, biography: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="translatorBirthDate">Ngày sinh</Label>
            <Input
              id="translatorBirthDate"
              type="date"
              value={formData.birthDate || ""}
              onChange={(e) => onFormDataChange({ ...formData, birthDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Ảnh đại diện</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                onChange={onAvatarSelect}
                className="cursor-pointer"
              />
              {avatarPreview && (
                <div className="relative inline-block">
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1"
                    onClick={onAvatarRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
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
              {isSubmitting ? "Đang thêm..." : "Thêm dịch giả"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
