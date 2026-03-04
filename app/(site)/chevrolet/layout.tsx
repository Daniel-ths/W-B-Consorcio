// app/(site)/chevrolet/layout.tsx
import ChevroletNavbar from "@/components/Navbar";
import ChevroletFooter from "@/components/FooterWrapper";

export default function ChevroletLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <ChevroletNavbar />
      <main className="flex-1">{children}</main>
      <ChevroletFooter />
    </div>
  );
}