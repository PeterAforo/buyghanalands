import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Pricing</h1>
          <p className="text-xl text-gray-600">
            Transparent fees for secure land transactions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>For Buyers</CardTitle>
              <p className="text-3xl font-bold text-emerald-600 mt-2">Free</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Browse all listings</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Contact sellers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Make offers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Escrow protection</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Sellers</CardTitle>
              <p className="text-3xl font-bold text-emerald-600 mt-2">1.5%</p>
              <p className="text-sm text-gray-500">of transaction value</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>List unlimited properties</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Reach verified buyers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Secure payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span>Transaction support</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Verification Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Professional verification services are provided by licensed surveyors and lawyers. 
              Prices vary based on location and scope of verification required.
            </p>
            <p className="text-gray-600">
              Contact our support team for a quote on verification services.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
