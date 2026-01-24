"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LocationSelector, LocationData } from "@/components/ui/location-selector";
import { ImageUploader } from "@/components/upload/image-uploader";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  MapPin,
  FileText,
  Image as ImageIcon,
  DollarSign,
  CheckCircle,
} from "lucide-react";

const createListingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  region: z.string().min(1, "Region is required"),
  constituency: z.string().min(1, "Constituency is required"),
  district: z.string().min(1, "District is required"),
  town: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "AGRICULTURAL", "MIXED"]),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]),
  leaseDurationYears: z.string().optional(),
  sizeAcres: z.string().min(1, "Size is required"),
  sizePlots: z.string().optional(),
  priceGhs: z.string().min(1, "Price is required"),
  negotiable: z.boolean(),
});

type CreateListingFormData = z.infer<typeof createListingSchema>;

const steps = [
  { id: 1, title: "Basic Info", icon: FileText },
  { id: 2, title: "Location", icon: MapPin },
  { id: 3, title: "Photos", icon: ImageIcon },
  { id: 4, title: "Pricing", icon: DollarSign },
];

export default function NewListingPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [images, setImages] = useState<{ id?: string; url: string; publicId?: string }[]>([]);
  const [locationData, setLocationData] = useState<LocationData>({
    region: "",
    constituency: "",
    district: "",
    town: "",
    latitude: "",
    longitude: "",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateListingFormData>({
    resolver: zodResolver(createListingSchema) as any,
    defaultValues: {
      negotiable: true,
      landType: "RESIDENTIAL",
      tenureType: "FREEHOLD",
    },
  });

  const tenureType = watch("tenureType");

  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    setValue("region", data.region);
    setValue("constituency", data.constituency);
    setValue("district", data.district);
    setValue("town", data.town || "");
    setValue("latitude", data.latitude || "");
    setValue("longitude", data.longitude || "");
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateListingFormData)[] = [];
    
    switch (currentStep) {
      case 1:
        fieldsToValidate = ["title", "description", "landType", "tenureType", "sizeAcres"];
        break;
      case 2:
        fieldsToValidate = ["region", "constituency", "district"];
        break;
      case 3:
        // Photos are optional
        break;
      case 4:
        fieldsToValidate = ["priceGhs"];
        break;
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: CreateListingFormData) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Create listing
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
          sizeAcres: parseFloat(data.sizeAcres),
          sizePlots: data.sizePlots ? parseInt(data.sizePlots) : null,
          priceGhs: parseInt(data.priceGhs),
          leaseDurationYears: data.leaseDurationYears ? parseInt(data.leaseDurationYears) : null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to create listing");
      }

      const listing = await response.json();
      setCreatedListingId(listing.id);

      // Upload images if any
      if (images.length > 0) {
        const imageUrls = images.map((img) => img.url);
        await fetch("/api/upload/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: imageUrls,
            listingId: listing.id,
          }),
        });
      }

      // Redirect to listing detail
      router.push(`/dashboard/listings/${listing.id}?created=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/dashboard/listings/new");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/dashboard/listings"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to My Listings
        </Link>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isActive
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : isCompleted
                        ? "border-emerald-600 bg-emerald-100 text-emerald-600"
                        : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium hidden sm:block ${
                      isActive ? "text-emerald-600" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-12 sm:w-24 h-0.5 mx-2 ${
                        isCompleted ? "bg-emerald-600" : "bg-gray-300"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Location Details"}
              {currentStep === 3 && "Add Photos"}
              {currentStep === 4 && "Set Your Price"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your land"}
              {currentStep === 2 && "Where is your land located?"}
              {currentStep === 3 && "Add photos to attract buyers"}
              {currentStep === 4 && "Set a competitive price"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Listing Title *
                    </label>
                    <Input
                      placeholder="e.g., Prime Residential Land in East Legon"
                      {...register("title")}
                      error={errors.title?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Describe your land, its features, nearby amenities..."
                      rows={4}
                      {...register("description")}
                      error={errors.description?.message}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Land Type *
                      </label>
                      <Select {...register("landType")} error={errors.landType?.message}>
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="AGRICULTURAL">Agricultural</option>
                        <option value="MIXED">Mixed Use</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tenure Type *
                      </label>
                      <Select {...register("tenureType")} error={errors.tenureType?.message}>
                        <option value="FREEHOLD">Freehold</option>
                        <option value="LEASEHOLD">Leasehold</option>
                        <option value="CUSTOMARY">Customary</option>
                      </Select>
                    </div>
                  </div>
                  {tenureType === "LEASEHOLD" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lease Duration (Years)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 50"
                        {...register("leaseDurationYears")}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size (Acres) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="e.g., 2.5"
                        {...register("sizeAcres")}
                        error={errors.sizeAcres?.message}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Plots (Optional)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        {...register("sizePlots")}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <LocationSelector
                    value={locationData}
                    onChange={handleLocationChange}
                    showTown={true}
                    showCoordinates={true}
                    errors={{
                      region: errors.region?.message,
                      constituency: errors.constituency?.message,
                      district: errors.district?.message,
                    }}
                  />
                </div>
              )}

              {/* Step 3: Photos */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Add up to 10 photos of your land. The first photo will be the main image.
                    Good photos help your listing stand out!
                  </p>
                  <ImageUploader
                    images={images}
                    onImagesChange={setImages}
                    maxImages={10}
                  />
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium text-amber-800 mb-2">Photo Tips</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• Take photos during daytime for best lighting</li>
                      <li>• Include photos of boundaries and landmarks</li>
                      <li>• Show access roads and surrounding area</li>
                      <li>• Add photos of any existing structures</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 4: Pricing */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asking Price (GH₵) *
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 500000"
                      {...register("priceGhs")}
                      error={errors.priceGhs?.message}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter the total price for the entire land
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="negotiable"
                      {...register("negotiable")}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="negotiable" className="ml-2 text-sm text-gray-700">
                      Price is negotiable
                    </label>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-medium text-emerald-800 mb-2">What happens next?</h4>
                    <ul className="text-sm text-emerald-700 space-y-1">
                      <li>• Your listing will be saved as a draft</li>
                      <li>• You can add documents and request verification</li>
                      <li>• Once ready, submit for review to publish</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4 border-t">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 4 ? (
                  <Button type="button" onClick={nextStep}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Create Listing
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
