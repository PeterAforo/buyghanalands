import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MessageSquare, Scale, FileText } from "lucide-react";

export default function DisputesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dispute Resolution</h1>
          <p className="text-xl text-gray-600">
            Fair and transparent process for resolving transaction disputes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Raise a Dispute</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Either party can raise a dispute during the verification period 
                if they believe the terms are not being met.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Mediation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Our dispute resolution team reviews the case and facilitates 
                communication between both parties.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Scale className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Fair Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Based on evidence and documentation, we determine the appropriate 
                resolution: release, refund, or partial settlement.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                All dispute proceedings are documented and both parties receive 
                a detailed resolution report.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dispute Process Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold">Dispute Filed (Day 0)</h3>
                <p className="text-gray-600 text-sm">Party submits dispute with supporting evidence</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold">Response Period (Days 1-3)</h3>
                <p className="text-gray-600 text-sm">Other party responds with their evidence</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-amber-600 text-white flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold">Review Period (Days 4-7)</h3>
                <p className="text-gray-600 text-sm">Our team reviews all evidence and documentation</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold">Resolution (Day 7-10)</h3>
                <p className="text-gray-600 text-sm">Final decision communicated and funds distributed accordingly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
