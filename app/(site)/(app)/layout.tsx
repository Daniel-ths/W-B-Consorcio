import Navbar from "@/components/Navbar";
import FooterWrapper from "@/components/FooterWrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <FooterWrapper />
    </div>
  );
}