import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Shield, Users, Target } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About Buy Ghana Lands</h1>
          <p className="text-xl text-gray-600">
            Ghana&apos;s trusted platform for secure land transactions
          </p>
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          <p>
            Buy Ghana Lands is a revolutionary platform designed to bring transparency, 
            security, and trust to land transactions in Ghana. We connect buyers with 
            verified sellers while providing escrow protection and professional verification 
            services.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                To eliminate land fraud and make property transactions in Ghana safe, 
                transparent, and accessible to everyone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Our Promise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Every transaction is protected by our escrow system, and every listing 
                can be verified by licensed professionals.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                A dedicated team of technology and real estate professionals committed 
                to transforming Ghana&apos;s property market.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Our Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Operating across all 16 regions of Ghana, connecting buyers and sellers 
                nationwide.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
