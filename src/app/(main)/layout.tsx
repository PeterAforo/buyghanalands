import { ViewTransitions } from "next-view-transitions";
import { SessionProvider } from "@/components/providers/session-provider";
import { GsapProvider, LenisProvider } from "@/components/motion";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewTransitions>
      <SessionProvider>
        <GsapProvider>
          <LenisProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </LenisProvider>
        </GsapProvider>
      </SessionProvider>
    </ViewTransitions>
  );
}
