import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Plus, X } from "lucide-react";
import type { CreateBookRequest, Author, Genre, Publisher, Translator } from "../../models";

interface BookFormDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly formData: Partial<CreateBookRequest>;
  readonly onFormDataChange: (data: Partial<CreateBookRequest>) => void;
  readonly imagePreviews: string[];
  readonly onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onImageRemove: (index: number) => void;
  readonly authors: Author[];
  readonly isLoadingAuthors: boolean;
  readonly translators: Translator[];
  readonly isLoadingTranslators: boolean;
  readonly publishers: Publisher[];
  readonly genres: Genre[];
  readonly isLoadingGenres: boolean;
  readonly onToggleAuthor: (authorId: number) => void;
  readonly onToggleTranslator: (translatorId: number) => void;
  readonly onToggleGenre: (genreId: number) => void;
  readonly onSubmit: (e: React.FormEvent) => void;
  readonly isSubmitting: boolean;
}

export function BookFormDialog({
  open,
  onOpenChange,
  formData,
  onFormDataChange,
  imagePreviews,
  onImageSelect,
  onImageRemove,
  authors,
  isLoadingAuthors,
  translators,
  isLoadingTranslators,
  publishers,
  genres,
  isLoadingGenres,
  onToggleAuthor,
  onToggleTranslator,
  onToggleGenre,
  onSubmit,
  isSubmitting,
}: BookFormDialogProps) {
  // Normalize arrays to ensure they're always arrays and filter out invalid items
  const safeAuthors = Array.isArray(authors) ? authors.filter(a => a && a.id != null) : [];
  const safeTranslators = Array.isArray(translators) ? translators.filter(t => t && t.id != null) : [];
  const safePublishers = Array.isArray(publishers) ? publishers.filter(p => p && p.id != null) : [];
  const safeGenres = Array.isArray(genres) ? genres.filter(g => g && g.id != null) : [];

  return (
    <>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Thêm sách mới
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sách mới</DialogTitle>
          <DialogDescription>
            Điền thông tin sách và chọn loại sách (sách giấy, ebook hoặc cả hai)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* General Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Thông tin chung</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.description || ""}
                onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Ngôn ngữ <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.language || "VIETNAMESE"}
                  onValueChange={(value) => onFormDataChange({ ...formData, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIETNAMESE">Tiếng Việt</SelectItem>
                    <SelectItem value="ENGLISH">Tiếng Anh</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publicationDate">Ngày xuất bản</Label>
                <Input
                  id="publicationDate"
                  type="date"
                  value={formData.publicationDate || ""}
                  onChange={(e) => onFormDataChange({ ...formData, publicationDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pageCount">Số trang</Label>
                <Input
                  id="pageCount"
                  type="number"
                  min="1"
                  value={formData.pageCount || ""}
                  onChange={(e) => onFormDataChange({ ...formData, pageCount: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edition">Lần tái bản</Label>
                <Input
                  id="edition"
                  type="number"
                  min="1"
                  value={formData.edition || ""}
                  onChange={(e) => onFormDataChange({ ...formData, edition: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>

          {/* Authors */}
          <div className="space-y-2">
            <Label>Tác giả <span className="text-destructive">*</span></Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {isLoadingAuthors && (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              )}
              {!isLoadingAuthors && safeAuthors.length === 0 && (
                <div className="text-sm text-muted-foreground">Chưa có tác giả nào</div>
              )}
              {!isLoadingAuthors && safeAuthors.length > 0 && (
                <div className="space-y-2">
                  {safeAuthors.map((author) => (
                    <div key={author.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`author-${author.id}`}
                        checked={formData.authorIds?.includes(author.id) || false}
                        onCheckedChange={() => onToggleAuthor(author.id)}
                      />
                      <Label
                        htmlFor={`author-${author.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {author.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Translators */}
          <div className="space-y-2">
            <Label>Dịch giả</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {isLoadingTranslators && (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              )}
              {!isLoadingTranslators && safeTranslators.length === 0 && (
                <div className="text-sm text-muted-foreground">Chưa có dịch giả nào</div>
              )}
              {!isLoadingTranslators && safeTranslators.length > 0 && (
                <div className="space-y-2">
                  {safeTranslators.map((translator) => (
                      <div key={translator.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`translator-${translator.id}`}
                          checked={formData.translatorIds?.includes(translator.id) || false}
                          onCheckedChange={() => onToggleTranslator(translator.id)}
                        />
                        <Label
                          htmlFor={`translator-${translator.id}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {translator.name}
                        </Label>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Publisher */}
          <div className="space-y-2">
            <Label htmlFor="publisher">Nhà xuất bản</Label>
            <Select
              value={formData.publisherId?.toString() || undefined}
              onValueChange={(value) => {
                if (value === "none") {
                  onFormDataChange({ ...formData, publisherId: undefined });
                } else {
                  onFormDataChange({ ...formData, publisherId: Number(value) });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhà xuất bản" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Không chọn</SelectItem>
                {safePublishers.map((publisher) => (
                    <SelectItem key={publisher.id} value={publisher.id.toString()}>
                      {publisher.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <Label>Thể loại</Label>
            <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
              {isLoadingGenres && (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              )}
              {!isLoadingGenres && safeGenres.length === 0 && (
                <div className="text-sm text-muted-foreground">Chưa có thể loại nào</div>
              )}
              {!isLoadingGenres && safeGenres.length > 0 && (
                <div className="space-y-2">
                  {safeGenres.map((genre) => (
                    <div key={genre.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre.id}`}
                        checked={formData.genreIds?.includes(genre.id) || false}
                        onCheckedChange={() => onToggleGenre(genre.id)}
                      />
                      <Label
                        htmlFor={`genre-${genre.id}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {genre.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Ảnh sách</Label>
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={onImageSelect}
                className="cursor-pointer"
              />
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onImageRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Book Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Loại sách</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="physical"
                  checked={formData.hasPhysicalEdition || false}
                  onCheckedChange={(checked) => onFormDataChange({ ...formData, hasPhysicalEdition: checked as boolean })}
                />
                <Label htmlFor="physical" className="text-sm font-normal cursor-pointer">
                  Sách giấy
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ebook"
                  checked={formData.hasElectricEdition || false}
                  onCheckedChange={(checked) => onFormDataChange({ ...formData, hasElectricEdition: checked as boolean })}
                />
                <Label htmlFor="ebook" className="text-sm font-normal cursor-pointer">
                  Ebook
                </Label>
              </div>
            </div>

            {/* Physical Book Fields */}
            {formData.hasPhysicalEdition && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/50">
                <h4 className="font-semibold">Thông tin sách giấy</h4>
                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN</Label>
                  <Input
                    id="isbn"
                    value={formData.isbn || ""}
                    onChange={(e) => onFormDataChange({ ...formData, isbn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coverType">Loại bìa</Label>
                  <Select
                    value={formData.coverType || undefined}
                    onValueChange={(value) => onFormDataChange({ ...formData, coverType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại bìa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HARDCOVER">Bìa cứng</SelectItem>
                      <SelectItem value="PAPERBACK">Bìa mềm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weightGrams">Trọng lượng (gram)</Label>
                    <Input
                      id="weightGrams"
                      type="number"
                      min="0"
                      value={formData.weightGrams || ""}
                      onChange={(e) => onFormDataChange({ ...formData, weightGrams: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="physicalBookPrice">Giá sách giấy (VNĐ)</Label>
                    <Input
                      id="physicalBookPrice"
                      type="number"
                      min="0"
                      value={formData.physicalBookPrice || ""}
                      onChange={(e) => onFormDataChange({ ...formData, physicalBookPrice: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="heightCm">Chiều cao (cm)</Label>
                    <Input
                      id="heightCm"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.heightCm || ""}
                      onChange={(e) => onFormDataChange({ ...formData, heightCm: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="widthCm">Chiều rộng (cm)</Label>
                    <Input
                      id="widthCm"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.widthCm || ""}
                      onChange={(e) => onFormDataChange({ ...formData, widthCm: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lengthCm">Chiều dài (cm)</Label>
                    <Input
                      id="lengthCm"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.lengthCm || ""}
                      onChange={(e) => onFormDataChange({ ...formData, lengthCm: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ebook Fields */}
            {formData.hasElectricEdition && (
              <div className="space-y-4 border rounded-md p-4 bg-muted/50">
                <h4 className="font-semibold">Thông tin ebook</h4>
                <div className="space-y-2">
                  <Label htmlFor="eisbn">E-ISBN</Label>
                  <Input
                    id="eisbn"
                    value={formData.eisbn || ""}
                    onChange={(e) => onFormDataChange({ ...formData, eisbn: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ebookPrice">Giá ebook (VNĐ)</Label>
                  <Input
                    id="ebookPrice"
                    type="number"
                    min="0"
                    value={formData.ebookPrice || ""}
                    onChange={(e) => onFormDataChange({ ...formData, ebookPrice: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Lưu ý: Upload file ebook sẽ được thực hiện sau
                </p>
              </div>
            )}
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
              {isSubmitting ? "Đang thêm..." : "Thêm sách"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
