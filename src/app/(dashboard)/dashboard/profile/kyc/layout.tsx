import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Verification | Buy Ghana Lands",
  description: "Complete your KYC verification to increase trust and unlock features on Buy Ghana Lands.",
};

export default function KycLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
