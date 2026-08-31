import { ViewTransitions } from "next-view-transitions";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <div className="min-h-screen bg-gray-50">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <main id="main-content">{children}</main>
      </div>
    </ViewTransitions>
  );
}
