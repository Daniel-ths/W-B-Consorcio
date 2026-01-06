import HeroCarousel from "@/components/HeroCarousel";
import CarCatalog from "@/components/CarCatalog";

export default function Home() {
  return (
    <div className="bg-white">
      
      {/* 1. Carrossel Rotativo (Banners) */}
      {/* Certifique-se de ter criado o arquivo components/HeroCarousel.tsx com o código que definimos antes */}
      <HeroCarousel />

      {/* 2. Lista de Veículos do Banco de Dados */}
      {/* Certifique-se de ter criado o arquivo components/CarCatalog.tsx */}
      <CarCatalog />

    </div>
  );
}