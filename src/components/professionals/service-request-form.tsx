"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Service {
  id: string;
  title: string;
  description?: string;
  priceGhs?: number;
  priceModel: "FIXED" | "HOURLY" | "NEGOTIABLE";
  turnaroundDays?: number;
}

interface ServiceRequestFormProps {
  professionalId: string;
  professionalName: string;
  services: Service[];
  listingId?: string;
  listingTitle?: string;
  onSubmit: (data: ServiceRequestData) => Promise<void>;
  className?: string;
}

interface ServiceRequestData {
  serviceId?: string;
  title: string;
  details: string;
  preferredDate?: string;
  locationNote?: string;
  offerPriceGhs?: number;
}

function ServiceRequestForm({
  professionalId,
  professionalName,
  services,
  listingId,
  listingTitle,
  onSubmit,
  className,
}: ServiceRequestFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedService, setSelectedService] = React.useState<string>("");
  const [title, setTitle] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [preferredDate, setPreferredDate] = React.useState("");
  const [locationNote, setLocationNote] = React.useState("");
  const [offerPrice, setOfferPrice] = React.useState("");
  const [error, setError] = React.useState("");

  const selectedServiceData = services.find((s) => s.id === selectedService);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide a title for your request");
      return;
    }

    if (!details.trim()) {
      setError("Please describe what you need");
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        serviceId: selectedService || undefined,
        title: title.trim(),
        details: details.trim(),
        preferredDate: preferredDate || undefined,
        locationNote: locationNote.trim() || undefined,
        offerPriceGhs: offerPrice ? Number(offerPrice) : undefined,
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      {/* Listing Context */}
      {listingId && listingTitle && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            <span className="font-medium">Regarding listing:</span> {listingTitle}
          </p>
        </div>
      )}

      {/* Service Selection */}
      {services.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a Service (Optional)
          </label>
          <div className="space-y-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setSelectedService(service.id === selectedService ? "" : service.id)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-colors",
                  selectedService === service.id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{service.title}</p>
                    {service.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {service.description}
                      </p>
                    )}
                  </div>
                  {service.priceGhs && (
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-bold text-green-600">
                        GHS {service.priceGhs.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.priceModel === "FIXED" && "Fixed price"}
                        {service.priceModel === "HOURLY" && "Per hour"}
                        {service.priceModel === "NEGOTIABLE" && "Negotiable"}
                      </p>
                    </div>
                  )}
                </div>
                {service.turnaroundDays && (
                  <p className="text-xs text-gray-500 mt-2">
                    Typical turnaround: {service.turnaroundDays} days
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Request Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Request Title <span className="text-red-500">*</span>
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Land Survey for Plot at Tema"
          required
        />
      </div>

      {/* Details */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Describe Your Needs <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Please provide details about what you need, including any specific requirements..."
          rows={4}
          required
        />
      </div>

      {/* Preferred Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Preferred Date
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="pl-10"
            min={new Date().toISOString().split("T")[0]}
          />
        </div>
      </div>

      {/* Location Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Location Details
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <Textarea
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            placeholder="Provide address or directions to the property..."
            className="pl-10"
            rows={2}
          />
        </div>
      </div>

      {/* Offer Price */}
      {(!selectedServiceData || selectedServiceData.priceModel === "NEGOTIABLE") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Budget (GHS)
          </label>
          <Input
            type="number"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            placeholder="Enter your budget"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            The professional may provide a different quote based on your requirements.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Submit Request to {professionalName}
          </>
        )}
      </Button>
    </form>
  );
}

export { ServiceRequestForm };
export type { Service, ServiceRequestData };
