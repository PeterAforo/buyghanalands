"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Upload,
  X,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  File,
} from "lucide-react";

interface UploadedDocument {
  id?: string;
  url: string;
  name: string;
  type: string;
  size: number;
  isNew?: boolean;
}

interface DocumentUploaderProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  listingId?: string;
  maxDocuments?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

const DEFAULT_ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function DocumentUploader({
  documents,
  onDocumentsChange,
  listingId,
  maxDocuments = 5,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  disabled = false,
}: DocumentUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return "📄";
    if (type.startsWith("image/")) return "🖼️";
    return "📎";
  };

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (disabled) return;

      setError(null);
      const remainingSlots = maxDocuments - documents.length;

      if (remainingSlots <= 0) {
        setError(`Maximum ${maxDocuments} documents allowed`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const validFiles: File[] = [];

      for (const file of filesToUpload) {
        if (!acceptedTypes.includes(file.type)) {
          setError("Only PDF and image files are allowed");
          continue;
        }
        if (file.size > 20 * 1024 * 1024) {
          setError("Documents must be less than 20MB");
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) return;

      setIsUploading(true);

      try {
        // Convert files to base64
        const base64Files = await Promise.all(
          validFiles.map(
            (file) =>
              new Promise<{ data: string; name: string; type: string; size: number }>(
                (resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = () =>
                    resolve({
                      data: reader.result as string,
                      name: file.name,
                      type: file.type,
                      size: file.size,
                    });
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                }
              )
          )
        );

        // Upload to server
        const response = await fetch("/api/upload/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documents: base64Files,
            listingId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        // Add new documents to state
        const newDocs = data.documents.map((doc: UploadedDocument) => ({
          ...doc,
          isNew: true,
        }));

        onDocumentsChange([...documents, ...newDocs]);

        if (data.errors && data.errors.length > 0) {
          setError(data.errors.join(", "));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [documents, onDocumentsChange, listingId, maxDocuments, acceptedTypes, disabled]
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

  const removeDocument = async (index: number) => {
    const doc = documents[index];

    if (doc.id) {
      try {
        await fetch(`/api/upload/documents?id=${doc.id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    }

    const newDocs = documents.filter((_, i) => i !== index);
    onDocumentsChange(newDocs);
  };

  const acceptString = acceptedTypes.join(",");

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
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors
          ${dragActive ? "border-emerald-500 bg-emerald-50" : "border-gray-300 hover:border-emerald-400"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptString}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mb-2" />
            <p className="text-gray-600">Uploading documents...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <FileText className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">
              Upload documents (PDF, images)
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Max 20MB each • Max {maxDocuments} documents
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

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div
              key={doc.id || doc.url}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{getFileIcon(doc.type)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(doc.size)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.isNew && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    New
                  </span>
                )}
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 text-sm"
                >
                  View
                </a>
                <button
                  onClick={() => removeDocument(index)}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                  title="Remove document"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document count */}
      <p className="text-sm text-gray-500">
        {documents.length} of {maxDocuments} documents uploaded
      </p>
    </div>
  );
}
