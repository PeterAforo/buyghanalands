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
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, FileText, Award, Loader2, CheckCircle } from "lucide-react";

const REGIONS = [
  "Greater Accra", "Ashanti", "Western", "Eastern", "Central",
  "Northern", "Volta", "Upper East", "Upper West", "Bono",
  "Bono East", "Ahafo", "Western North", "Oti", "North East", "Savannah"
];

const registerSchema = z.object({
  professionalType: z.enum(["SURVEYOR", "LAWYER", "VALUER", "ARCHITECT", "ENGINEER", "PLANNER"]),
  companyName: z.string().optional(),
  bio: z.string().min(20, "Bio must be at least 20 characters"),
  licenseNumber: z.string().optional(),
  licenseBody: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  serviceRegions: z.array(z.string()).min(1, "Select at least one region"),
  baseLocation: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function ProfessionalRegisterPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      serviceRegions: [],
    },
  });

  const toggleRegion = (region: string) => {
    const updated = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];
    setSelectedRegions(updated);
    setValue("serviceRegions", updated);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const response = await fetch("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/professional");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              You need to be signed in to register as a professional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login?callbackUrl=/professionals/register">
              <Button className="w-full">Sign In to Continue</Button>
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link href="/auth/register" className="text-emerald-600 hover:underline">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
            <p className="text-gray-600 mb-4">
              Your professional profile has been created. Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Briefcase className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Register as a Professional</CardTitle>
            <CardDescription>
              Join our network of verified land professionals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Professional Type <span className="text-red-500">*</span>
                </label>
                <Select {...register("professionalType")} error={errors.professionalType?.message}>
                  <option value="">Select your profession</option>
                  <option value="SURVEYOR">Land Surveyor</option>
                  <option value="LAWYER">Property Lawyer</option>
                  <option value="VALUER">Property Valuer</option>
                  <option value="ARCHITECT">Architect</option>
                  <option value="ENGINEER">Civil Engineer</option>
                  <option value="PLANNER">Town Planner</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Company Name (Optional)
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Your company or firm name"
                    className="pl-10"
                    {...register("companyName")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Professional Bio <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Describe your experience, expertise, and services..."
                  {...register("bio")}
                />
                {errors.bio && (
                  <p className="text-sm text-red-600">{errors.bio.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    License Number
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="e.g., GhIS/2024/001"
                      className="pl-10"
                      {...register("licenseNumber")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Licensing Body
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="e.g., Ghana Institution of Surveyors"
                      className="pl-10"
                      {...register("licenseBody")}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Years of Experience
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g., 5"
                    {...register("yearsExperience")}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Base Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="e.g., Accra, Ghana"
                      className="pl-10"
                      {...register("baseLocation")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Service Regions <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500">Select regions where you offer services</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {REGIONS.map((region) => (
                    <button
                      key={region}
                      type="button"
                      onClick={() => toggleRegion(region)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        selectedRegions.includes(region)
                          ? "bg-emerald-100 border-emerald-500 text-emerald-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
                {errors.serviceRegions && (
                  <p className="text-sm text-red-600">{errors.serviceRegions.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register as Professional"
                )}
              </Button>

              <p className="text-center text-sm text-gray-600">
                By registering, you agree to our{" "}
                <Link href="/terms" className="text-emerald-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                for professionals.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
