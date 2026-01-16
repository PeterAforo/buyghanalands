import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-gray-500">Last updated: January 2026</p>
          </CardHeader>
          <CardContent className="prose prose-emerald max-w-none">
            <h2 className="text-xl font-semibold mt-6 mb-3">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using BuyGhanaLands, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by these terms, 
              please do not use this service.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">2. Description of Service</h2>
            <p className="text-gray-600 mb-4">
              BuyGhanaLands is an online marketplace that connects land buyers and sellers in Ghana. 
              We provide a platform for listing land properties, facilitating communication between 
              parties, and offering escrow services for secure transactions.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">3. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              To use certain features of our service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">4. Listing Requirements</h2>
            <p className="text-gray-600 mb-4">
              All property listings must:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
              <li>Represent real properties that the seller has the right to sell</li>
              <li>Include accurate descriptions and photographs</li>
              <li>Comply with all applicable Ghanaian laws and regulations</li>
              <li>Not contain fraudulent or misleading information</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">5. Escrow Services</h2>
            <p className="text-gray-600 mb-4">
              Our escrow service holds funds securely until transaction conditions are met. 
              By using our escrow service, you agree to our escrow terms and understand that:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
              <li>Funds are held by our licensed escrow partner</li>
              <li>Release of funds is subject to verification requirements</li>
              <li>Platform fees are non-refundable once a transaction is completed</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-3">6. Fees and Payments</h2>
            <p className="text-gray-600 mb-4">
              BuyGhanaLands charges a platform fee of 1.5% on successful transactions. 
              Additional fees may apply for premium services such as verification and 
              professional services.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">7. Dispute Resolution</h2>
            <p className="text-gray-600 mb-4">
              In case of disputes between buyers and sellers, our support team will review 
              the case and make a determination based on the evidence provided. Our decision 
              is final and binding.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">8. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              BuyGhanaLands is not responsible for the accuracy of listings, the conduct of 
              users, or the outcome of transactions. We provide a platform service only and 
              are not party to transactions between users.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">9. Termination</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to suspend or terminate accounts that violate these terms 
              or engage in fraudulent activity.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-3">10. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms of Service, please contact us at 
              support@buyghanalands.com or through our contact page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
