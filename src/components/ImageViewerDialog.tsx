import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";

interface ImageViewerDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly imageSrc: string | null;
  readonly imageLabel?: string;
}

export function ImageViewerDialog({
  open,
  onOpenChange,
  imageSrc,
  imageLabel,
}: ImageViewerDialogProps) {
  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] p-0 bg-transparent border-none shadow-none [&>button]:hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 text-white hover:bg-black/70"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <img
            src={imageSrc}
            alt={imageLabel || "Image"}
            className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
          />
          {imageLabel && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-sm px-4 py-2 text-center rounded-b-lg">
              {imageLabel}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
