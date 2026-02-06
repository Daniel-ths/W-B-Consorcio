"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ChevronLeft } from "lucide-react";

// Importa os dois "filhos"
import ConfiguratorUI from "./ConfiguratorUI";
import OrderSummary from "./OrderSummary";

const safePrice = (value: any): number => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  if (typeof value === "string") {
    return parseFloat(value.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;
  }
  return 0;
};

// --- COMPONENTE INTERNO COM A LÓGICA ---
function ConfiguratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idDoUrl = searchParams.get("id");

  // --- ESTADOS GLOBAIS ---
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currentCar, setCurrentCar] = useState<any>(null);
  const [relatedCars, setRelatedCars] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSwitchingCar, setIsSwitchingCar] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // --- SELEÇÕES DO USUÁRIO ---
  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedWheel, setSelectedWheel] = useState<any>(null);
  const [selectedSeatType, setSelectedSeatType] = useState<any>(null);
  const [selectedAccs, setSelectedAccs] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
    
    // CORREÇÃO MOBILE: Garante que a altura do app considere as barras do navegador no iOS/Android
    const setHeight = () => {
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };
    setHeight();
    window.addEventListener('resize', setHeight);
    return () => window.removeEventListener('resize', setHeight);
  }, []);

  // 1. Carrega Usuário
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 2. Carrega Carro e Relacionados
  useEffect(() => {
    async function fetchCarData() {
      if (currentCar) setIsSwitchingCar(true);
      try {
        let carToLoad = null;
        if (idDoUrl) {
          const { data } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", idDoUrl)
            .single();
          carToLoad = data;
        } else {
          const { data } = await supabase.from("vehicles").select("*").limit(1).single();
          carToLoad = data;
        }

        if (carToLoad) {
          setCurrentCar(carToLoad);
          if (carToLoad.exterior_colors?.length > 0) setSelectedColor(carToLoad.exterior_colors[0]);
          if (carToLoad.wheels?.length > 0) setSelectedWheel(carToLoad.wheels[0]);
          if (carToLoad.seat_types?.length > 0) setSelectedSeatType(carToLoad.seat_types[0]);
          setSelectedAccs([]);

          const { data: relatives } = await supabase
            .from("vehicles")
            .select("*")
            .eq("category_id", carToLoad.category_id)
            .neq("id", carToLoad.id);

          if (relatives) setRelatedCars([carToLoad, ...relatives].sort((a, b) => a.price_start - b.price_start));
          else setRelatedCars([carToLoad]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsInitialLoad(false);
        setIsSwitchingCar(false);
      }
    }
    
    if (isMounted) {
      fetchCarData();
    }
  }, [idDoUrl, isMounted]);

  // 3. Calcula Preço Total
  const totalPrice = useMemo(() => {
    if (!currentCar) return 0;
    let total = safePrice(currentCar.price_start);
    total += safePrice(selectedColor?.price);
    total += safePrice(selectedWheel?.price);
    total += safePrice(selectedSeatType?.price);
    selectedAccs.forEach((accId) => {
      const acc = currentCar.accessories?.find((a: any) => a.id === accId);
      total += safePrice(acc?.price);
    });
    return total;
  }, [currentCar, selectedColor, selectedWheel, selectedSeatType, selectedAccs]);

  // 4. Prepara Lista de Acessórios
  const selectedAccessoriesList = useMemo(() => {
    if (!currentCar?.accessories) return [];
    return currentCar.accessories.filter((acc: any) => selectedAccs.includes(acc.id));
  }, [currentCar, selectedAccs]);

  const toggleAccessory = (id: string) => {
    setSelectedAccs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBack = () => {
    router.push("/");
  };

  if (!isMounted) return null;

  if (!currentCar && !isInitialLoad)
    return <div className="h-screen flex items-center justify-center">Carro não encontrado.</div>;

  return (
    // Toque Mobile: touch-none no loader para evitar scroll enquanto carrega
    <>
      <div
        className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity pointer-events-none touch-none ${
          isInitialLoad ? "opacity-100" : "opacity-0"
        }`}
      >
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>

      {/* Container Principal Mobile Friendly */}
      <div className="flex flex-col min-h-screen max-w-full overflow-x-hidden select-none touch-manipulation">
        <div className="p-4 flex-shrink-0">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded active:scale-95 hover:bg-gray-300 transition-all text-sm md:text-base"
          >
            <ChevronLeft size={18} />
            Voltar ao Catálogo
          </button>
        </div>

        <main className="flex-grow">
          {currentCar &&
            (showSummary ? (
              <OrderSummary
                currentCar={currentCar}
                selectedColor={selectedColor}
                selectedWheel={selectedWheel}
                selectedSeatType={selectedSeatType}
                selectedAccs={selectedAccs}
                selectedAccessoriesList={selectedAccessoriesList}
                totalPrice={totalPrice}
                user={user}
                onEdit={() => setShowSummary(false)}
              />
            ) : (
              <ConfiguratorUI
                currentCar={currentCar}
                relatedCars={relatedCars}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedWheel={selectedWheel}
                setSelectedWheel={setSelectedWheel}
                selectedSeatType={selectedSeatType}
                setSelectedSeatType={setSelectedSeatType}
                selectedAccs={selectedAccs}
                toggleAccessory={toggleAccessory}
                totalPrice={totalPrice}
                user={user}
                onFinish={() => setShowSummary(true)}
                isSwitchingCar={isSwitchingCar}
              />
            ))}
        </main>
      </div>
    </>
  );
}

// --- WRAPPER DE SUSPENSE ---
export default function VehicleConfigurator() {
  return (
    <Suspense 
      fallback={
        <div className="h-screen w-full flex items-center justify-center">
          <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
      }
    >
      <ConfiguratorContent />
    </Suspense>
  );
}