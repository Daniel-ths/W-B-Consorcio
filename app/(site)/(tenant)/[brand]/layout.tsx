import { notFound } from "next/navigation";
import { BRANDS, isBrandKey } from "@/brands";

import ChevroletNavbar from "@/components/Navbar";
import ChevroletFooter from "@/components/FooterWrapper";

import HyundaiNavbar from "@/components/tenant/HyundaiNavbar";
import HyundaiFooter from "@/components/tenant/HyundaiFooter";

export default function BrandLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { brand: string };
}) {
  if (!isBrandKey(params.brand)) notFound();

  const brand = BRANDS[params.brand];

  const Navbar = brand.key === "hyundai" ? HyundaiNavbar : ChevroletNavbar;
  const Footer = brand.key === "hyundai" ? HyundaiFooter : ChevroletFooter;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}