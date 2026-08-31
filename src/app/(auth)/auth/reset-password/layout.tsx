import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | Buy Ghana Lands",
  description: "Enter your reset code and choose a new password for your Buy Ghana Lands account.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
