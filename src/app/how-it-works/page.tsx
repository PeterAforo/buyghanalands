import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileCheck, Shield, Key } from "lucide-react";

export default function HowItWorksPage() {
  const steps = [
    {
      icon: Search,
      title: "1. Find Your Land",
      description: "Browse verified listings across all regions of Ghana. Filter by location, size, price, and land type to find your perfect property.",
    },
    {
      icon: FileCheck,
      title: "2. Verify the Property",
      description: "Request professional verification from licensed surveyors and lawyers. Get comprehensive reports on land ownership and documentation.",
    },
    {
      icon: Shield,
      title: "3. Secure Transaction",
      description: "Use our escrow service to protect your payment. Funds are only released when all conditions are met and verified.",
    },
    {
      icon: Key,
      title: "4. Complete Transfer",
      description: "Finalize the transaction with proper documentation. We guide you through the entire transfer process.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-xl text-gray-600">
            A simple, secure process for buying land in Ghana
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 ml-16">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
