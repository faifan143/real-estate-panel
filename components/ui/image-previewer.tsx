"use client";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ImagePreviewerProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
  alt?: string;
}

export function ImagePreviewer({
  url,
  isOpen,
  onClose,
  alt = "Preview",
}: ImagePreviewerProps) {
  if (!url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-7xl w-[95vw] h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden"
        showCloseButton={false}
      >
        <div className="sr-only">
          <DialogTitle>{alt}</DialogTitle>
          <DialogDescription>
            Full size image preview of {alt}
          </DialogDescription>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={url}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg animate-in fade-in zoom-in duration-300"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
