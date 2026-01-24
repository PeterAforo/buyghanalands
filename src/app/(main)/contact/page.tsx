import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600">
            We&apos;re here to help with any questions about land transactions
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">support@buyghanalands.com</p>
              <p className="text-sm text-gray-500 mt-2">We respond within 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">+233 XX XXX XXXX</p>
              <p className="text-sm text-gray-500 mt-2">Mon-Fri, 9am-5pm GMT</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Office</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Accra, Ghana</p>
              <p className="text-sm text-gray-500 mt-2">By appointment only</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Monday - Friday</p>
              <p className="text-sm text-gray-500 mt-2">9:00 AM - 5:00 PM GMT</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
