"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Lock, Eye, EyeOff, User, Mail, Briefcase, Building2, Users, ShoppingCart } from "lucide-react";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email address is required"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .regex(/^[0-9+]+$/, "Invalid phone number"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    accountType: z.enum(["BUYER", "SELLER", "AGENT", "PROFESSIONAL"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const ACCOUNT_TYPES = [
  {
    value: "BUYER",
    label: "Buy Land",
    description: "Browse listings and purchase land with escrow protection",
    icon: ShoppingCart,
    requiresSubscription: false,
  },
  {
    value: "SELLER",
    label: "Sell Land",
    description: "List your properties and reach verified buyers",
    icon: Building2,
    requiresSubscription: false,
  },
  {
    value: "AGENT",
    label: "Real Estate Agent",
    description: "Manage clients and listings, earn commissions",
    icon: Users,
    requiresSubscription: true,
  },
  {
    value: "PROFESSIONAL",
    label: "Professional Services",
    description: "Offer surveying, legal, or other professional services",
    icon: Briefcase,
    requiresSubscription: true,
  },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "BUYER",
    },
  });

  const selectedAccountType = watch("accountType");
  const selectedTypeInfo = ACCOUNT_TYPES.find((t) => t.value === selectedAccountType);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed");
        return;
      }

      // Redirect based on account type
      // Agents and Professionals need to complete subscription after email verification
      const redirectUrl = `/auth/verify-email?email=${encodeURIComponent(data.email)}&accountType=${data.accountType}`;
      router.push(redirectUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <MapPin className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Join Buy Ghana Lands and start your journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Kwame Asante"
                  className="pl-10"
                  {...register("fullName")}
                  error={errors.fullName?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0XX XXX XXXX"
                  className="pl-10"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ACCOUNT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedAccountType === type.value;
                  return (
                    <label
                      key={type.value}
                      className={`relative flex flex-col p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        {...register("accountType")}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${isSelected ? "text-emerald-600" : "text-gray-500"}`} />
                        <span className={`text-sm font-medium ${isSelected ? "text-emerald-700" : "text-gray-700"}`}>
                          {type.label}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 line-clamp-2">
                        {type.description}
                      </span>
                      {type.requiresSubscription && (
                        <span className="absolute top-1 right-1 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                          Subscription
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {errors.accountType && (
                <p className="text-sm text-red-500">{errors.accountType.message}</p>
              )}
              {selectedTypeInfo?.requiresSubscription && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  {selectedTypeInfo.value === "AGENT"
                    ? "Agents require a subscription starting at GHS 100/month to manage clients and listings."
                    : "Professionals require a subscription starting at GHS 75/month to offer services."}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="pl-10 pr-10"
                  {...register("password")}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="pl-10"
                  {...register("confirmPassword")}
                  error={errors.confirmPassword?.message}
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="h-4 w-4 mt-0.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-emerald-600 hover:text-emerald-500">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-emerald-600 hover:text-emerald-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Create Account
            </Button>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
