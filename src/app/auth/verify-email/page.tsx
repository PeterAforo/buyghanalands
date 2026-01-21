"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, CheckCircle } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) return;
    
    setResending(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to resend verification email");
        return;
      }

      setResent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We&apos;ve sent a verification link to your email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Verification email sent to:</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p>Please check your inbox and click the verification link to activate your account.</p>
            <p>The link will expire in 24 hours.</p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {resent ? (
            <div className="flex items-center justify-center gap-2 p-3 text-sm text-emerald-600 bg-emerald-50 rounded-md">
              <CheckCircle className="h-4 w-4" />
              Verification email resent!
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Didn&apos;t receive the email?</p>
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending || !email}
              >
                {resending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </div>
          )}

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              Already verified?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
