"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LocationSelector, LocationData } from "@/components/ui/location-selector";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";

const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  region: z.string().min(1, "Region is required"),
  constituency: z.string().min(1, "Constituency is required"),
  district: z.string().min(1, "District is required"),
  town: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  landType: z.enum(["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL", "AGRICULTURAL", "MIXED"]),
  categoryId: z.string().optional(),
  tenureType: z.enum(["FREEHOLD", "LEASEHOLD", "CUSTOMARY"]),
  leaseDurationYears: z.string().optional(),
  sizeAcres: z.string().min(1, "Size is required"),
  sizePlots: z.string().optional(),
  priceGhs: z.string().min(1, "Price is required"),
  negotiable: z.boolean(),
});

type ListingFormData = z.infer<typeof listingSchema>;

const steps = [
  { id: 1, name: "Basic Info", description: "Title and description" },
  { id: 2, name: "Location", description: "Where is the land?" },
  { id: 3, name: "Details", description: "Land type and size" },
  { id: 4, name: "Pricing", description: "Set your price" },
];

export default function CreateListingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    region: "",
    constituency: "",
    district: "",
    town: "",
    latitude: "",
    longitude: "",
  });
  const [categories, setCategories] = useState<Array<{
    id: string;
    name: string;
    description: string | null;
    landType: string;
  }>>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema) as any,
    defaultValues: {
      negotiable: true,
      landType: "RESIDENTIAL",
      tenureType: "FREEHOLD",
    },
  });

  const landType = watch("landType");
  const tenureType = watch("tenureType");

  useEffect(() => {
    fetch("/api/admin/land-categories")
      .then((res) => res.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const filteredCategories = categories.filter(
    (cat) => cat.landType === landType
  );

  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    setValue("region", data.region);
    setValue("constituency", data.constituency);
    setValue("district", data.district);
    setValue("town", data.town || "");
    setValue("latitude", data.latitude || "");
    setValue("longitude", data.longitude || "");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login?callbackUrl=/listings/create");
    return null;
  }

  const nextStep = async () => {
    const fieldsToValidate: (keyof ListingFormData)[][] = [
      ["title", "description"],
      ["region", "constituency", "district"],
      ["landType", "tenureType", "sizeAcres"],
      ["priceGhs"],
    ];

    const isValid = await trigger(fieldsToValidate[currentStep - 1]);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: ListingFormData) => {
    setError(null);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          latitude: data.latitude ? parseFloat(data.latitude) : undefined,
          longitude: data.longitude ? parseFloat(data.longitude) : undefined,
          sizeAcres: parseFloat(data.sizeAcres),
          sizePlots: data.sizePlots ? parseInt(data.sizePlots) : null,
          priceGhs: parseInt(data.priceGhs),
          leaseDurationYears: data.leaseDurationYears
            ? parseInt(data.leaseDurationYears)
            : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create listing");
        return;
      }

      router.push(`/listings/${result.id}?created=true`);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/listings"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Listings
        </Link>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  className={`relative ${
                    index !== steps.length - 1 ? "flex-1" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        currentStep > step.id
                          ? "bg-emerald-600"
                          : currentStep === step.id
                          ? "bg-emerald-600"
                          : "bg-gray-200"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5 text-white" />
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            currentStep === step.id
                              ? "text-white"
                              : "text-gray-500"
                          }`}
                        >
                          {step.id}
                        </span>
                      )}
                    </div>
                    {index !== steps.length - 1 && (
                      <div
                        className={`ml-4 h-0.5 flex-1 ${
                          currentStep > step.id ? "bg-emerald-600" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-900">
                      {step.name}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Basic Information"}
              {currentStep === 2 && "Location Details"}
              {currentStep === 3 && "Land Details"}
              {currentStep === 4 && "Pricing"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Tell us about your land"}
              {currentStep === 2 && "Where is the land located?"}
              {currentStep === 3 && "Describe the land type and size"}
              {currentStep === 4 && "Set your asking price"}
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
                      Listing Title
                    </label>
                    <Input
                      placeholder="e.g., Prime Residential Land in East Legon"
                      {...register("title")}
                      error={errors.title?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Textarea
                      placeholder="Describe the land, its features, nearby amenities, and any other relevant details..."
                      rows={6}
                      {...register("description")}
                      error={errors.description?.message}
                    />
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
                      town: errors.town?.message,
                      latitude: errors.latitude?.message,
                      longitude: errors.longitude?.message,
                    }}
                  />
                </div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Land Type
                      </label>
                      <Select
                        {...register("landType")}
                        error={errors.landType?.message}
                      >
                        <option value="RESIDENTIAL">Residential</option>
                        <option value="COMMERCIAL">Commercial</option>
                        <option value="INDUSTRIAL">Industrial</option>
                        <option value="AGRICULTURAL">Agricultural</option>
                        <option value="MIXED">Mixed Use</option>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tenure Type
                      </label>
                      <Select
                        {...register("tenureType")}
                        error={errors.tenureType?.message}
                      >
                        <option value="FREEHOLD">Freehold</option>
                        <option value="LEASEHOLD">Leasehold</option>
                        <option value="CUSTOMARY">Customary</option>
                      </Select>
                    </div>
                  </div>
                  {/* Category Selection */}
                  {filteredCategories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category (Optional)
                      </label>
                      <Select {...register("categoryId")}>
                        <option value="">Select a category...</option>
                        {filteredCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </Select>
                      {filteredCategories.find((c) => c.id === watch("categoryId"))?.description && (
                        <p className="mt-1 text-xs text-gray-500">
                          {filteredCategories.find((c) => c.id === watch("categoryId"))?.description}
                        </p>
                      )}
                    </div>
                  )}
                  {tenureType === "LEASEHOLD" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lease Duration (Years)
                      </label>
                      <Input
                        type="number"
                        placeholder="e.g., 50"
                        {...register("leaseDurationYears")}
                        error={errors.leaseDurationYears?.message}
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Size (Acres)
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
                        error={errors.sizePlots?.message}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Pricing */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asking Price (GH₵)
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g., 500000"
                      {...register("priceGhs")}
                      error={errors.priceGhs?.message}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="negotiable"
                      {...register("negotiable")}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="negotiable"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Price is negotiable
                    </label>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <p className="text-sm text-emerald-800">
                      <strong>Next Steps:</strong> After creating your listing,
                      you can upload photos, documents, and submit for
                      verification.
                    </p>
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
                  <Button type="submit" isLoading={isSubmitting}>
                    Create Listing
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
