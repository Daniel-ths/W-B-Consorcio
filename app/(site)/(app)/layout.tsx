import NavbarGate from "@/components/NavbarGate";
import FooterWrapper from "@/components/FooterWrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavbarGate />
      <main className="flex-grow">{children}</main>
      <FooterWrapper />
    </div>
  );
}