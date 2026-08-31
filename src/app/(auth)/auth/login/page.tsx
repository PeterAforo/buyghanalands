"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Shield,
  Sparkles,
  ArrowRight,
  Building2,
  Users,
  TrendingUp,
} from "lucide-react";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(4, "Enter your email or phone number")
    .regex(/^[0-9+@a-zA-Z._\s-]+$/, "Invalid email or phone number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const features = [
  {
    icon: Shield,
    title: "Secure Escrow",
    description: "Your funds are protected until transaction completion",
  },
  {
    icon: CheckCircle,
    title: "Verified Listings",
    description: "All properties undergo thorough verification",
  },
  {
    icon: Users,
    title: "Expert Network",
    description: "Connect with surveyors, lawyers & professionals",
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    const result = await signIn("credentials", {
      identifier: data.identifier,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid phone number or password");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();

    if (session?.user?.roles?.includes("ADMIN")) {
      router.push("/admin");
    } else {
      router.push("/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 relative overflow-hidden">
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
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-2xl -rotate-12" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
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

            <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Welcome back to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
                Ghana&apos;s #1 Land Platform
              </span>
            </h1>

            <p className="text-lg text-emerald-100 mb-12 max-w-md">
              Continue your journey to find, buy, or sell land with confidence and security.
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <feature.icon className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-emerald-200">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold text-white">5,000+</p>
                <p className="text-sm text-emerald-200">Listings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">16</p>
                <p className="text-sm text-emerald-200">Regions</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">98%</p>
                <p className="text-sm text-emerald-200">Satisfaction</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Buy Ghana Lands</span>
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
              <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {verified && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-4 text-sm text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-100"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <span>Email verified successfully! You can now sign in.</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-100"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                  Email or Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="identifier"
                    type="text"
                    data-testid="login-email"
                    placeholder="you@email.com or 0XX XXX XXXX"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-xl border ${
                      errors.identifier ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                    {...register("identifier")}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-sm text-red-600">{errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    data-testid="login-password"
                    placeholder="Enter your password"
                    className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${
                      errors.password ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50"
                    } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer group">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    Remember me
                  </span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                data-testid="login-submit"
                disabled={isSubmitting}
                className="w-full py-3.5 h-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
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
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            {/* Google OAuth divider + button */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-gray-400">or continue with</span>
                </div>
              </div>
              <button
                type="button"
                data-testid="login-google"
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/register"
                  className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Trusted</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-full max-w-md h-96 bg-gray-100 animate-pulse rounded-3xl" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
