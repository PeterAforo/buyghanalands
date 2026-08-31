import { ViewTransitions } from "next-view-transitions";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <div className="min-h-screen bg-gray-50">{children}</div>
    </ViewTransitions>
  );
}
