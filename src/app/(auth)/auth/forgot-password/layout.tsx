import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password | Buy Ghana Lands",
  description: "Reset your Buy Ghana Lands account password if you've forgotten it.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
