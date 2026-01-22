"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  GripVertical,
} from "lucide-react";

interface UploadedImage {
  id?: string;
  url: string;
  publicId?: string;
  isNew?: boolean;
}

interface ImageUploaderProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  listingId?: string;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUploader({
  images,
  onImagesChange,
  listingId,
  maxImages = 10,
  disabled = false,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (disabled) return;

      setError(null);
      const remainingSlots = maxImages - images.length;

      if (remainingSlots <= 0) {
        setError(`Maximum ${maxImages} images allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const validFiles: File[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith("image/")) {
          setError("Only image files are allowed");
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError("Images must be less than 10MB");
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);

      try {
        // Convert files to base64
        const base64Images = await Promise.all(
          validFiles.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              })
          )
        );

        // Upload to server
        const response = await fetch("/api/upload/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: base64Images,
            listingId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        // Add new images to state
        const newImages = data.images.map((img: UploadedImage) => ({
          ...img,
          isNew: true,
        }));

        onImagesChange([...images, ...newImages]);

        if (data.errors && data.errors.length > 0) {
          setError(data.errors.join(", "));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [images, onImagesChange, listingId, maxImages, disabled]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeImage = async (index: number) => {
    const image = images[index];

    // If image has an ID, delete from server
    if (image.id) {
      try {
        await fetch(`/api/upload/images?id=${image.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }

    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${dragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-emerald-400"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 text-emerald-600 animate-spin mb-2" />
            <p className="text-gray-600">Uploading images...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">
              Drag and drop images here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-1">
              PNG, JPG, WEBP up to 10MB each • Max {maxImages} images
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id || image.url}
              className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border"
            >
              <img
                src={image.url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Move buttons */}
                <div className="flex flex-col gap-1">
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      className="p-1 bg-white rounded text-gray-700 hover:bg-gray-100"
                      title="Move left"
                    >
                      <GripVertical className="h-4 w-4 rotate-90" />
                    </button>
                  )}
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeImage(index)}
                  className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Primary badge */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}

              {/* New badge */}
              {image.isNew && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  New
                </div>
              )}
            </div>
          ))}

          {/* Add more placeholder */}
          {images.length < maxImages && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-400 flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 transition-colors"
            >
              <ImageIcon className="h-8 w-8 mb-1" />
              <span className="text-xs">Add more</span>
            </button>
          )}
        </div>
      )}

      {/* Image count */}
      <p className="text-sm text-gray-500">
        {images.length} of {maxImages} images uploaded
      </p>
    </div>
  );
}
