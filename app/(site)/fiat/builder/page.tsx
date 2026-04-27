"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  Info,
  Menu,
  MapPin,
  MessageCircle,
  User,
} from "lucide-react";

type BuilderStep = 1 | 2 | 3 | 4 | 5;

type Version = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

type OptionItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  hex?: string;
  swatch?: string;
};

type VehicleBuilderConfig = {
  slug: string;
  name: string;
  title: string;
  description: string;
  mainImage: string;
  versions: Version[];
  colors: OptionItem[];
  kits: OptionItem[];
  accessories: OptionItem[];
};

type VehicleDbRow = {
  slug: string;
  model_name: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  versions?: Version[] | null;
  colors?: OptionItem[] | null;
  kits?: OptionItem[] | null;
  accessories?: OptionItem[] | null;
};

const FIAT_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/logo_header_hub_fiat_02.svg",
  footerLogo:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/logo_footer_hub_fiat.svg",

  fastback: "COLE_AQUI_IMAGEM_FASTBACK_GRANDE",
  fastbackThumb: "COLE_AQUI_IMAGEM_FASTBACK_THUMB",

  pulse: "COLE_AQUI_IMAGEM_PULSE_GRANDE",
  pulseThumb: "COLE_AQUI_IMAGEM_PULSE_THUMB",

  colorBlack: "COLE_AQUI_IMG_COR_PRETO",
  colorWhite: "COLE_AQUI_IMG_COR_BRANCO",
  colorSilver: "COLE_AQUI_IMG_COR_CINZA",
  colorBlue: "COLE_AQUI_IMG_COR_AZUL",

  kitLeather: "COLE_AQUI_IMG_BANCOS_COURO",
  kitConnect: "COLE_AQUI_IMG_CONNECT_ME",
  kitSunroof: "COLE_AQUI_IMG_SUNROOF",

  accMat: "COLE_AQUI_IMG_TAPETE",
  accFilm: "COLE_AQUI_IMG_PELICULA",
  accProtection: "COLE_AQUI_IMG_PROTECAO",
};

const vehiclesBuilderConfig: Record<string, VehicleBuilderConfig> = {
  "fastback-hybrid": {
    slug: "fastback-hybrid",
    name: "Fastback",
    title: "Monte o seu Fastback",
    description:
      "SUV coupé da Fiat com design esportivo, tecnologia, conforto e versões pensadas para quem busca presença e performance.",
    mainImage: FIAT_IMAGES.fastback,
    versions: [
      {
        id: "fastback-turbo-200-flex-at-2026",
        name: "Fastback Turbo 200 Flex AT 2026",
        description:
          "Versão de entrada com motor Turbo 200, câmbio automático e ótimo equilíbrio entre desempenho e custo.",
        price: 119990,
        image: FIAT_IMAGES.fastbackThumb,
      },
      {
        id: "fastback-audace-turbo-200-hybrid-flex-at-2026",
        name: "Fastback Audace Turbo 200 Hybrid Flex AT 2026",
        description:
          "Versão híbrida com mais tecnologia, eficiência e visual refinado para uso urbano e estrada.",
        price: 167490,
        image: FIAT_IMAGES.fastbackThumb,
      },
      {
        id: "fastback-impetus-turbo-200-hybrid-flex-at-2026",
        name: "Fastback Impetus Turbo 200 Hybrid Flex AT 2026",
        description:
          "Versão mais completa da linha híbrida, com pacote superior de conforto, segurança e acabamento.",
        price: 173490,
        image: FIAT_IMAGES.fastbackThumb,
      },
      {
        id: "fastback-limited-edition-turbo-270-flex-at-2026",
        name: "Fastback Limited Edition Turbo 270 Flex AT 2026",
        description:
          "Configuração especial com motor Turbo 270, visual exclusivo e desempenho mais forte.",
        price: 177990,
        image: FIAT_IMAGES.fastbackThumb,
      },
      {
        id: "fastback-abarth-turbo-270-flex-at-2026",
        name: "Fastback Abarth Turbo 270 Flex AT 2026",
        description:
          "Versão esportiva com DNA Abarth, motor Turbo 270, visual agressivo e pegada de performance.",
        price: 183990,
        image: FIAT_IMAGES.fastbackThumb,
      },
    ],
    colors: [
      {
        id: "preto-vulcano",
        name: "Preto Vulcano",
        description: "Cor sólida clássica, elegante e esportiva.",
        category: "Sólidas",
        price: 0,
        image: FIAT_IMAGES.colorBlack,
        hex: "#111111",
      },
      {
        id: "branco-banchisa",
        name: "Branco Banchisa com teto preto Vulcano",
        description: "Combinação contrastante com teto preto para visual mais moderno.",
        category: "Sólidas",
        price: 990,
        image: FIAT_IMAGES.colorWhite,
        hex: "#f5f5f5",
      },
      {
        id: "cinza-silverstone",
        name: "Cinza Silverstone com teto preto Vulcano",
        description: "Tom metálico sofisticado com teto preto para presença mais premium.",
        category: "Metálicas",
        price: 1990,
        image: FIAT_IMAGES.colorSilver,
        hex: "#8b8f93",
      },
      {
        id: "azul-amalfi",
        name: "Azul Amalfi com teto preto Vulcano",
        description: "Cor metálica marcante para destacar o design do Fastback.",
        category: "Metálicas",
        price: 1990,
        image: FIAT_IMAGES.colorBlue,
        hex: "#123d70",
      },
    ],
    kits: [
      {
        id: "bancos-couro",
        name: "Bancos em couro",
        description: "Acabamento interno mais sofisticado e confortável.",
        price: 1340,
        image: FIAT_IMAGES.kitLeather,
      },
      {
        id: "connect-me-sensor",
        name: "Connect Me & Sensor de ponto cego",
        description: "Pacote de conectividade e segurança para facilitar sua rotina.",
        price: 3990,
        image: FIAT_IMAGES.kitConnect,
      },
      {
        id: "pack-sunroof",
        name: "Pack Sunroof",
        description: "Teto solar para uma experiência mais premium e iluminada.",
        price: 4990,
        image: FIAT_IMAGES.kitSunroof,
      },
    ],
    accessories: [
      {
        id: "tapetes",
        name: "Tapetes de borracha",
        description: "Proteção extra para o interior do veículo.",
        price: 390,
        image: FIAT_IMAGES.accMat,
      },
      {
        id: "pelicula",
        name: "Película de proteção solar",
        description: "Mais conforto térmico e privacidade para os ocupantes.",
        price: 590,
        image: FIAT_IMAGES.accFilm,
      },
      {
        id: "protecao-pintura",
        name: "Proteção de pintura",
        description: "Ajuda a preservar o brilho e a aparência da pintura.",
        price: 890,
        image: FIAT_IMAGES.accProtection,
      },
    ],
  },

  "pulse-hybrid": {
    slug: "pulse-hybrid",
    name: "Pulse",
    title: "Monte o seu Pulse",
    description:
      "SUV compacto da Fiat com visual moderno, economia, tecnologia e ótimo aproveitamento para o dia a dia.",
    mainImage: FIAT_IMAGES.pulse,
    versions: [
      {
        id: "pulse-drive-2026",
        name: "Pulse Drive 1.3 Flex AT 2026",
        description:
          "Versão versátil e econômica, ideal para quem busca conforto e praticidade.",
        price: 109990,
        image: FIAT_IMAGES.pulseThumb,
      },
      {
        id: "pulse-audace-hybrid-2026",
        name: "Pulse Audace Hybrid AT 2026",
        description:
          "Versão híbrida com mais tecnologia, eficiência e acabamento superior.",
        price: 129990,
        image: FIAT_IMAGES.pulseThumb,
      },
    ],
    colors: [
      {
        id: "preto-vulcano",
        name: "Preto Vulcano",
        description: "Cor escura com aparência esportiva e elegante.",
        category: "Sólidas",
        price: 0,
        image: FIAT_IMAGES.colorBlack,
        hex: "#111111",
      },
      {
        id: "branco-banchisa",
        name: "Branco Banchisa",
        description: "Visual limpo, moderno e de fácil valorização.",
        category: "Sólidas",
        price: 990,
        image: FIAT_IMAGES.colorWhite,
        hex: "#f5f5f5",
      },
      {
        id: "cinza-silverstone",
        name: "Cinza Silverstone",
        description: "Tom metálico discreto e sofisticado.",
        category: "Metálicas",
        price: 1990,
        image: FIAT_IMAGES.colorSilver,
        hex: "#8b8f93",
      },
    ],
    kits: [
      {
        id: "connect-me",
        name: "Fiat Connect Me",
        description: "Serviços conectados para acompanhar informações do veículo.",
        price: 2490,
        image: FIAT_IMAGES.kitConnect,
      },
      {
        id: "bancos-couro",
        name: "Bancos em couro",
        description: "Mais conforto e acabamento premium para o interior.",
        price: 1340,
        image: FIAT_IMAGES.kitLeather,
      },
    ],
    accessories: [
      {
        id: "tapetes",
        name: "Tapetes de borracha",
        description: "Protege o assoalho e facilita a limpeza.",
        price: 390,
        image: FIAT_IMAGES.accMat,
      },
      {
        id: "pelicula",
        name: "Película de proteção solar",
        description: "Ajuda no conforto térmico e privacidade.",
        price: 590,
        image: FIAT_IMAGES.accFilm,
      },
    ],
  },
};

function money(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function normalizeOption(item: OptionItem): OptionItem {
  return {
    ...item,
    description: item.description || "",
    price: Number(item.price || 0),
    image: item.image || "",
    hex: item.hex || item.swatch || "#111111",
  };
}

function normalizeVehicleFromDb(data: VehicleDbRow): VehicleBuilderConfig {
  return {
    slug: data.slug,
    name: data.model_name,
    title: data.title || `Monte o seu ${data.model_name}`,
    description: data.description || "",
    mainImage: data.image_url || "",
    versions: Array.isArray(data.versions)
      ? data.versions.map((item) => ({
          ...item,
          description: item.description || "",
          price: Number(item.price || 0),
          image: item.image || "",
        }))
      : [],
    colors: Array.isArray(data.colors) ? data.colors.map(normalizeOption) : [],
    kits: Array.isArray(data.kits) ? data.kits.map(normalizeOption) : [],
    accessories: Array.isArray(data.accessories)
      ? data.accessories.map(normalizeOption)
      : [],
  };
}

export default function FiatBuilderPage() {
  const searchParams = useSearchParams();
  const vehicleSlug = searchParams.get("vehicle") || "fastback-hybrid";

  const fallbackVehicle =
    vehiclesBuilderConfig[vehicleSlug] || vehiclesBuilderConfig["fastback-hybrid"];

  const [currentVehicle, setCurrentVehicle] =
    useState<VehicleBuilderConfig>(fallbackVehicle);

  const [step, setStep] = useState<BuilderStep>(1);
  const [selectedVersion, setSelectedVersion] = useState<Version>(
    fallbackVehicle.versions[0]
  );
  const [selectedColor, setSelectedColor] = useState<OptionItem>(
    fallbackVehicle.colors[0]
  );
  const [selectedKits, setSelectedKits] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);

  useEffect(() => {
    async function loadVehicle() {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "slug, model_name, title, description, image_url, versions, colors, kits, accessories"
        )
        .eq("brand", "fiat")
        .eq("slug", vehicleSlug)
        .eq("is_visible", true)
        .maybeSingle();

      if (error || !data) {
        setCurrentVehicle(fallbackVehicle);
        return;
      }

      setCurrentVehicle(normalizeVehicleFromDb(data as VehicleDbRow));
    }

    loadVehicle();
  }, [vehicleSlug]);

  useEffect(() => {
    const firstVersion = currentVehicle.versions?.[0];
    const firstColor = currentVehicle.colors?.[0];

    if (firstVersion) setSelectedVersion(firstVersion);
    if (firstColor) setSelectedColor(firstColor);

    setSelectedKits([]);
    setSelectedAccessories([]);
    setStep(1);
  }, [currentVehicle]);

  if (
    !currentVehicle ||
    !currentVehicle.versions?.length ||
    !currentVehicle.colors?.length
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f1f0e8] p-6 text-center">
        <div>
          <h1 className="text-2xl font-black uppercase">Veículo incompleto</h1>
          <p className="mt-2 text-sm">
            Cadastre pelo menos uma versão e uma cor para esse veículo aparecer no builder.
          </p>
        </div>
      </main>
    );
  }

  const versions = currentVehicle.versions;
  const colors = currentVehicle.colors;
  const kits = currentVehicle.kits || [];
  const accessories = currentVehicle.accessories || [];

  const selectedKitItems = kits.filter((item) => selectedKits.includes(item.id));
  const selectedAccessoryItems = accessories.filter((item) =>
    selectedAccessories.includes(item.id)
  );

  const kitsTotal = selectedKitItems.reduce((sum, item) => sum + item.price, 0);
  const accessoriesTotal = selectedAccessoryItems.reduce(
    (sum, item) => sum + item.price,
    0
  );

  const total =
    selectedVersion.price + selectedColor.price + kitsTotal + accessoriesTotal;

  const monthly = total / 108;

  const mainCarImage =
    selectedColor.image || selectedVersion.image || currentVehicle.mainImage;

  const toggleKit = (id: string) => {
    setSelectedKits((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const toggleAccessory = (id: string) => {
    setSelectedAccessories((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const goNext = () => {
    setStep((current) => (current < 5 ? ((current + 1) as BuilderStep) : current));
  };

  const stepTitle =
    step === 1
      ? "Versão"
      : step === 2
      ? "Cor"
      : step === 3
      ? "Kit Opcionais"
      : step === 4
      ? "Acessórios"
      : "Resumo";

  const stepSubtitle =
    step === 1
      ? "1. Escolha uma"
      : step === 2
      ? "2. Escolha uma"
      : step === 3
      ? "3. Escolha os"
      : step === 4
      ? "4. Escolha os"
      : "5. Confira o";  return (
    <main className="min-h-screen bg-[#f1f0e8] text-black">
      <header className="sticky top-0 z-50 h-[48px] bg-black text-white">
        <div className="flex h-full items-center justify-between px-5">
          <img src={FIAT_IMAGES.logo} alt="Fiat" className="h-[26px] w-auto" />

          <div className="flex h-full items-center">
            <button className="flex h-full min-w-[70px] flex-col items-center justify-center text-white">
              <MapPin className="h-4 w-4" />
              <span className="mt-0.5 text-[8px] font-bold uppercase">Belém - PA</span>
            </button>

            <button className="flex h-full min-w-[60px] flex-col items-center justify-center border-l border-white/20 text-white">
              <User className="h-4 w-4" />
              <span className="mt-0.5 text-[8px] font-bold uppercase">Fiat ID</span>
            </button>

            <button className="flex h-full min-w-[60px] flex-col items-center justify-center border-l border-white/20 text-white">
              <Menu className="h-4 w-4" />
              <span className="mt-0.5 text-[8px] font-bold uppercase">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <section className="grid min-h-[calc(100vh-48px)] grid-cols-1 lg:grid-cols-[170px_315px_1fr]">
        <aside className="relative hidden border-r border-black/20 bg-[#f1f0e8] p-6 lg:block">
          <h1 className="text-[18px] font-black uppercase leading-tight">
            Monte o
            <br />
            seu
            <br />
            {currentVehicle.name}
          </h1>

          <nav className="mt-12 space-y-4 text-[14px]">
            {[1, 2, 3, 4, 5].map((item) => (
              <button
                key={item}
                onClick={() => setStep(item as BuilderStep)}
                className={`block w-full border-b border-black/50 pb-2 text-left ${
                  step === item ? "font-bold" : ""
                }`}
              >
                {step >= item && <span className="text-green-600">✓ </span>}
                {item}.{" "}
                {item === 1
                  ? "Versão"
                  : item === 2
                  ? "Cor"
                  : item === 3
                  ? "Kit Opcionais"
                  : item === 4
                  ? "Acessórios"
                  : "Resumo"}
              </button>
            ))}
          </nav>

          <img
            src={FIAT_IMAGES.footerLogo}
            alt="Fiat"
            className="absolute bottom-8 h-[48px] w-auto"
          />
        </aside>

        <aside className="border-r border-black/10 bg-[#f1f0e8] px-5 py-6">
          <div className="mb-5">
            <span className="text-[13px]">{stepSubtitle}</span>
            <h2 className="text-[32px] font-black uppercase leading-none">
              {stepTitle}
            </h2>
          </div>

          <div className="max-h-[calc(100vh-180px)] space-y-4 overflow-y-auto pr-1 builder-panel-enter">
            {step === 1 &&
              versions.map((version) => {
                const active = selectedVersion.id === version.id;

                return (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    className={`flex w-full gap-3 rounded-[3px] border-2 p-3 text-left transition-all duration-300 ${
                      active
                        ? "border-[#269f6b] bg-[#9edfe4]"
                        : "border-transparent bg-[#9edfe4] hover:scale-[1.015]"
                    }`}
                  >
                    <Radio active={active} />

                    <img
                      src={version.image || currentVehicle.mainImage}
                      alt={version.name}
                      className="h-[70px] w-[105px] object-contain"
                    />

                    <div className="flex-1">
                      <h3 className="text-[14px] font-black uppercase leading-tight">
                        {version.name}
                      </h3>
                      <p className="mt-1 text-[13px]">{money(version.price)}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-tight">
                        {version.description}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold underline">
                        <Info className="h-3.5 w-3.5" /> Mais detalhes
                      </span>
                    </div>
                  </button>
                );
              })}

            {step === 2 && (
              <div className="space-y-5">
                <div className="rounded-[3px] bg-[#9edfe4] p-4">
                  <p className="text-[12px] uppercase">{selectedColor.category}</p>
                  <h3 className="mt-1 text-[17px] font-black uppercase leading-tight">
                    {selectedColor.name}
                  </h3>
                  <p className="mt-1 text-[14px] font-bold">
                    {selectedColor.price > 0 ? money(selectedColor.price) : "Incluso"}
                  </p>
                  <p className="mt-2 text-[12px] leading-tight text-black/70">
                    {selectedColor.description}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {colors.map((color) => {
                    const active = selectedColor.id === color.id;
                    const colorHex = color.hex || color.swatch || "#111111";

                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className="flex flex-col items-center gap-2 text-center"
                        title={color.name}
                      >
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                            active
                              ? "border-[#269f6b] shadow-[0_0_0_4px_rgba(38,159,107,0.18)]"
                              : "border-black/20 hover:border-black"
                          }`}
                        >
                          <span
                            className="h-9 w-9 rounded-full border border-black/15"
                            style={{ background: colorHex }}
                          />
                        </span>

                        <span className="line-clamp-2 text-[10px] font-bold uppercase leading-tight">
                          {color.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 &&
              kits.map((kit) => {
                const active = selectedKits.includes(kit.id);

                return (
                  <button
                    key={kit.id}
                    onClick={() => toggleKit(kit.id)}
                    className={`flex w-full overflow-hidden rounded-[3px] border-2 bg-[#9edfe4] text-left transition-all duration-300 ${
                      active
                        ? "border-[#269f6b]"
                        : "border-transparent hover:scale-[1.015]"
                    }`}
                  >
                    <div className="relative w-[135px] shrink-0">
                      <img
                        src={kit.image}
                        alt={kit.name}
                        className="h-full min-h-[110px] w-full object-cover"
                      />
                      <div className="absolute left-2 top-2">
                        <Radio active={active} />
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="text-[15px] font-black uppercase leading-tight">
                        {kit.name}
                      </h3>
                      <p className="mt-1 text-[13px]">{money(kit.price)}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-tight">
                        {kit.description}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold underline">
                        <Info className="h-3.5 w-3.5" /> Mais detalhes
                      </span>
                    </div>
                  </button>
                );
              })}

            {step === 4 &&
              accessories.map((accessory) => {
                const active = selectedAccessories.includes(accessory.id);

                return (
                  <button
                    key={accessory.id}
                    onClick={() => toggleAccessory(accessory.id)}
                    className={`flex w-full overflow-hidden rounded-[3px] border-2 bg-[#9edfe4] text-left transition-all duration-300 ${
                      active
                        ? "border-[#269f6b]"
                        : "border-transparent hover:scale-[1.015]"
                    }`}
                  >
                    <div className="relative w-[135px] shrink-0">
                      <img
                        src={accessory.image}
                        alt={accessory.name}
                        className="h-full min-h-[110px] w-full object-cover"
                      />
                      <div className="absolute left-2 top-2">
                        <Radio active={active} />
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="text-[15px] font-black uppercase leading-tight">
                        {accessory.name}
                      </h3>
                      <p className="mt-1 text-[13px]">{money(accessory.price)}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-tight">
                        {accessory.description}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold underline">
                        <Info className="h-3.5 w-3.5" /> Mais detalhes
                      </span>
                    </div>
                  </button>
                );
              })}

            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h3 className="border-b border-black pb-1 text-[15px] font-black uppercase">
                    Total
                  </h3>

                  <SummaryLine label="Valor do carro" value={money(selectedVersion.price)} />
                  <SummaryLine label="Cor" value={`+ ${money(selectedColor.price)}`} />
                  <SummaryLine label="Kit opcionais" value={`+ ${money(kitsTotal)}`} />
                  <SummaryLine label="Acessórios" value={`+ ${money(accessoriesTotal)}`} />

                  <div className="mt-2 flex justify-between border-t border-black pt-2 text-[15px] font-black uppercase">
                    <span>Valor total</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 border-b border-black pb-1 text-[15px] font-black uppercase">
                    Itens selecionados
                  </h3>

                  <SummarySelected
                    image={selectedVersion.image || currentVehicle.mainImage}
                    title={selectedVersion.name}
                    description={selectedVersion.description}
                    value={money(selectedVersion.price)}
                  />

                  <SummarySelected
                    image={selectedColor.image}
                    title={selectedColor.name}
                    description={selectedColor.description}
                    value={money(selectedColor.price)}
                  />

                  {selectedKitItems.map((item) => (
                    <SummarySelected
                      key={item.id}
                      image={item.image}
                      title={item.name}
                      description={item.description}
                      value={money(item.price)}
                    />
                  ))}

                  {selectedAccessoryItems.map((item) => (
                    <SummarySelected
                      key={item.id}
                      image={item.image}
                      title={item.name}
                      description={item.description}
                      value={money(item.price)}
                    />
                  ))}
                </div>

                <div>
                  <h3 className="border-b border-black pb-1 text-[15px] font-black uppercase">
                    Serviços Mopar
                  </h3>
                  <p className="mt-2 text-[13px]">
                    Confira os pacotes de serviços para mais proteção no seu Fiat.
                  </p>

                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between bg-white p-3 text-[13px] font-black uppercase">
                      Pacotes de manutenção <span>✓</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-3 text-[13px] font-black uppercase">
                      Garantia adicional <span>✓</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={goNext}
            className="mt-6 flex h-[48px] w-full items-center justify-between bg-[#ff1435] px-5 text-[14px] font-black uppercase text-white transition hover:bg-[#e80f30]"
          >
            {step === 1
              ? "Próximo: Cor"
              : step === 2
              ? "Próximo: Kit Opcionais"
              : step === 3
              ? "Próximo: Acessórios"
              : step === 4
              ? "Próximo: Resumo"
              : "Concluir"}
            <ChevronRight className="h-5 w-5" />
          </button>
        </aside>

        <section className="relative overflow-hidden bg-[#f1f0e8] px-6 py-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[13px]">Seu carro</span>
              <h2 className="text-[26px] font-black uppercase leading-tight md:text-[34px]">
                {selectedVersion.name}
              </h2>
            </div>

            <div className="hidden text-right md:block">
              <p className="text-[13px] font-bold">Valor Total</p>
              <p className="text-[22px] font-black">{money(total)}</p>
              <p className="mt-4 text-[13px] font-bold">a partir de</p>
              <p className="text-[18px] font-black text-[#ff1435]">
                {money(monthly)} / mês
              </p>
              <button className="mt-1 text-[13px] font-black text-[#ff1435] underline">
                Simule as parcelas
              </button>
            </div>
          </div>

          <button className="absolute right-10 top-[220px] z-20 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#ff1435] text-center text-[11px] font-black uppercase text-white">
            Ver
            <br />
            360º
          </button>

          <div className="mt-10 flex min-h-[520px] items-center justify-center">
            <div className="relative w-full max-w-[1320px]">
              <div className="absolute left-[5%] top-[13%] z-0 text-[110px] font-light text-black/80">
                5
                <span className="ml-4 inline-block align-middle text-[26px] font-black uppercase leading-tight">
                  Anos
                  <br />
                  líder de
                  <br />
                  vendas
                </span>
              </div>

              <div className="absolute bottom-[8%] left-0 right-0 h-[330px] bg-[#ffbc16]" />

              <img
                key={`${selectedVersion.id}-${selectedColor.id}-${step}`}
                src={mainCarImage}
                alt={selectedVersion.name}
                className="builder-car-enter relative z-10 mx-auto w-full max-w-[1180px] object-contain"
              />
            </div>
          </div>

          <div className="mx-auto mt-2 max-w-[860px] text-center">
            <p className="text-[14px] font-semibold leading-6 text-black/70">
              {currentVehicle.description}
            </p>

            {step === 2 && (
              <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-sm">
                <span
                  className="h-7 w-7 rounded-full border border-black/15"
                  style={{
                    background: selectedColor.hex || selectedColor.swatch || "#111111",
                  }}
                />
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase text-black/45">
                    Cor selecionada
                  </p>
                  <p className="text-[13px] font-black uppercase">
                    {selectedColor.name}
                  </p>
                </div>
              </div>
            )}
          </div>

          <a
            href="#"
            className="fixed bottom-5 right-5 z-50 flex h-[58px] items-center gap-2 rounded-full bg-white px-5 text-[13px] font-bold text-[#15995f] shadow-xl"
          >
            <MessageCircle className="h-5 w-5" />
            Quero negociar
          </a>
        </section>
      </section>

      <style jsx global>{`
        .builder-car-enter {
          animation: builderCarEnter 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .builder-panel-enter {
          animation: builderPanelEnter 0.35s ease-out;
        }

        @keyframes builderCarEnter {
          from {
            opacity: 0;
            transform: translateX(28px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        @keyframes builderPanelEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}

function Radio({ active }: { active: boolean }) {
  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
        active ? "border-[#269f6b] bg-[#269f6b] text-white" : "border-black bg-white"
      }`}
    >
      {active && <Check className="h-5 w-5" />}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-black/30 py-1 text-[13px]">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SummarySelected({
  image,
  title,
  description,
  value,
}: {
  image: string;
  title: string;
  description: string;
  value: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-3 border-b border-black/20 pb-3">
      <img src={image} alt={title} className="h-[52px] w-[64px] object-cover" />
      <div className="flex-1">
        <div className="text-[12px] font-bold uppercase leading-tight">{title}</div>
        <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-black/65">
          {description}
        </div>
      </div>
      <div className="text-[12px] font-bold">{value}</div>
    </div>
  );
}