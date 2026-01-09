"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  // LISTA DE ROTAS ONDE O FOOTER VAI SUMIR
  // Adicione aqui a rota da sua página de configuração. 
  // Exemplo: se a página é /vendedor/simulacao, coloque isso na lista.
  const hiddenRoutes = [
    "/vendedor/simulacao", 
    "/configurador",
    "/checkout"
  ];

  // Verifica se a rota atual começa com algum dos caminhos acima
  const shouldHideFooter = hiddenRoutes.some((route) => pathname.startsWith(route));

  if (shouldHideFooter) {
    return null; // Não renderiza nada
  }

  return <Footer />;
}