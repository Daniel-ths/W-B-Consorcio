"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Car,
  Check,
  ChevronRight,
  ImageIcon,
  Loader2,
  MessageCircle,
  Search,
} from "lucide-react";

type Step = "versoes" | "motor" | "cor" | "interior" | "resumo";
type ViewKey = "front" | "side" | "rear";
type LegacyExteriorKey = "threeQuarter";
type InteriorViewKey = "steeringWheel" | "seat";

type ViewImages = Partial<Record<ViewKey | LegacyExteriorKey, string>>;

type Version = {
  id: string;
  name: string;
  price: number;
  fuel: string;
  transmission: string;
  image: string;
  description?: string;
  images?: ViewImages;
};

type Motor = {
  id: string;
  versionId?: string;
  name: string;
  description: string;
  price: number;
  power: string;
  torque?: string;
  fuel: string;
  transmission: string;
  traction: string;
  acceleration?: string;
  maxSpeed?: string;
  consumption?: string;
};

type Color = {
  id: string;
  versionId?: string;
  name: string;
  type: string;
  price: number;
  hex: string;
  image: string;
  images?: ViewImages;
};

type Interior = {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
};

type GalleryImage = {
  id: string;
  title: string;
  image: string;
  type: "exterior" | "interior";
};

type VehicleConfig = {
  slug: string;
  name: string;
  fullName: string;
  heroImage: string;
  exteriorImage: string;
  interiorImage: string;
  sideImage: string;
  catalogCover: string;
  versions: Version[];
  motors: Motor[];
  colors: Color[];
  interiors: Interior[];
  gallery: GalleryImage[];
};

type VehicleDbRow = {
  slug: string;
  model_name: string;
  full_name?: string | null;
  image_url?: string | null;
  exterior_image_url?: string | null;
  interior_image_url?: string | null;
  side_image_url?: string | null;
  catalog_cover_url?: string | null;
  catalog_hover_url?: string | null;
  versions?: Version[] | null;
  motors?: Motor[] | null;
  colors?: any[] | null;
  interiors?: Interior[] | null;
  gallery?: GalleryImage[] | null;
};

const VW_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen_logo_2019.svg%20(1).png",
  teraMain:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Tera-Banner-Frente-1920x1080.webp",
  teraExterior:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Volkswagen/Tera-Banner-Frente-1920x1080.webp",
  teraInterior: "",
  teraThumb: "",
};

const fallbackVehicle: VehicleConfig = {
  slug: "tera",
  name: "Tera",
  fullName: "Tera MPI 1.0 MPI 84 cv Manual de 5 velocidades 4 portas",
  heroImage: VW_IMAGES.teraMain,
  exteriorImage: VW_IMAGES.teraExterior,
  interiorImage: VW_IMAGES.teraInterior,
  sideImage: VW_IMAGES.teraExterior,
  catalogCover: VW_IMAGES.teraExterior,
  versions: [
    {
      id: "tera-1-0-mpi",
      name: "Tera 1.0 MPI",
      price: 107190,
      fuel: "Total Flex",
      transmission: "Manual",
      image: VW_IMAGES.teraThumb,
      description: "Versão de entrada do Volkswagen Tera.",
    },
  ],
  motors: [
    {
      id: "1-0-mpi-manual",
      name: "1.0 MPI",
      description: "Manual de 5 velocidades",
      price: 107190,
      power: "84 cv",
      torque: "",
      fuel: "Total Flex",
      transmission: "Manual",
      traction: "Tração dianteira",
      acceleration: "",
      maxSpeed: "",
      consumption: "",
    },
  ],
  colors: [
    {
      id: "branco",
      name: "Branco Cristal",
      type: "Sólida",
      price: 0,
      hex: "#efefec",
      image: VW_IMAGES.teraExterior,
      images: { side: VW_IMAGES.teraExterior },
    },
  ],
  interiors: [
    {
      id: "tecido",
      name: "Revestimento em tecido",
      price: 0,
      image: VW_IMAGES.teraInterior,
      description: "Acabamento interno padrão.",
    },
  ],
  gallery: [],
};

function money(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeColor(color: any): Color {
  const images = color?.images || {};
  const image =
    images.side ||
    images.threeQuarter ||
    images.front ||
    images.rear ||
    color?.image ||
    "";

  return {
    id: String(color?.id || crypto.randomUUID()),
    versionId: color?.versionId ? String(color.versionId) : undefined,
    name: String(color?.name || "Cor"),
    type: String(color?.type || "Sólida"),
    price: Number(color?.price || 0),
    hex: String(color?.hex || "#050505"),
    image,
    images,
  };
}

function normalizeVehicleFromDb(row: VehicleDbRow): VehicleConfig {
  const versions = Array.isArray(row.versions) && row.versions.length ? row.versions : fallbackVehicle.versions;
  const motors = Array.isArray(row.motors) && row.motors.length ? row.motors : fallbackVehicle.motors;
  const colors = Array.isArray(row.colors) && row.colors.length ? row.colors.map(normalizeColor) : fallbackVehicle.colors;
  const interiors = Array.isArray(row.interiors) && row.interiors.length ? row.interiors : fallbackVehicle.interiors;

  return {
    slug: row.slug,
    name: row.model_name,
    fullName: row.full_name || row.model_name,
    heroImage: row.image_url || row.side_image_url || row.catalog_cover_url || "",
    exteriorImage: row.exterior_image_url || row.side_image_url || row.image_url || "",
    interiorImage: row.interior_image_url || interiors[0]?.image || "",
    sideImage: row.side_image_url || row.exterior_image_url || row.image_url || "",
    catalogCover: row.catalog_cover_url || row.side_image_url || row.image_url || "",
    versions: versions.map((item) => ({
      ...item,
      price: Number(item.price || 0),
      image: item.image || item.images?.side || row.side_image_url || row.image_url || "",
      description: item.description || "",
      images: item.images || {
        side: item.image || row.side_image_url || row.image_url || "",
      },
    })),
    motors: motors.map((item, index) => ({
      ...item,
      versionId: item.versionId || versions[index]?.id || versions[0]?.id || "",
      price: Number(item.price || 0),
      torque: item.torque || "",
      acceleration: item.acceleration || "",
      maxSpeed: item.maxSpeed || "",
      consumption: item.consumption || "",
    })),
    colors: colors.map((item, index) => ({
      ...item,
      versionId: item.versionId || versions[index]?.id || versions[0]?.id || "",
    })),
    interiors: interiors.map((item) => ({
      ...item,
      price: Number(item.price || 0),
      image: item.image || row.interior_image_url || "",
      description: item.description || "",
    })),
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
  };
}

function getVersionImage(version: Version, view: ViewKey = "side") {
  return (
    version.images?.[view] ||
    version.images?.side ||
    version.images?.front ||
    version.images?.rear ||
    version.images?.threeQuarter ||
    version.image ||
    ""
  );
}

function getColorImage(color: Color, view: ViewKey = "side") {
  return (
    color.images?.[view] ||
    color.images?.side ||
    color.images?.front ||
    color.images?.rear ||
    color.images?.threeQuarter ||
    color.image ||
    ""
  );
}

function normalizeForSearch(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isSteeringWheelReference(item: Interior | GalleryImage) {
  const title = "title" in item ? item.title || "" : "";
  const name = "name" in item ? item.name || "" : "";
  const description = "description" in item ? item.description || "" : "";
  const text = normalizeForSearch(`${title} ${name} ${description}`);
  return text.includes("volante") || text.includes("direcao") || text.includes("steering");
}

function isSeatReference(item: Interior | GalleryImage) {
  const title = "title" in item ? item.title || "" : "";
  const name = "name" in item ? item.name || "" : "";
  const description = "description" in item ? item.description || "" : "";
  const text = normalizeForSearch(`${title} ${name} ${description}`);
  return text.includes("banco") || text.includes("assento") || text.includes("seat") || text.includes("couro") || text.includes("tecido");
}

function getInteriorReference(vehicle: VehicleConfig, key: InteriorViewKey) {
  const matcher = key === "steeringWheel" ? isSteeringWheelReference : isSeatReference;

  const interior = vehicle.interiors.find((item) => matcher(item));
  if (interior?.image) return interior;

  const galleryItem = vehicle.gallery.find(
    (item) => item.type === "interior" && matcher(item) && item.image
  );

  if (galleryItem) {
    return {
      id: galleryItem.id,
      name: galleryItem.title,
      price: 0,
      image: galleryItem.image,
      description: key === "steeringWheel" ? "Referência de volante" : "Referência de banco",
    } as Interior;
  }

  return null;
}

function getInteriorImage(vehicle: VehicleConfig, selectedInterior: Interior, key: InteriorViewKey) {
  return (
    getInteriorReference(vehicle, key)?.image ||
    selectedInterior?.image ||
    vehicle.interiorImage ||
    vehicle.heroImage
  );
}

export default function VolkswagenBuilderPage() {
  const searchParams = useSearchParams();
  const vehicleSlug = searchParams.get("vehicle") || "tera";

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleConfig>(fallbackVehicle);
  const [step, setStep] = useState<Step>("versoes");
  const [view, setView] = useState<ViewKey>("side");
  const [interiorView, setInteriorView] = useState<InteriorViewKey>("steeringWheel");
  const [selectedVersion, setSelectedVersion] = useState<Version>(fallbackVehicle.versions[0]);
  const [selectedMotor, setSelectedMotor] = useState<Motor>(fallbackVehicle.motors[0]);
  const [selectedColor, setSelectedColor] = useState<Color>(fallbackVehicle.colors[0]);
  const [selectedInterior, setSelectedInterior] = useState<Interior>(fallbackVehicle.interiors[0]);

  useEffect(() => {
    let mounted = true;

    async function loadVehicle() {
      setLoading(true);

      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "slug, model_name, full_name, image_url, exterior_image_url, interior_image_url, side_image_url, catalog_cover_url, catalog_hover_url, versions, motors, colors, interiors, gallery"
        )
        .eq("brand", "volkswagen")
        .eq("slug", vehicleSlug)
        .eq("is_visible", true)
        .maybeSingle();

      if (!mounted) return;

      const nextVehicle = !error && data ? normalizeVehicleFromDb(data as VehicleDbRow) : fallbackVehicle;

      setVehicle(nextVehicle);
      const firstVersion = nextVehicle.versions[0];
      const firstMotor =
        nextVehicle.motors.find((motor) => motor.versionId === firstVersion?.id) ||
        nextVehicle.motors[0];
      const firstColor =
        nextVehicle.colors.find((color) => color.versionId === firstVersion?.id) ||
        nextVehicle.colors[0];

      setSelectedVersion(firstVersion);
      setSelectedMotor(firstMotor);
      setSelectedColor(firstColor);
      setSelectedInterior(nextVehicle.interiors[0]);
      setStep("versoes");
      setView("side");
      setInteriorView("steeringWheel");
      setLoading(false);
    }

    loadVehicle();

    return () => {
      mounted = false;
    };
  }, [vehicleSlug]);

  const availableMotors = useMemo(() => {
    const filtered = vehicle.motors.filter((motor) => motor.versionId === selectedVersion?.id);
    return filtered.length ? filtered : vehicle.motors;
  }, [vehicle.motors, selectedVersion]);

  const availableColors = useMemo(() => {
    const filtered = vehicle.colors.filter((color) => color.versionId === selectedVersion?.id);
    return filtered.length ? filtered : vehicle.colors;
  }, [vehicle.colors, selectedVersion]);

  useEffect(() => {
    if (!selectedVersion?.id) return;

    const nextMotor =
      availableMotors.find((motor) => motor.id === selectedMotor?.id) ||
      availableMotors[0];

    if (nextMotor && nextMotor.id !== selectedMotor?.id) {
      setSelectedMotor(nextMotor);
    }

    const nextColor =
      availableColors.find((color) => color.id === selectedColor?.id) ||
      availableColors[0];

    if (nextColor && nextColor.id !== selectedColor?.id) {
      setSelectedColor(nextColor);
    }
  }, [selectedVersion, availableMotors, availableColors, selectedMotor?.id, selectedColor?.id]);

  const total =
    Number(selectedVersion?.price || 0) +
    Number(selectedColor?.price || 0) +
    Number(selectedInterior?.price || 0);

  const currentImage = useMemo(() => {
    if (step === "interior") {
      return getInteriorImage(vehicle, selectedInterior, interiorView);
    }

    if (step === "cor") {
      return (
        getColorImage(selectedColor, view) ||
        getVersionImage(selectedVersion, view) ||
        vehicle.sideImage ||
        vehicle.exteriorImage ||
        vehicle.heroImage
      );
    }

    if (step === "resumo") {
      return (
        getColorImage(selectedColor, "side") ||
        getVersionImage(selectedVersion, "side") ||
        vehicle.sideImage ||
        vehicle.heroImage
      );
    }

    return (
      getVersionImage(selectedVersion, view) ||
      vehicle.sideImage ||
      vehicle.exteriorImage ||
      vehicle.heroImage
    );
  }, [step, vehicle, selectedVersion, selectedColor, selectedInterior, view, interiorView]);

  const goNext = () => {
    if (step === "versoes") return setStep("motor");
    if (step === "motor") return setStep("cor");
    if (step === "cor") return setStep("interior");
    if (step === "interior") return setStep("resumo");
  };

  const nextLabel =
    step === "versoes"
      ? "Motor e Transmissão"
      : step === "motor"
      ? "Cores"
      : step === "cor"
      ? "Interior"
      : step === "interior"
      ? "Resumo"
      : "Tenho Interesse";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-[#001e50]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <p className="mt-3 text-sm font-bold uppercase">Carregando Volkswagen...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#001e50]">
      <header className="fixed left-0 top-0 z-[80] h-[46px] w-full border-b border-black/10 bg-white text-[#001e50]">
        <div className="flex h-full items-center justify-between px-4 md:px-[76px]">
          <div className="flex h-full items-center gap-6">
            <img src={VW_IMAGES.logo} alt="Volkswagen" className="h-[24px] w-auto" />
            <Link href="/volkswagen" className="hidden text-[13px] font-bold md:block">Menu</Link>
            <Link href="/volkswagen" className="hidden text-[13px] font-bold md:block">
              Configure seu novo Volkswagen
            </Link>
            <Link href="/volkswagen" className="hidden text-[13px] font-bold md:block">
              Conheça nossas ofertas
            </Link>
            <Link href="/volkswagen" className="hidden text-[13px] font-bold md:block">
              Serviços e Pós-vendas
            </Link>
          </div>

          <Search className="h-5 w-5" />
        </div>
      </header>

      <nav className="fixed left-0 top-[46px] z-[75] h-[42px] w-full overflow-x-auto border-b border-black/10 bg-white">
        <div className="flex h-full min-w-max items-center gap-3 px-4 text-[13px] md:gap-8 md:px-[76px]">
          <Link href="/volkswagen">Ver modelos</Link>

          {[
            ["versoes", "Versões"],
            ["motor", "Motor e Transmissão"],
            ["cor", "Escolha a cor"],
            ["interior", "Acabamento interno"],
            ["resumo", "Ir para o resumo"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStep(key as Step)}
              className={`rounded-full px-4 py-2 font-semibold transition ${
                step === key ? "bg-[#001e50] text-white" : "text-[#001e50]"
              }`}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <section className="grid min-h-screen grid-cols-1 pt-[88px] pb-[78px] lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)] lg:pb-[70px]">
        <div className="relative min-h-[58vh] overflow-hidden bg-[#f4f4f4] lg:min-h-[calc(100vh-158px)]">
          {step !== "resumo" ? (
            <>
              {currentImage ? (
                <img
                  key={`${step}-${step === "interior" ? interiorView : view}-${currentImage}`}
                  src={currentImage}
                  alt={vehicle.name}
                  className="builder-vw-image h-[58vh] w-full object-contain p-4 md:p-8 lg:h-[calc(100vh-158px)] lg:p-10"
                />
              ) : (
                <div className="flex h-[58vh] items-center justify-center text-sm font-black uppercase text-[#001e50]/40 lg:h-[calc(100vh-138px)]">
                  Sem imagem cadastrada
                </div>
              )}

              <div className="absolute bottom-5 left-1/2 flex max-w-[calc(100%-24px)] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-2xl bg-white/95 px-4 py-2 shadow lg:bottom-8 lg:rounded-full lg:px-5">
                {step === "interior"
                  ? ([
                      ["steeringWheel", "Volante"],
                      ["seat", "Banco"],
                    ] as [InteriorViewKey, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setInteriorView(key);
                          const ref = getInteriorReference(vehicle, key);
                          if (ref) setSelectedInterior(ref);
                        }}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          interiorView === key ? "bg-[#001e50] text-white" : "text-[#001e50]"
                        }`}
                      >
                        {label}
                      </button>
                    ))
                  : ([
                      ["front", "Frente"],
                      ["side", "Lateral"],
                      ["rear", "Traseira"],
                    ] as [ViewKey, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setView(key)}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                          view === key ? "bg-[#001e50] text-white" : "text-[#001e50]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
              </div>

              <div className="absolute bottom-8 right-8 hidden gap-2 rounded-md bg-white px-3 py-2 md:flex">
                <ImageIcon className="h-5 w-5" />
                <Car className="h-5 w-5" />
              </div>
            </>
          ) : (
            <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-10 xl:px-14">
              <div>
                {currentImage ? (
                  <img
                    src={currentImage}
                    alt={vehicle.name}
                    className="h-[260px] w-full rounded-2xl bg-[#f4f4f4] object-contain p-4 md:h-[430px]"
                  />
                ) : null}

                <p className="mt-3 text-[13px]">{vehicle.fullName}</p>

                <h1 className="mt-6 text-[36px] font-bold">Resumo</h1>

                <div className="mt-6 flex gap-8 overflow-x-auto border-b border-black/20 text-[14px]">
                  <button className="min-w-max border-b-2 border-[#001e50] pb-3">
                    Configuração selecionada
                  </button>
                  <button className="min-w-max pb-3">Equipamentos de série</button>
                  <button className="min-w-max pb-3">Dados técnicos</button>
                </div>

                <SummaryBox
                  title="1. Motor selecionado"
                  main={selectedMotor.name}
                  sub={selectedMotor.description}
                  right={`Preço ${money(total)} Preço Total`}
                  footer={`Potência ${selectedMotor.power}${selectedMotor.torque ? ` • Torque ${selectedMotor.torque}` : ""}`}
                />

                <SummaryBox
                  title="2. Exterior selecionado"
                  main={selectedColor.name}
                  sub={selectedColor.price === 0 ? "Sem custos adicionais" : money(selectedColor.price)}
                  right=""
                  footer={selectedColor.type}
                  color={selectedColor.hex}
                />

                <SummaryBox
                  title="3. Interior selecionado"
                  main={selectedInterior.name}
                  sub={
                    selectedInterior.price === 0
                      ? "Sem custos adicionais"
                      : money(selectedInterior.price)
                  }
                  right=""
                  footer={selectedInterior.description || ""}
                />
              </div>

              <div className="h-fit rounded-2xl bg-[#f3f3f3] p-6 shadow-sm lg:sticky lg:top-[112px] lg:p-8">
                <p className="text-center text-[13px] font-bold">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h2 className="mt-2 text-center text-[30px] font-bold">Resumo</h2>

                <div className="mt-8 border-b border-black/10 pb-5">
                  <div className="flex justify-between text-[14px]">
                    <span>Preço Total</span>
                    <strong>{money(total)}</strong>
                  </div>
                </div>

                <button className="mt-8 h-[46px] w-full rounded-full bg-[#001e50] text-[14px] font-bold text-white">
                  Tenho Interesse
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== "resumo" && (
          <aside className="border-l border-black/10 bg-white px-5 py-7 lg:max-h-[calc(100vh-158px)] lg:overflow-y-auto lg:px-8 xl:px-10">
            {step === "versoes" && (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-bold">{vehicle.name}</p>
                    <h1 className="text-[30px] font-bold leading-tight lg:text-[34px]">
                      {vehicle.versions.length} versões
                    </h1>
                  </div>
                  <button className="rounded-full border border-[#001e50] px-4 py-2 text-[13px]" type="button">
                    ≡ Filtros
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {vehicle.versions.map((version) => {
                    const active = selectedVersion.id === version.id;

                    return (
                      <button
                        key={version.id}
                        onClick={() => {
                          const nextMotor =
                            vehicle.motors.find((motor) => motor.versionId === version.id) ||
                            vehicle.motors[0];
                          const nextColor =
                            vehicle.colors.find((color) => color.versionId === version.id) ||
                            vehicle.colors[0];

                          setSelectedVersion(version);
                          if (nextMotor) setSelectedMotor(nextMotor);
                          if (nextColor) setSelectedColor(nextColor);
                        }}
                        className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="text-[18px] font-bold">{version.name}</h3>
                            <p className="mt-2 text-[13px]">{version.description}</p>
                          </div>
                          {active ? (
                            <Check className="h-5 w-5 shrink-0 rounded-full bg-[#159447] text-white" />
                          ) : (
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[12px]">
                              i
                            </span>
                          )}
                        </div>

                        <p className="mt-6 text-[12px] font-bold">
                          MOTORIZAÇÃO ({vehicle.motors.length} disponível)
                        </p>

                        <div className="mt-2 flex gap-2 text-[12px]">
                          <span className="bg-[#eef2f5] px-2 py-1">{version.fuel}</span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {version.transmission}
                          </span>
                        </div>

                        <strong className="mt-4 block">{money(version.price)}</strong>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === "motor" && (
              <>
                <p className="text-[14px]">{vehicle.fullName}</p>
                <p className="mt-8 text-[14px] font-bold">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h1 className="text-[34px] font-bold">{availableMotors.length} Motor</h1>

                <div className="mt-6 space-y-4">
                  {availableMotors.map((motor) => {
                    const active = selectedMotor.id === motor.id;

                    return (
                      <button
                        key={motor.id}
                        onClick={() => setSelectedMotor(motor)}
                        className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="text-[17px] font-bold">{motor.name}</h3>
                            <p className="mt-1">{motor.description}</p>
                          </div>

                          {active && (
                            <Check className="h-5 w-5 shrink-0 rounded-full bg-[#159447] text-white" />
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                          <span className="bg-[#eef2f5] px-2 py-1">{motor.fuel}</span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {motor.transmission}
                          </span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {motor.traction}
                          </span>
                        </div>

                        <div className="mt-5 border-t border-black/10 pt-4">
                          <p>Preço Total</p>
                          <strong>{money(total)}</strong>
                        </div>

                        <div className="mt-5 grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 text-sm">
                          <span>Potência</span>
                          <strong>{motor.power}</strong>
                          {motor.torque ? <span>Torque</span> : null}
                          {motor.torque ? <strong>{motor.torque}</strong> : null}
                          {motor.acceleration ? <span>Aceleração</span> : null}
                          {motor.acceleration ? <strong>{motor.acceleration}</strong> : null}
                          {motor.maxSpeed ? <span>Vel. máxima</span> : null}
                          {motor.maxSpeed ? <strong>{motor.maxSpeed}</strong> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === "cor" && (
              <>
                <p className="text-[14px]">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h1 className="text-[34px] font-bold">{availableColors.length} Exterior</h1>

                {Array.from(new Set(availableColors.map((item) => item.type || "Cores"))).map((type) => (
                  <div key={type} className="mt-8">
                    <p className="mb-3 text-[14px]">{type}</p>
                    <div className="flex flex-wrap gap-3">
                      {availableColors
                        .filter((color) => (color.type || "Cores") === type)
                        .map((color) => (
                          <ColorButton
                            key={color.id}
                            color={color}
                            active={selectedColor.id === color.id}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                    </div>
                  </div>
                ))}

                <div className="mt-8 rounded-2xl border border-[#159447] bg-[#f8fbf9] p-5 shadow-sm">
                  <h3 className="font-bold">{selectedColor.name}</h3>
                  <p className="mt-4 text-[13px] font-bold">
                    {selectedColor.price === 0
                      ? "Sem custos adicionais"
                      : money(selectedColor.price)}
                  </p>
                </div>
              </>
            )}

            {step === "interior" && (
              <>
                <p className="text-[14px]">
                  {vehicle.name}. {selectedVersion.name}
                </p>
                <h1 className="text-[34px] font-bold">{vehicle.interiors.length} Interior</h1>

                <p className="mt-8 text-[15px] font-bold">Referências internas</p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {([
                    ["steeringWheel", "Volante", "Cadastre uma imagem com nome contendo Volante"],
                    ["seat", "Banco", "Cadastre uma imagem com nome contendo Banco"],
                  ] as [InteriorViewKey, string, string][]).map(([key, label, hint]) => {
                    const ref = getInteriorReference(vehicle, key);
                    const active = interiorView === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setInteriorView(key);
                          if (ref) setSelectedInterior(ref);
                        }}
                        className={`overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:shadow-md ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                      >
                        {ref?.image ? (
                          <img
                            src={ref.image}
                            alt={label}
                            className="h-[135px] w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-[135px] items-center justify-center bg-[#f4f4f4] px-4 text-center text-xs font-black uppercase text-[#001e50]/40">
                            Sem imagem de {label}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 p-4">
                          <div>
                            <strong>{label}</strong>
                            <p className="mt-1 text-xs text-[#001e50]/70">
                              {ref?.name || hint}
                            </p>
                          </div>
                          {active && (
                            <Check className="h-5 w-5 shrink-0 rounded-full bg-[#159447] text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="mt-8 text-[15px] font-bold">Outros acabamentos internos</p>

                <div className="mt-4 space-y-4">
                  {vehicle.interiors.map((interior) => {
                    const active = selectedInterior.id === interior.id;

                    return (
                      <button
                        key={interior.id}
                        onClick={() => setSelectedInterior(interior)}
                        className={`w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:shadow-md ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                        type="button"
                      >
                        {interior.image ? (
                          <img
                            src={interior.image}
                            alt={interior.name}
                            className="h-[170px] w-full object-cover"
                          />
                        ) : null}

                        <div className="flex items-center justify-between gap-4 p-4">
                          <div>
                            <strong>{interior.name}</strong>
                            {interior.description ? (
                              <p className="mt-1 text-xs text-[#001e50]/70">{interior.description}</p>
                            ) : null}
                          </div>
                          {active && (
                            <Check className="h-5 w-5 shrink-0 rounded-full bg-[#159447] text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </aside>
        )}
      </section>

      {step !== "resumo" && (
        <div className="fixed bottom-0 left-0 z-[90] flex min-h-[64px] w-full items-center justify-between gap-4 border-t border-black/10 bg-white px-4 py-2 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] md:px-[76px]">
          <div>
            <p className="text-[12px]">Preço Total</p>
            <strong>{money(total)}</strong>
          </div>

          <button
            onClick={goNext}
            className="flex h-[44px] shrink-0 items-center gap-2 rounded-full bg-[#0055d8] px-5 text-[14px] font-bold text-white shadow-lg transition hover:bg-[#0044ad] md:px-8"
            type="button"
          >
            {nextLabel}
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <a
        href="#"
        className="fixed bottom-[78px] left-3 z-[100] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#22d366] text-white shadow-xl lg:bottom-[82px]"
      >
        <MessageCircle className="h-7 w-7" />
      </a>

      <style jsx global>{`
        .builder-vw-image {
          animation: builderVwImage 0.35s ease-out;
        }

        @keyframes builderVwImage {
          from {
            opacity: 0;
            transform: scale(1.01);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </main>
  );
}

function ColorButton({
  color,
  active,
  onClick,
}: {
  color: Color;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-[64px] w-[64px] items-center justify-center rounded-full border-2 transition hover:scale-105 ${
        active ? "border-[#159447]" : "border-black/20"
      }`}
      title={color.name}
      type="button"
    >
      <span
        className="h-[52px] w-[52px] rounded-full border border-black/10"
        style={{ background: color.hex }}
      />
      {active && (
        <Check className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-[#159447] text-white" />
      )}
    </button>
  );
}

function SummaryBox({
  title,
  main,
  sub,
  right,
  footer,
  color,
}: {
  title: string;
  main: string;
  sub: string;
  right: string;
  footer: string;
  color?: string;
}) {
  return (
    <div className="mt-8">
      <h3 className="mb-3 text-[17px] font-bold">{title}</h3>

      <div className="rounded-2xl border border-[#159447] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <strong>{main}</strong>
            <p className="mt-2 text-[14px]">{sub}</p>
          </div>

          {color ? (
            <span
              className="h-[58px] w-[58px] shrink-0 rounded-full border border-black/20"
              style={{ background: color }}
            />
          ) : (
            <strong>{right}</strong>
          )}
        </div>

        {footer && (
          <div className="mt-5 border-t border-black/10 pt-4 text-[14px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
