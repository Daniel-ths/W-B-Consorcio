// app/configurador/VehicleConfigurator.tsx
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import ConfiguratorUI from "./ConfiguratorUI";
import OrderSummary from "./OrderSummary";

/* =========================
   HELPERS (à prova de bagunça)
========================= */
const safePrice = (value: any): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  if (typeof value === "string") {
    const n = parseFloat(value.replace(/[^0-9,-]+/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const toId = (v: any) => String(v ?? "").trim();

function normalizeArrayField(input: any): any[] {
  // aceita: array, string JSON "[...]" / "{...}" (só se virar array), ou null
  if (!input) return [];
  if (Array.isArray(input)) return input;

  // Algumas libs/bancos devolvem JSON como string
  if (typeof input === "string") {
    const s = input.trim();
    if (
      (s.startsWith("[") && s.endsWith("]")) ||
      (s.startsWith("{") && s.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(s);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
  }

  // objeto único -> não vira array automaticamente (evita bugs)
  return [];
}

/**
 * ✅ Adapter: normaliza o vehicle do Supabase para o formato que o ConfiguratorUI espera
 * - exterior_colors: garante swatch/hex + images/front + id estável
 * - wheels/seat_types/accessories: garante id string + image + price number
 */
function adaptVehicle(raw: any) {
  if (!raw) return raw;

  const exterior_colors_raw = normalizeArrayField(raw.exterior_colors);
  const wheels_raw = normalizeArrayField(raw.wheels);
  const seat_types_raw = normalizeArrayField(raw.seat_types);
  const accessories_raw = normalizeArrayField(raw.accessories);

  const exterior_colors = exterior_colors_raw.map((c: any) => {
    const images =
      c?.images && typeof c.images === "object" && !Array.isArray(c.images)
        ? c.images
        : {};

    const front = images?.front || c?.image || c?.image_url || null;

    const stableId =
      c?.id ||
      `${(c?.name || "cor").toString().trim().toLowerCase()}::${(
        c?.hex || c?.swatch || ""
      ).toString()}::${front || ""}`;

    return {
      ...c,
      id: toId(stableId),
      hex: c?.hex || c?.swatch || "#000000",
      swatch: c?.hex || c?.swatch || "#000000",
      image: front,
      image_url: front,
      images: {
        front: front,
        ...(images || {}),
      },
      price: safePrice(c?.price),
    };
  });

  const wheels = wheels_raw.map((w: any) => {
    const img = w?.image || w?.image_url || null;
    const stableId =
      w?.id || `wheel::${(w?.name || "").toString().trim().toLowerCase()}::${img || ""}`;
    return {
      ...w,
      id: toId(stableId),
      image: img,
      image_url: img,
      price: safePrice(w?.price),
    };
  });

  const seat_types = seat_types_raw.map((s: any) => {
    const img = s?.image || s?.image_url || null;
    const stableId =
      s?.id || `seat::${(s?.name || "").toString().trim().toLowerCase()}::${img || ""}`;
    return {
      ...s,
      id: toId(stableId),
      image: img,
      image_url: img,
      price: safePrice(s?.price),
    };
  });

  const accessories = accessories_raw.map((a: any) => {
    const img = a?.image || a?.image_url || null;
    const stableId =
      a?.id ||
      `${a?.type || "exterior"}::${(a?.name || "")
        .toString()
        .trim()
        .toLowerCase()}::${img || ""}`;

    return {
      ...a,
      id: toId(stableId),
      image: img,
      image_url: img,
      price: safePrice(a?.price),
      type: a?.type === "interior" ? "interior" : "exterior",
    };
  });

  return {
    ...raw,
    exterior_colors,
    wheels,
    seat_types,
    accessories,

    // compat legado (se algum outro UI usa currentCar.colors)
    colors: exterior_colors,
  };
}

function ConfiguratorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const idDoUrl = searchParams.get("id");
  const { user } = useAuth();

  const [isMounted, setIsMounted] = useState(false);

  const [currentCar, setCurrentCar] = useState<any>(null);
  const [relatedCars, setRelatedCars] = useState<any[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSwitchingCar, setIsSwitchingCar] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const [selectedColor, setSelectedColor] = useState<any>(null);
  const [selectedWheel, setSelectedWheel] = useState<any>(null);
  const [selectedSeatType, setSelectedSeatType] = useState<any>(null);
  const [selectedAccs, setSelectedAccs] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);

    const setHeight = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    setHeight();
    window.addEventListener("resize", setHeight);
    return () => window.removeEventListener("resize", setHeight);
  }, []);

  // ✅ Carrega carro + relacionados
  useEffect(() => {
    let isAlive = true;

    async function fetchCarData() {
      if (!isMounted) return;

      if (currentCar) setIsSwitchingCar(true);
      setIsInitialLoad((prev) => prev); // não muda aqui

      try {
        let carToLoad: any = null;

        if (idDoUrl) {
          const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .eq("id", idDoUrl)
            .single();

          if (error) throw error;
          carToLoad = data;
        } else {
          const { data, error } = await supabase
            .from("vehicles")
            .select("*")
            .limit(1)
            .single();

          if (error) throw error;
          carToLoad = data;
        }

        if (!isAlive) return;

        if (carToLoad) {
          // ✅ logs (remova quando terminar)
          console.log("RAW vehicle", carToLoad?.id, {
            accessories: carToLoad?.accessories,
            wheels: carToLoad?.wheels,
            seat_types: carToLoad?.seat_types,
            exterior_colors: carToLoad?.exterior_colors,
          });

          const normalizedCar = adaptVehicle(carToLoad);

          console.log("ADAPTED vehicle", normalizedCar?.id, {
            accessoriesCount: Array.isArray(normalizedCar?.accessories)
              ? normalizedCar.accessories.length
              : 0,
            accessories: normalizedCar?.accessories,
          });

          setCurrentCar(normalizedCar);

          const colors = Array.isArray(normalizedCar.exterior_colors)
            ? normalizedCar.exterior_colors
            : [];
          const wheels = Array.isArray(normalizedCar.wheels) ? normalizedCar.wheels : [];
          const seats = Array.isArray(normalizedCar.seat_types)
            ? normalizedCar.seat_types
            : [];

          // ✅ defaults
          setSelectedColor(colors[0] || null);
          setSelectedWheel(wheels[0] || null);
          setSelectedSeatType(seats[0] || null);
          setSelectedAccs([]);
          setShowSummary(false);

          // Relacionados (mesma categoria)
          const { data: relatives, error: relErr } = await supabase
            .from("vehicles")
            .select("*")
            .eq("category_id", normalizedCar.category_id)
            .neq("id", normalizedCar.id);

          if (relErr) throw relErr;

          if (!isAlive) return;

          if (relatives && relatives.length > 0) {
            const normalizedRel = relatives.map((r: any) => adaptVehicle(r));
            const merged = [normalizedCar, ...normalizedRel].sort(
              (a, b) => safePrice(a.price_start) - safePrice(b.price_start)
            );

            // remove duplicatas por id (à prova de inconsistências)
            const uniq = merged.filter(
              (car, idx, self) =>
                idx === self.findIndex((t) => toId(t?.id) === toId(car?.id))
            );

            setRelatedCars(uniq);
          } else {
            setRelatedCars([normalizedCar]);
          }
        } else {
          setCurrentCar(null);
          setRelatedCars([]);
        }
      } catch (error) {
        console.error("fetchCarData error:", error);
        if (!isAlive) return;
        setCurrentCar(null);
        setRelatedCars([]);
      } finally {
        if (!isAlive) return;
        setIsInitialLoad(false);
        setIsSwitchingCar(false);
      }
    }

    if (isMounted) fetchCarData();

    return () => {
      isAlive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDoUrl, isMounted]);

  const totalPrice = useMemo(() => {
    if (!currentCar) return 0;

    let total = safePrice(currentCar.price_start);
    total += safePrice(selectedColor?.price);
    total += safePrice(selectedWheel?.price);
    total += safePrice(selectedSeatType?.price);

    const accs = Array.isArray(currentCar.accessories) ? currentCar.accessories : [];
    selectedAccs.forEach((accId) => {
      const acc = accs.find((a: any) => toId(a.id) === toId(accId));
      total += safePrice(acc?.price);
    });

    return total;
  }, [currentCar, selectedColor, selectedWheel, selectedSeatType, selectedAccs]);

  const selectedAccessoriesList = useMemo(() => {
    const accs = Array.isArray(currentCar?.accessories) ? currentCar.accessories : [];
    const setIds = new Set(selectedAccs.map(toId));
    return accs.filter((acc: any) => setIds.has(toId(acc.id)));
  }, [currentCar, selectedAccs]);

  const toggleAccessory = (id: string) => {
    const tid = toId(id);
    setSelectedAccs((prev) => {
      const setPrev = new Set(prev.map(toId));
      if (setPrev.has(tid)) return prev.filter((x) => toId(x) !== tid);
      return [...prev, tid];
    });
  };

  const handleBack = () => router.push("/");

  if (!isMounted) return null;

  if (!currentCar && !isInitialLoad) {
    return (
      <div className="h-screen flex items-center justify-center">
        Carro não encontrado.
      </div>
    );
  }

  return (
    <>
      {/* loader clean */}
      <div
        className={`fixed inset-0 z-[9999] bg-white flex items-center justify-center transition-opacity pointer-events-none ${
          isInitialLoad ? "opacity-100" : "opacity-0"
        }`}
      >
        <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
      </div>

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

      {!currentCar && !isInitialLoad ? (
        <div className="fixed top-4 left-4 z-[10000]">
          <button
            onClick={handleBack}
            className="px-4 py-2 rounded-lg bg-white border border-zinc-200 shadow-sm text-sm font-bold"
          >
            Voltar
          </button>
        </div>
      ) : null}
    </>
  );
}

export default function VehicleConfigurator() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-white">
          <Loader2 className="animate-spin text-gray-900" size={40} />
        </div>
      }
    >
      <ConfiguratorContent />
    </Suspense>
  );
}