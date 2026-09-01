"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  folder?: string;
  aspectRatio?: string;
}

export function ImageUpload({
  value,
  onChange,
  label = "Image",
  folder = "cms",
  aspectRatio = "aspect-video",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch("/api/admin/cms/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: base64, folder }),
          });

          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Upload failed");
            setUploading(false);
            return;
          }

          const data = await res.json();
          onChange(data.url);
          setUploading(false);
        } catch {
          setError("Upload failed");
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Upload failed");
      setUploading(false);
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {value ? (
        <div className="relative group">
          <div className={`relative ${aspectRatio} rounded-lg overflow-hidden border border-gray-200 bg-gray-50`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white/90 rounded-lg text-xs font-medium text-gray-700 hover:bg-white"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-1.5 bg-white/90 rounded-lg text-red-600 hover:bg-white"
              title="Remove image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`w-full ${aspectRatio} rounded-lg border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-emerald-600 disabled:opacity-50`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Uploading...</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <span className="text-sm font-medium">Upload {label}</span>
              </div>
              <span className="text-xs text-gray-400">Click to select (max 5MB)</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {value && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Image URL"
            className="flex-1 px-2 py-1 text-xs border rounded bg-gray-50 text-gray-600"
          />
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <ImageIcon className="h-3 w-3" /> or paste URL
          </span>
        </div>
      )}
    </div>
  );
}
