"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function NavbarGate() {
  const pathname = usePathname();

  // rotas onde a navbar global some
  const hide =
    pathname?.includes("/pedido") ||
    pathname?.includes("/contrato") ||
    pathname?.includes("/analise");

  if (hide) return null;

  return <Navbar />;
}