"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, ChevronLeft } from "lucide-react";

// Importa os dois "filhos" que criamos
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

export default function VehicleConfigurator() {
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

  // --- GARANTE CLIENT-ONLY RENDER PARA EVITAR HYDRATION ---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Carrega Usuário
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // 2. Carrega Carro
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
    fetchCarData();
  }, [idDoUrl]);

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

  // Funções de manipulação
  const toggleAccessory = (id: string) => {
    setSelectedAccs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // --- Botão Voltar ---
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (!isMounted) return null;

  if (!currentCar && !isInitialLoad)
    return <div className="h-screen flex items-center justify-center">Carro não encontrado.</div>;

  return (
    <>
      {/* Loading Global */}
      <div
        className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity pointer-events-none ${
          isInitialLoad ? "opacity-100" : "opacity-0"
        }`}
      >
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>

      {/* Botão Voltar */}
      <div className="p-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <ChevronLeft size={18} />
          Voltar
        </button>
      </div>

      {currentCar &&
        (showSummary ? (
          // --- RENDERIZA O FILHO "PEDIDO/SUMMARY" ---
          <OrderSummary
            currentCar={currentCar}
            selectedColor={selectedColor}
            selectedWheel={selectedWheel}
            selectedSeatType={selectedSeatType}
            selectedAccs={selectedAccs}
            totalPrice={totalPrice}
            user={user}
            onEdit={() => setShowSummary(false)}
          />
        ) : (
          // --- RENDERIZA O FILHO "CONFIGURADOR UI" ---
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
    </>
  );
}
