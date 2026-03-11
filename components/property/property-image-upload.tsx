"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { api } from "@/lib/axios";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ImagePreviewer } from "@/components/ui/image-previewer";

interface PropertyImage {
  imageId: string;
  fileName: string;
  url: string;
}

interface PropertyImageUploadProps {
  propertyId?: string;
  initialImages?: PropertyImage[];
  onChange?: (files: File[]) => void;
  className?: string;
}

export function PropertyImageUpload({
  propertyId,
  initialImages = [],
  onChange,
  className = "",
}: PropertyImageUploadProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [serverImages, setServerImages] =
    useState<PropertyImage[]>(initialImages);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    imageId: string | null;
    fileName: string;
  }>({ open: false, imageId: null, fileName: "" });
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const response = await api.post(
        `/properties/${propertyId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      return response.data;
    },
    onSuccess: (newImage) => {
      setServerImages((prev) => [...prev, newImage]);
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      toast.success(t("property.uploadImage"));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t("common.error");
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await api.delete(`/properties/${propertyId}/images/${imageId}`);
    },
    onSuccess: (_, imageId) => {
      setServerImages((prev) => prev.filter((img) => img.imageId !== imageId));
      queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
      toast.success(t("common.success"));
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || t("common.error");
      toast.error(message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      if (propertyId && !onChange) {
        // Direct upload in edit/details mode ONLY if no onChange is provided
        newFiles.forEach((file) => uploadMutation.mutate(file));
      } else {
        // Collect files in create mode OR deferred update mode
        const updatedFiles = [...selectedFiles, ...newFiles];
        setSelectedFiles(updatedFiles);
        if (onChange) onChange(updatedFiles);
      }
    }
  };

  const removeLocalFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    if (onChange) onChange(updatedFiles);
  };

  const handleDeleteClick = (image: PropertyImage) => {
    setDeleteDialog({
      open: true,
      imageId: image.imageId,
      fileName: image.fileName,
    });
  };

  const confirmDelete = () => {
    if (deleteDialog.imageId) {
      deleteMutation.mutate(deleteDialog.imageId);
      setDeleteDialog({ open: false, imageId: null, fileName: "" });
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("property.images")}</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {t("property.uploadImage")}
        </Button>
      </div>

      <Input
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {/* Server-side images (Edit/Details mode) */}
        {serverImages.map((image) => (
          <div
            key={image.imageId}
            className="relative aspect-square rounded-lg overflow-hidden group border border-border bg-muted"
          >
            <img
              src={image.url}
              alt={image.fileName}
              className="w-full h-full object-cover cursor-pointer hover:brightness-110 transition-all"
              onClick={() =>
                setPreviewImage({ url: image.url, alt: image.fileName })
              }
            />
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="w-7 h-7 rounded-full shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(image);
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {/* Local images (Create mode or pending uploads) */}
        {selectedFiles.map((file, index) => (
          <div
            key={`local-${index}`}
            className="relative aspect-square rounded-lg overflow-hidden group border border-border bg-muted"
          >
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-full object-cover opacity-70 cursor-pointer hover:opacity-90 transition-all"
              onClick={() =>
                setPreviewImage({
                  url: URL.createObjectURL(file),
                  alt: file.name,
                })
              }
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                {t("common.pending") || "Pending"}
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 p-1 bg-black/40 text-white text-[8px] truncate pointer-events-none">
              {file.name}
            </div>
            <button
              type="button"
              className="absolute top-1 right-1 bg-destructive text-white rounded-full p-0.5 hover:bg-destructive/80 transition-colors shadow-lg z-10"
              onClick={(e) => {
                e.stopPropagation();
                removeLocalFile(index);
              }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Empty state when no images */}
        {serverImages.length === 0 && selectedFiles.length === 0 && (
          <div
            className="col-span-full py-8 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">{t("property.noImages")}</p>
          </div>
        )}
      </div>

      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{t("property.uploading")}</span>
        </div>
      )}

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title={t("common.delete") || "Delete"}
        description={t("property.deleteImageConfirm") || "Are you sure?"}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        onConfirm={confirmDelete}
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      <ImagePreviewer
        isOpen={!!previewImage}
        url={previewImage?.url || null}
        alt={previewImage?.alt}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
