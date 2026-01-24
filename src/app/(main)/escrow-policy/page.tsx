import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, RefreshCw, CheckCircle } from "lucide-react";

export default function EscrowPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escrow Policy</h1>
          <p className="text-xl text-gray-600">
            How we protect your money during land transactions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Secure Holding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Funds are held in a secure escrow account until all transaction 
                conditions are met and verified.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Buyer Protection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Your payment is protected. If the seller fails to meet conditions, 
                you receive a full refund.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Seller Assurance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sellers are assured of payment once they fulfill all agreed 
                conditions and documentation requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <RefreshCw className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                In case of disputes, our team mediates to find a fair resolution 
                for both parties.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Escrow Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="font-semibold">Offer Accepted</h3>
                <p className="text-gray-600 text-sm">Buyer and seller agree on terms and price</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h3 className="font-semibold">Funds Deposited</h3>
                <p className="text-gray-600 text-sm">Buyer deposits payment into escrow</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h3 className="font-semibold">Verification Period</h3>
                <p className="text-gray-600 text-sm">Minimum 7 days for document verification and due diligence</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <h3 className="font-semibold">Funds Released</h3>
                <p className="text-gray-600 text-sm">Upon successful verification, funds are released to seller</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
