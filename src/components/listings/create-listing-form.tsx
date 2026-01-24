"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MapPin,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Upload,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ghanaRegions } from "@/lib/ghana-locations";

type Step = "details" | "location" | "media" | "pricing" | "review";

interface CreateListingFormProps {
  onSubmit: (data: ListingFormData) => Promise<{ id: string }>;
  className?: string;
}

interface ListingFormData {
  title: string;
  description: string;
  landType: string;
  tenureType: string;
  sizeAcres: number;
  region: string;
  district: string;
  town?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  priceGhs: number;
  negotiable: boolean;
  images: File[];
  documents: File[];
}

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "location", label: "Location", icon: MapPin },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "review", label: "Review", icon: Check },
];

const LAND_TYPES = [
  { value: "RESIDENTIAL", label: "Residential" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "INDUSTRIAL", label: "Industrial" },
  { value: "AGRICULTURAL", label: "Agricultural" },
  { value: "MIXED", label: "Mixed Use" },
];

const TENURE_TYPES = [
  { value: "FREEHOLD", label: "Freehold" },
  { value: "LEASEHOLD", label: "Leasehold" },
  { value: "CUSTOMARY", label: "Customary" },
];

function CreateListingForm({ onSubmit, className }: CreateListingFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<Step>("details");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = React.useState<ListingFormData>({
    title: "",
    description: "",
    landType: "",
    tenureType: "",
    sizeAcres: 0,
    region: "",
    district: "",
    town: "",
    address: "",
    priceGhs: 0,
    negotiable: false,
    images: [],
    documents: [],
  });

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const updateFormData = <K extends keyof ListingFormData>(
    key: K,
    value: ListingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case "details":
        if (!formData.title.trim()) newErrors.title = "Title is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.landType) newErrors.landType = "Land type is required";
        if (!formData.tenureType) newErrors.tenureType = "Tenure type is required";
        if (!formData.sizeAcres || formData.sizeAcres <= 0) newErrors.sizeAcres = "Valid size is required";
        break;
      case "location":
        if (!formData.region) newErrors.region = "Region is required";
        if (!formData.district) newErrors.district = "District is required";
        break;
      case "media":
        if (formData.images.length === 0) newErrors.images = "At least one image is required";
        break;
      case "pricing":
        if (!formData.priceGhs || formData.priceGhs <= 0) newErrors.priceGhs = "Valid price is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToNextStep = () => {
    if (!validateStep(currentStep)) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep("review")) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmit(formData);
      router.push(`/listings/${result.id}?created=true`);
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to create listing" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024
    );
    updateFormData("images", [...formData.images, ...validFiles]);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        (file.type === "application/pdf" ||
          file.type.includes("document") ||
          file.type.includes("image/")) &&
        file.size <= 20 * 1024 * 1024
    );
    updateFormData("documents", [...formData.documents, ...validFiles]);
  };

  const removeImage = (index: number) => {
    updateFormData(
      "images",
      formData.images.filter((_, i) => i !== index)
    );
  };

  const removeDocument = (index: number) => {
    updateFormData(
      "documents",
      formData.documents.filter((_, i) => i !== index)
    );
  };

  const selectedRegion = ghanaRegions.find((r: { name: string }) => r.name === formData.region);

  return (
    <div className={cn("max-w-3xl mx-auto", className)}>
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted && "bg-green-600 text-white",
                      isActive && "bg-green-100 text-green-600 ring-2 ring-green-600",
                      !isCompleted && !isActive && "bg-gray-100 text-gray-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-2 font-medium",
                      isActive ? "text-green-600" : "text-gray-500"
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      index < currentStepIndex ? "bg-green-600" : "bg-gray-200"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Details Step */}
        {currentStep === "details" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Land Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="e.g., Prime Residential Plot in East Legon"
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe the land, its features, surroundings, and any other relevant details..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Land Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.landType}
                  onChange={(e) => updateFormData("landType", e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500",
                    errors.landType ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">Select type</option>
                  {LAND_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.landType && (
                  <p className="text-sm text-red-500 mt-1">{errors.landType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tenure Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tenureType}
                  onChange={(e) => updateFormData("tenureType", e.target.value)}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500",
                    errors.tenureType ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">Select tenure</option>
                  {TENURE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.tenureType && (
                  <p className="text-sm text-red-500 mt-1">{errors.tenureType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Size (Acres) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sizeAcres || ""}
                  onChange={(e) => updateFormData("sizeAcres", Number(e.target.value))}
                  placeholder="e.g., 0.5"
                  className={errors.sizeAcres ? "border-red-500" : ""}
                />
                {errors.sizeAcres && (
                  <p className="text-sm text-red-500 mt-1">{errors.sizeAcres}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Location Step */}
        {currentStep === "location" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Location</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Region <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.region}
                  onChange={(e) => {
                    updateFormData("region", e.target.value);
                    updateFormData("district", "");
                  }}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500",
                    errors.region ? "border-red-500" : "border-gray-300"
                  )}
                >
                  <option value="">Select region</option>
                  {ghanaRegions.map((region: { name: string }) => (
                    <option key={region.name} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <p className="text-sm text-red-500 mt-1">{errors.region}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => updateFormData("district", e.target.value)}
                  disabled={!formData.region}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500",
                    errors.district ? "border-red-500" : "border-gray-300",
                    !formData.region && "bg-gray-100"
                  )}
                >
                  <option value="">Select district</option>
                  {selectedRegion &&
                    (selectedRegion as { name: string; districts?: string[] }).districts?.map((district: string) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                </select>
                {errors.district && (
                  <p className="text-sm text-red-500 mt-1">{errors.district}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Town/Area
              </label>
              <Input
                value={formData.town || ""}
                onChange={(e) => updateFormData("town", e.target.value)}
                placeholder="e.g., East Legon"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Address / Directions
              </label>
              <Textarea
                value={formData.address || ""}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Provide detailed address or directions to the property..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Media Step */}
        {currentStep === "media" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Photos & Documents</h2>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Photos <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Upload clear photos of the land. First image will be the cover photo.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.images.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 bg-green-600 text-white text-xs rounded">
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-green-500 cursor-pointer flex flex-col items-center justify-center transition-colors">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <span className="text-sm text-gray-500 mt-2">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {errors.images && (
                <p className="text-sm text-red-500 mt-2">{errors.images}</p>
              )}
            </div>

            {/* Documents */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Documents (Optional)
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Upload land documents (site plan, indenture, etc.) for verification.
              </p>

              <div className="space-y-2">
                {formData.documents.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-700 truncate max-w-xs">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 hover:border-green-500 rounded-lg cursor-pointer transition-colors">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Upload Document</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    multiple
                    onChange={handleDocumentUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Step */}
        {currentStep === "pricing" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Price (GHS) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                value={formData.priceGhs || ""}
                onChange={(e) => updateFormData("priceGhs", Number(e.target.value))}
                placeholder="e.g., 500000"
                className={errors.priceGhs ? "border-red-500" : ""}
              />
              {errors.priceGhs && (
                <p className="text-sm text-red-500 mt-1">{errors.priceGhs}</p>
              )}
              {formData.priceGhs > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  GHS {formData.priceGhs.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.negotiable}
                  onChange={(e) => updateFormData("negotiable", e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Price is negotiable</span>
              </label>
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === "review" && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Review Your Listing</h2>

            <div className="space-y-4">
              <ReviewSection title="Details">
                <ReviewItem label="Title" value={formData.title} />
                <ReviewItem label="Description" value={formData.description} />
                <ReviewItem
                  label="Land Type"
                  value={LAND_TYPES.find((t) => t.value === formData.landType)?.label}
                />
                <ReviewItem
                  label="Tenure Type"
                  value={TENURE_TYPES.find((t) => t.value === formData.tenureType)?.label}
                />
                <ReviewItem label="Size" value={`${formData.sizeAcres} acres`} />
              </ReviewSection>

              <ReviewSection title="Location">
                <ReviewItem label="Region" value={formData.region} />
                <ReviewItem label="District" value={formData.district} />
                {formData.town && <ReviewItem label="Town" value={formData.town} />}
              </ReviewSection>

              <ReviewSection title="Media">
                <ReviewItem label="Photos" value={`${formData.images.length} uploaded`} />
                <ReviewItem label="Documents" value={`${formData.documents.length} uploaded`} />
              </ReviewSection>

              <ReviewSection title="Pricing">
                <ReviewItem
                  label="Price"
                  value={`GHS ${formData.priceGhs.toLocaleString()}`}
                />
                <ReviewItem
                  label="Negotiable"
                  value={formData.negotiable ? "Yes" : "No"}
                />
              </ReviewSection>
            </div>

            {errors.submit && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                {errors.submit}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {currentStep === "review" ? (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Listing"
              )}
            </Button>
          ) : (
            <Button onClick={goToNextStep}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value || "-"}</span>
    </div>
  );
}

export { CreateListingForm };
export type { ListingFormData };
