import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Buy Ghana Lands",
  description: "Sign in to your Buy Ghana Lands account to manage listings, offers, and messages.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
