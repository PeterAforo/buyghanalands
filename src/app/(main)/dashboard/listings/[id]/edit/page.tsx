"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { ImageUploader } from "@/components/upload/image-uploader";

const editListingSchema = z.object({
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

type EditListingFormData = z.infer<typeof editListingSchema>;

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [listingId, setListingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationData, setLocationData] = useState<LocationData>({
    region: "",
    constituency: "",
    district: "",
    town: "",
    latitude: "",
    longitude: "",
  });
  const [images, setImages] = useState<{ id?: string; url: string; publicId?: string }[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditListingFormData>({
    resolver: zodResolver(editListingSchema) as any,
    defaultValues: {
      negotiable: true,
    },
  });

  const tenureType = watch("tenureType");

  useEffect(() => {
    params.then((p) => setListingId(p.id));
  }, [params]);

  useEffect(() => {
    if (!listingId) return;

    async function fetchListing() {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) {
          setError("Failed to load listing");
          return;
        }
        const data = await response.json();
        
        // Set form values
        reset({
          title: data.title,
          description: data.description,
          region: data.region,
          constituency: data.constituency || "",
          district: data.district,
          town: data.town || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          landType: data.landType,
          tenureType: data.tenureType,
          leaseDurationYears: data.leaseDurationYears?.toString() || "",
          sizeAcres: data.sizeAcres,
          sizePlots: data.sizePlots?.toString() || "",
          priceGhs: data.priceGhs,
          negotiable: data.negotiable,
        });

        // Set location data
        setLocationData({
          region: data.region,
          constituency: data.constituency || "",
          district: data.district,
          town: data.town || "",
          latitude: data.latitude || "",
          longitude: data.longitude || "",
        });

        // Set images
        if (data.media && Array.isArray(data.media)) {
          setImages(data.media.map((m: { id: string; url: string }) => ({
            id: m.id,
            url: m.url,
          })));
        }
      } catch {
        setError("Failed to load listing");
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [listingId, reset]);

  const handleLocationChange = (data: LocationData) => {
    setLocationData(data);
    setValue("region", data.region);
    setValue("constituency", data.constituency);
    setValue("district", data.district);
    setValue("town", data.town || "");
    setValue("latitude", data.latitude || "");
    setValue("longitude", data.longitude || "");
  };

  const onSubmit = async (data: EditListingFormData) => {
    if (!listingId) return;
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          latitude: data.latitude ? parseFloat(data.latitude) : null,
          longitude: data.longitude ? parseFloat(data.longitude) : null,
          sizeAcres: parseFloat(data.sizeAcres),
          sizePlots: data.sizePlots ? parseInt(data.sizePlots) : null,
          priceGhs: parseInt(data.priceGhs),
          leaseDurationYears: data.leaseDurationYears
            ? parseInt(data.leaseDurationYears)
            : null,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || "Failed to update listing");
        return;
      }

      router.push(`/dashboard/listings/${listingId}?updated=true`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
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
    router.push("/auth/login?callbackUrl=/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={`/dashboard/listings/${listingId}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Listing
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Edit Listing</CardTitle>
            <CardDescription>Update your listing details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Basic Information</h3>
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
                    placeholder="Describe the land..."
                    rows={4}
                    {...register("description")}
                    error={errors.description?.message}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900">Location</h3>
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

              {/* Land Details */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900">Land Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Land Type
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
                      Tenure Type
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
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photos
                </h3>
                <p className="text-sm text-gray-500">
                  Add photos of your land. The first image will be the main photo.
                </p>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  listingId={listingId || undefined}
                  maxImages={10}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium text-gray-900">Pricing</h3>
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
                  <label htmlFor="negotiable" className="ml-2 text-sm text-gray-700">
                    Price is negotiable
                  </label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Link href={`/dashboard/listings/${listingId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
