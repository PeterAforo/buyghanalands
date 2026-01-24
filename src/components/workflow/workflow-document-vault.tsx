"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  FolderOpen,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  Share2,
  MoreVertical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WorkflowDocument {
  id: string;
  category: string;
  subcategory?: string;
  documentType: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
  version: number;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  expiryDate?: Date;
}

interface DocumentCategory {
  id: string;
  name: string;
  icon?: React.ElementType;
  count: number;
}

interface WorkflowDocumentVaultProps {
  documents: WorkflowDocument[];
  categories: DocumentCategory[];
  onUpload: (files: File[], category: string) => void;
  onDelete?: (documentId: string) => void;
  onDownload?: (documentId: string) => void;
  onShare?: (documentId: string, recipientIds: string[]) => void;
  onDownloadAll?: () => void;
  isUploading?: boolean;
  className?: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  Legal: FileText,
  Survey: FileText,
  Payment: FileText,
  Tax: FileText,
  Registration: FileText,
  Design: FileText,
  Permit: FileText,
  Construction: FileText,
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function WorkflowDocumentVault({
  documents,
  categories,
  onUpload,
  onDelete,
  onDownload,
  onShare,
  onDownloadAll,
  isUploading,
  className,
}: WorkflowDocumentVaultProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [uploadCategory, setUploadCategory] = React.useState("");
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredDocuments = React.useMemo(() => {
    let filtered = documents;

    if (selectedCategory) {
      filtered = filtered.filter((doc) => doc.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.fileName.toLowerCase().includes(query) ||
          doc.documentType.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [documents, selectedCategory, searchQuery]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
      setShowUploadModal(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setShowUploadModal(true);
    }
  };

  const handleUploadConfirm = () => {
    if (selectedFiles.length > 0 && uploadCategory) {
      onUpload(selectedFiles, uploadCategory);
      setSelectedFiles([]);
      setUploadCategory("");
      setShowUploadModal(false);
    }
  };

  const getDocumentStatus = (doc: WorkflowDocument) => {
    if (doc.expiryDate && new Date(doc.expiryDate) < new Date()) {
      return { status: "expired", icon: AlertCircle, color: "text-red-500" };
    }
    if (doc.isVerified) {
      return { status: "verified", icon: CheckCircle, color: "text-green-500" };
    }
    return { status: "pending", icon: Clock, color: "text-amber-500" };
  };

  return (
    <div className={cn("bg-white rounded-xl border border-gray-200", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Document Vault</h3>
            <p className="text-sm text-gray-500">
              {documents.length} documents • {categories.length} categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onDownloadAll && (
              <Button variant="outline" size="sm" onClick={onDownloadAll}>
                <Download className="h-4 w-4 mr-1" />
                Download All
              </Button>
            )}
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex">
        {/* Categories Sidebar */}
        <div className="w-48 border-r border-gray-100 p-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
              !selectedCategory
                ? "bg-green-50 text-green-700"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <span className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              All Documents
            </span>
            <span className="text-xs">{documents.length}</span>
          </button>

          <div className="mt-2 space-y-1">
            {categories.map((category) => {
              const Icon = categoryIcons[category.name] || FileText;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    selectedCategory === category.name
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {category.name}
                  </span>
                  <span className="text-xs">{category.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Documents Grid */}
        <div
          className={cn(
            "flex-1 p-4 min-h-[400px]",
            dragActive && "bg-green-50 border-2 border-dashed border-green-300"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {dragActive ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-lg font-medium text-green-700">Drop files here</p>
                <p className="text-sm text-green-600">to upload to the vault</p>
              </div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No documents found</p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : "Upload documents to get started"}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredDocuments.map((doc) => {
                const { status, icon: StatusIcon, color } = getDocumentStatus(doc);

                return (
                  <div
                    key={doc.id}
                    className="group p-4 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <FileText className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {doc.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {doc.fileName}
                          </p>
                        </div>
                      </div>
                      <StatusIcon className={cn("h-4 w-4 flex-shrink-0", color)} />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>v{doc.version}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => window.open(doc.fileUrl, "_blank")}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {onDownload && (
                        <button
                          onClick={() => onDownload(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                      {onShare && (
                        <button
                          onClick={() => onShare(doc.id, [])}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title="Share"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Selected Files */}
            <div className="space-y-2 mb-4">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 truncate max-w-[200px]">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>

            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadConfirm}
                disabled={!uploadCategory || isUploading}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { WorkflowDocumentVault };
export type { WorkflowDocument, DocumentCategory };
