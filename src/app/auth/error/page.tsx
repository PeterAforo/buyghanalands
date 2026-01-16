"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link may have expired or already been used.",
  OAuthSignin: "Error occurred while trying to sign in with the provider.",
  OAuthCallback: "Error occurred during the OAuth callback.",
  OAuthCreateAccount: "Could not create an account with the OAuth provider.",
  EmailCreateAccount: "Could not create an account with the email provider.",
  Callback: "Error occurred during the authentication callback.",
  OAuthAccountNotLinked: "This email is already associated with another account.",
  EmailSignin: "Error sending the verification email.",
  CredentialsSignin: "Invalid phone number or password. Please try again.",
  SessionRequired: "You must be signed in to access this page.",
  Default: "An unexpected authentication error occurred.",
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error") || "Default";
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 text-sm text-red-600 bg-red-50 rounded-md text-center">
            {errorMessage}
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </Button>

            <p className="text-center text-sm text-gray-600">
              Need help?{" "}
              <Link
                href="/contact"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Contact Support
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
