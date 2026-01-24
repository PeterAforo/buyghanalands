"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Briefcase,
  Building2,
  Users,
  ShoppingCart,
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  Sparkles,
  Crown,
  Star,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  Compass,
  Scale,
  PenTool,
  HardHat,
} from "lucide-react";
import {
  BUYER_PLANS,
  SELLER_PLANS,
  AGENT_PLANS,
  PROFESSIONAL_PLANS,
  formatSubscriptionPrice,
} from "@/lib/subscriptions";

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
    selectedPlan: z.string().optional(),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const ACCOUNT_TYPES = [
  {
    value: "BUYER" as const,
    label: "Buy Land",
    description: "Browse listings and purchase land with escrow protection",
    icon: ShoppingCart,
    color: "emerald",
    gradient: "from-emerald-500 to-green-600",
    requiresSubscription: false,
  },
  {
    value: "SELLER" as const,
    label: "Sell Land",
    description: "List your properties and reach verified buyers",
    icon: Building2,
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    requiresSubscription: false,
  },
  {
    value: "AGENT" as const,
    label: "Real Estate Agent",
    description: "Manage clients and listings, earn commissions",
    icon: Users,
    color: "purple",
    gradient: "from-purple-500 to-violet-600",
    requiresSubscription: true,
  },
  {
    value: "PROFESSIONAL" as const,
    label: "Professional Services",
    description: "Offer surveying, legal, or other professional services",
    icon: Briefcase,
    color: "orange",
    gradient: "from-orange-500 to-amber-600",
    requiresSubscription: true,
  },
] as const;

const PROFESSIONAL_TYPES = [
  { value: "SURVEYOR", label: "Surveyor", icon: Compass },
  { value: "LAWYER", label: "Lawyer", icon: Scale },
  { value: "ARCHITECT", label: "Architect", icon: PenTool },
  { value: "ENGINEER", label: "Engineer", icon: HardHat },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "BUYER",
      selectedPlan: "FREE",
      billingCycle: "MONTHLY",
    },
  });

  const selectedAccountType = watch("accountType");
  const selectedPlan = watch("selectedPlan");
  const selectedTypeInfo = ACCOUNT_TYPES.find((t) => t.value === selectedAccountType);

  const getPlansForType = () => {
    switch (selectedAccountType) {
      case "BUYER":
        return Object.values(BUYER_PLANS);
      case "SELLER":
        return Object.values(SELLER_PLANS);
      case "AGENT":
        return Object.values(AGENT_PLANS);
      case "PROFESSIONAL":
        return Object.values(PROFESSIONAL_PLANS);
      default:
        return [];
    }
  };

  const plans = getPlansForType();

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          billingCycle,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed");
        return;
      }

      const redirectUrl = `/auth/verify-email?email=${encodeURIComponent(data.email)}&accountType=${data.accountType}`;
      router.push(redirectUrl);
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  const nextStep = () => {
    if (step === 1 && selectedTypeInfo?.requiresSubscription && !selectedPlan) {
      return;
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleAccountTypeSelect = (type: typeof selectedAccountType) => {
    setValue("accountType", type);
    // Set default plan based on type
    if (type === "BUYER") {
      setValue("selectedPlan", "FREE");
    } else if (type === "SELLER") {
      setValue("selectedPlan", "FREE");
    } else if (type === "AGENT") {
      setValue("selectedPlan", "BASIC");
    } else if (type === "PROFESSIONAL") {
      setValue("selectedPlan", "BASIC");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-400/20 rounded-3xl rotate-12 blur-sm" />
        <div className="absolute bottom-40 right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-sm" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-12">
              <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <MapPin className="h-7 w-7 text-yellow-400" />
              </div>
              <span className="text-2xl font-bold text-white">Buy Ghana Lands</span>
            </Link>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Start Your Journey
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
                in Ghana Real Estate
              </span>
            </h1>

            <p className="text-lg text-emerald-100 mb-10 max-w-md">
              Join thousands of buyers, sellers, and professionals on Ghana&apos;s most trusted land marketplace.
            </p>

            {/* Progress Steps */}
            <div className="space-y-4">
              {[
                { num: 1, label: "Choose Your Path", desc: "Select account type & plan" },
                { num: 2, label: "Pick a Plan", desc: "Choose features that fit your needs" },
                { num: 3, label: "Create Account", desc: "Enter your details" },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                    step === s.num
                      ? "bg-white/10 backdrop-blur-sm"
                      : step > s.num
                      ? "opacity-60"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      step > s.num
                        ? "bg-yellow-400 text-emerald-900"
                        : step === s.num
                        ? "bg-white text-emerald-900"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{s.label}</p>
                    <p className="text-sm text-emerald-200">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Buy Ghana Lands</span>
            </Link>
          </div>

          {/* Mobile Progress */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step ? "w-8 bg-emerald-600" : s < step ? "w-2 bg-emerald-400" : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Choose Account Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">What brings you here?</h2>
                  <p className="text-gray-600 mt-2">Choose how you want to use Buy Ghana Lands</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {ACCOUNT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedAccountType === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleAccountTypeSelect(type.value)}
                        className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 shadow-lg"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${type.gradient}`}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{type.label}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                        {type.requiresSubscription && (
                          <span className="absolute top-4 right-4 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                            Subscription
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-4 left-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
                      Sign in
                    </Link>
                  </p>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Choose Plan */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Choose Your Plan</h2>
                  <p className="text-gray-600 mt-2">
                    Select the plan that best fits your needs
                  </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-8">
                  <span className={`text-sm font-medium ${billingCycle === "MONTHLY" ? "text-gray-900" : "text-gray-500"}`}>
                    Monthly
                  </span>
                  <button
                    type="button"
                    onClick={() => setBillingCycle(billingCycle === "MONTHLY" ? "YEARLY" : "MONTHLY")}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      billingCycle === "YEARLY" ? "bg-emerald-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        billingCycle === "YEARLY" ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${billingCycle === "YEARLY" ? "text-gray-900" : "text-gray-500"}`}>
                    Yearly
                  </span>
                  {billingCycle === "YEARLY" && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                      Save 17%
                    </span>
                  )}
                </div>

                <div className="grid gap-4 mb-8">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.plan;
                    const price = billingCycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
                    const monthlyEquivalent = billingCycle === "YEARLY" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

                    return (
                      <button
                        key={plan.plan}
                        type="button"
                        onClick={() => setValue("selectedPlan", plan.plan)}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50 shadow-lg"
                            : "border-gray-200 bg-white hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{plan.name}</h3>
                              {plan.popular && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                                  <Star className="h-3 w-3" /> Popular
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(plan.features)
                                .filter(([, value]) => value === true)
                                .slice(0, 4)
                                .map(([key]) => (
                                  <span
                                    key={key}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                  >
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                ))}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-2xl font-bold text-gray-900">
                              {price === 0 ? "Free" : `GHS ${monthlyEquivalent}`}
                            </p>
                            {price > 0 && (
                              <p className="text-xs text-gray-500">
                                {billingCycle === "YEARLY" ? "/mo (billed yearly)" : "/month"}
                              </p>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="rounded-xl"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Account Details */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
                    <p className="text-gray-600 mt-2">Enter your details to get started</p>
                  </div>

                  {/* Selected Plan Summary */}
                  <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {selectedTypeInfo && (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${selectedTypeInfo.gradient}`}>
                            <selectedTypeInfo.icon className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{selectedTypeInfo?.label}</p>
                          <p className="text-sm text-gray-600">
                            {plans.find((p) => p.plan === selectedPlan)?.name} Plan
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {error && (
                      <div className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100">
                        {error}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="fullName"
                          type="text"
                          placeholder="Kwame Asante"
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${
                            errors.fullName ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                          {...register("fullName")}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-red-600">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${
                            errors.email ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          id="phone"
                          type="tel"
                          placeholder="0XX XXX XXXX"
                          className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${
                            errors.phone ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                          } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                          {...register("phone")}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create password"
                            className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${
                              errors.password ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                            } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                            {...register("password")}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-sm text-red-600">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm password"
                            className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${
                              errors.confirmPassword ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                            } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                            {...register("confirmPassword")}
                          />
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start pt-2">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="h-4 w-4 mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                        I agree to the{" "}
                        <Link href="/terms" className="text-emerald-600 hover:text-emerald-500 font-medium">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-emerald-600 hover:text-emerald-500 font-medium">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        className="rounded-xl"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-8"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Creating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            Create Account
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>

                <p className="text-center text-sm text-gray-600 mt-6">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
                    Sign in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
