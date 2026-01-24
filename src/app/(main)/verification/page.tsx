import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileCheck, Users, Award } from "lucide-react";

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Land Verification</h1>
          <p className="text-xl text-gray-600">
            Professional verification services to ensure your land purchase is secure
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <FileCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Document Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our legal experts verify all land documents including indentures, 
                site plans, and title certificates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Ownership Confirmation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We confirm the seller&apos;s legal right to sell the property through 
                official records and family documentation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Site Inspection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Licensed surveyors physically inspect the land to verify boundaries, 
                size, and any encumbrances.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Verification Certificate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Receive a comprehensive verification report and certificate 
                for your records and peace of mind.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verification Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-l-4 border-gray-300 pl-4">
              <h3 className="font-semibold">Level 0 - Unverified</h3>
              <p className="text-gray-600 text-sm">Listing submitted, no verification performed</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold">Level 1 - Documents Uploaded</h3>
              <p className="text-gray-600 text-sm">Seller has uploaded supporting documents</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">Level 2 - Platform Reviewed</h3>
              <p className="text-gray-600 text-sm">Our team has reviewed and verified documents</p>
            </div>
            <div className="border-l-4 border-emerald-500 pl-4">
              <h3 className="font-semibold">Level 3 - Officially Verified</h3>
              <p className="text-gray-600 text-sm">Verified by licensed professionals with site inspection</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
