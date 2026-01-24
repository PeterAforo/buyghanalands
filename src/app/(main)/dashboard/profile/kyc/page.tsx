"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Upload,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  CreditCard,
  Camera,
  X,
} from "lucide-react";

interface KycDocument {
  id: string;
  type: string;
  status: string;
  url: string;
  createdAt: string;
}

export default function KycPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [kycTier, setKycTier] = useState<string>("TIER_0_PHONE_ONLY");
  const [documents, setDocuments] = useState<KycDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchKycStatus() {
      try {
        const response = await fetch("/api/profile/kyc");
        if (response.ok) {
          const data = await response.json();
          setKycTier(data.kycTier);
          setDocuments(data.documents || []);
        }
      } catch (error) {
        console.error("Failed to fetch KYC status:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user) {
      fetchKycStatus();
    }
  }, [session]);

  const handleFileUpload = async (docType: string, file: File) => {
    setUploading(docType);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);

      const response = await fetch("/api/profile/kyc", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments((prev) => [...prev.filter((d) => d.type !== docType), data.document]);
        setKycTier(data.kycTier);
        setMessage({ type: "success", text: "Document uploaded successfully. Under review." });
      } else {
        const error = await response.json();
        setMessage({ type: "error", text: error.error || "Failed to upload document" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to upload document" });
    } finally {
      setUploading(null);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find((d) => d.type === docType);
    if (!doc) return null;
    return doc.status;
  };

  const documentTypes = [
    {
      type: "GHANA_CARD",
      title: "Ghana Card",
      description: "Upload a clear photo of your Ghana Card (front)",
      icon: CreditCard,
      required: true,
    },
    {
      type: "GHANA_CARD_BACK",
      title: "Ghana Card (Back)",
      description: "Upload a clear photo of your Ghana Card (back)",
      icon: CreditCard,
      required: true,
    },
    {
      type: "SELFIE",
      title: "Selfie with ID",
      description: "Take a selfie holding your Ghana Card next to your face",
      icon: Camera,
      required: true,
    },
    {
      type: "PROOF_OF_ADDRESS",
      title: "Proof of Address",
      description: "Utility bill or bank statement (less than 3 months old)",
      icon: FileText,
      required: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard/profile">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Identity Verification</h1>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Current Status */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                kycTier === "TIER_2_GHANA_CARD" ? "bg-emerald-100" : "bg-yellow-100"
              }`}>
                <Shield className={`h-8 w-8 ${
                  kycTier === "TIER_2_GHANA_CARD" ? "text-emerald-600" : "text-yellow-600"
                }`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Verification Status</h2>
                <Badge variant={kycTier === "TIER_2_GHANA_CARD" ? "success" : kycTier === "TIER_1_ID_UPLOAD" ? "warning" : "secondary"}>
                  {kycTier === "TIER_2_GHANA_CARD" ? "Fully Verified" : 
                   kycTier === "TIER_1_ID_UPLOAD" ? "Documents Under Review" : "Not Verified"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Required Documents</CardTitle>
            <CardDescription>
              Upload the following documents to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {documentTypes.map((docType) => {
              const status = getDocumentStatus(docType.type);
              const Icon = docType.icon;
              const isUploading = uploading === docType.type;

              return (
                <div
                  key={docType.type}
                  className={`border rounded-lg p-4 ${
                    status === "APPROVED" ? "border-emerald-200 bg-emerald-50" :
                    status === "PENDING" ? "border-yellow-200 bg-yellow-50" :
                    status === "REJECTED" ? "border-red-200 bg-red-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      status === "APPROVED" ? "bg-emerald-100" :
                      status === "PENDING" ? "bg-yellow-100" :
                      status === "REJECTED" ? "bg-red-100" : "bg-gray-100"
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        status === "APPROVED" ? "text-emerald-600" :
                        status === "PENDING" ? "text-yellow-600" :
                        status === "REJECTED" ? "text-red-600" : "text-gray-500"
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{docType.title}</h3>
                        {docType.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{docType.description}</p>
                      
                      {status && (
                        <div className="mt-2">
                          <Badge variant={
                            status === "APPROVED" ? "success" :
                            status === "PENDING" ? "warning" : "destructive"
                          }>
                            {status === "APPROVED" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {status === "PENDING" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {status === "REJECTED" && <X className="h-3 w-3 mr-1" />}
                            {status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(docType.type, file);
                          }}
                          disabled={isUploading || status === "APPROVED"}
                        />
                        <span
                          className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 ${
                            status === "APPROVED" 
                              ? "border border-input bg-background hover:bg-accent text-muted-foreground cursor-not-allowed"
                              : isUploading
                              ? "bg-emerald-600 text-white cursor-wait"
                              : "bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                          }`}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : status === "APPROVED" ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Verified
                            </>
                          ) : status ? (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Re-upload
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Ensure all text on documents is clearly visible</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Photos should be well-lit without glare or shadows</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>All four corners of the document must be visible</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>For selfie: Hold your ID next to your face, both clearly visible</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Maximum file size: 10MB per document</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
