// app/(site)/hyundai/layout.tsx
import HyundaiNavbar from "@/components/tenant/HyundaiNavbar";
import HyundaiFooter from "@/components/tenant/HyundaiFooter";

export default function HyundaiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <HyundaiNavbar />
      <main className="flex-1">{children}</main>
      <HyundaiFooter />
    </div>
  );
}