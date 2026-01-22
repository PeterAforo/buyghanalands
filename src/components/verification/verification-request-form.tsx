"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DocumentUploader } from "@/components/upload/document-uploader";
import {
  Shield,
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";

interface UploadedDocument {
  id?: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

interface VerificationRequestFormProps {
  listingId: string;
  listingTitle: string;
  currentLevel: string;
  onSuccess?: () => void;
}

export function VerificationRequestForm({
  listingId,
  listingTitle,
  currentLevel,
  onSuccess,
}: VerificationRequestFormProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (documents.length === 0) {
      setError("Please upload at least one document");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/verification/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          documentIds: documents.filter(d => d.id).map(d => d.id),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVerificationLevelInfo = (level: string) => {
    switch (level) {
      case "LEVEL_0_UNVERIFIED":
        return { label: "Unverified", color: "text-gray-500", bg: "bg-gray-100" };
      case "LEVEL_1_DOCS_UPLOADED":
        return { label: "Documents Uploaded", color: "text-blue-600", bg: "bg-blue-100" };
      case "LEVEL_2_STAFF_VERIFIED":
        return { label: "Staff Verified", color: "text-emerald-600", bg: "bg-emerald-100" };
      case "LEVEL_3_OFFICIAL_VERIFIED":
        return { label: "Officially Verified", color: "text-green-600", bg: "bg-green-100" };
      default:
        return { label: "Unknown", color: "text-gray-500", bg: "bg-gray-100" };
    }
  };

  const levelInfo = getVerificationLevelInfo(currentLevel);

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Verification Request Submitted!
          </h3>
          <p className="text-gray-600 mb-4">
            Our team will review your documents within 2-3 business days.
            You'll receive an email and SMS notification once the review is complete.
          </p>
          <Button onClick={() => setSuccess(false)} variant="outline">
            Submit Another Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle>Request Verification</CardTitle>
            <CardDescription>
              Get your listing verified to build buyer trust
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Current Verification Status</p>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-sm font-medium ${levelInfo.bg} ${levelInfo.color}`}>
              {levelInfo.label}
            </span>
            <span className="text-gray-600">for "{listingTitle}"</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Benefits of Verification</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              Verified badge displayed on your listing
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              Higher visibility in search results
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              Increased buyer confidence and trust
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              Faster transaction completion
            </li>
          </ul>
        </div>

        {/* Required Documents */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Required Documents</h4>
          <p className="text-sm text-gray-600">
            Upload any of the following documents for verification:
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Site Plan
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Indenture / Deed of Assignment
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Land Title Certificate
            </li>
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              Search Report from Lands Commission
            </li>
          </ul>
        </div>

        {/* Document Upload */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Upload Documents</h4>
          <DocumentUploader
            documents={documents}
            onDocumentsChange={setDocuments}
            listingId={listingId}
            maxDocuments={5}
          />
        </div>

        {/* Additional Notes */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Additional Notes (Optional)</h4>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional information about your documents..."
            rows={3}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || documents.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Submit Verification Request
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Verification typically takes 2-3 business days. You'll be notified via email and SMS.
        </p>
      </CardContent>
    </Card>
  );
}
