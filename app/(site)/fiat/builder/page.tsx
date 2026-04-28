"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronRight,
  Info,
  Menu,
  AlertCircle,
  UserRound,
  MapPin,
  MessageCircle,
  Save,
  UploadCloud,
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
  versionId?: string;
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
  id?: number;
  slug: string;
  model_name: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  catalog_cover_url?: string | null;
  price_start?: number | null;
  versions?: Version[] | null;
  colors?: OptionItem[] | null;
  kits?: OptionItem[] | null;
  accessories?: OptionItem[] | null;
};

type ContractOrderPayload = {
  source: "fiat_builder";
  status: "pendente_analise";
  brand: "fiat";
  vehicle_slug: string;
  vehicle_name: string;
  vehicle_title: string;
  vehicle_description: string;
  vehicle_image: string;
  client: {
    name: string;
    cpf: string;
    email: string;
    phone: string;
  };
  seller: {
    name: string;
    id?: string | null;
    email?: string | null;
  };
  version: {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
  };
  color: {
    id: string;
    name: string;
    description: string;
    category?: string;
    price: number;
    image: string;
    hex?: string;
    versionId?: string;
  } | null;
  kits: OptionItem[];
  accessories: OptionItem[];
  totals: {
    vehicle: number;
    color: number;
    kits: number;
    accessories: number;
    total: number;
    monthly_108: number;
  };
  created_at: string;
};

const BUCKET_NAME = "cars";

const ORDER_TABLE_NAME = "contract_orders";
const ANALYSIS_ROUTE = "/vendedor/analise";

const FIAT_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/logo_header_hub_fiat_02.svg",
  footerLogo:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/Screenshot_13.jpg",

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


const PHONE_PREFIX_DISPLAY = "+55 ";
const DEFAULT_DDD = "91";

const onlyDigits = (value: string) => String(value || "").replace(/\D/g, "");

const maskCPF = (value: string) => {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeSellerName = (value: string) =>
  String(value || "").replace(/\s+/g, " ").trim().toUpperCase();

const toE164Digits = (displayPhone: string) => {
  const digits = onlyDigits(displayPhone);

  if (digits.startsWith("55")) {
    const national = digits.slice(2);
    if (national.length === 10 || national.length === 11) return `55${national}`;
    if ((national.length === 8 || national.length === 9) && DEFAULT_DDD) {
      return `55${DEFAULT_DDD}${national}`;
    }
    return null;
  }

  if (digits.length === 10 || digits.length === 11) return `55${digits}`;

  if ((digits.length === 8 || digits.length === 9) && DEFAULT_DDD) {
    return `55${DEFAULT_DDD}${digits}`;
  }

  return null;
};

const formatPhoneInput = (value: string) => {
  let digits = onlyDigits(value);
  if (digits.startsWith("55")) digits = digits.slice(2);
  digits = digits.slice(0, 11);

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (!digits) return PHONE_PREFIX_DISPLAY;
  if (digits.length <= 2) return `${PHONE_PREFIX_DISPLAY}(${ddd}`;
  if (number.length <= 5) return `${PHONE_PREFIX_DISPLAY}(${ddd}) ${number}`;
  return `${PHONE_PREFIX_DISPLAY}(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
};

type CustomerErrors = {
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  clientPhone: string;
  sellerName: string;
};

const emptyCustomerErrors: CustomerErrors = {
  clientName: "",
  clientCpf: "",
  clientEmail: "",
  clientPhone: "",
  sellerName: "",
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
    versionId: item.versionId || "",
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


function getColorsForVersion(colors: OptionItem[], versionId?: string) {
  if (!versionId) return [];
  return colors.filter((color) => color.versionId === versionId);
}

function getFirstColorForVersion(colors: OptionItem[], versionId?: string) {
  return getColorsForVersion(colors, versionId)[0] || null;
}

function fileExt(name: string) {
  const parts = String(name || "").split(".");
  return (parts[parts.length - 1] || "png").toLowerCase();
}

async function uploadImageToSupabase(file: File, folder: string) {
  const ext = fileExt(file.name);
  const safeFolder = String(folder || "uploads").replace(/[^a-z0-9/_-]/gi, "");
  const path = `${safeFolder}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/*",
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  const url = data?.publicUrl || "";

  if (!url) throw new Error("Não foi possível gerar URL pública da imagem.");
  return url;
}

export default function FiatBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const vehicleSlug = searchParams.get("vehicle") || "fastback-hybrid";
  const editMode = searchParams.get("edit") === "true";

  const fallbackVehicle =
    vehiclesBuilderConfig[vehicleSlug] || vehiclesBuilderConfig["fastback-hybrid"];

  const [currentVehicle, setCurrentVehicle] =
    useState<VehicleBuilderConfig>(fallbackVehicle);

  const [dbId, setDbId] = useState<number | null>(null);
  const [step, setStep] = useState<BuilderStep>(1);
  const [selectedVersion, setSelectedVersion] = useState<Version>(
    fallbackVehicle.versions[0]
  );
  const [selectedColor, setSelectedColor] = useState<OptionItem | null>(
    fallbackVehicle.colors.find((color) => color.versionId === fallbackVehicle.versions[0]?.id) ||
      fallbackVehicle.colors[0] ||
      null
  );
  const [selectedKits, setSelectedKits] = useState<string[]>([]);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState(PHONE_PREFIX_DISPLAY);
  const [sellerName, setSellerName] = useState("");
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>(emptyCustomerErrors);

  useEffect(() => {
    async function loadLoggedUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setLoggedUser(user || null);

        const email = String(user?.email || "").trim().toLowerCase();
        if (email && !sellerName) {
          const beforeAt = email.split("@")[0] || "";
          setSellerName(beforeAt ? beforeAt.toUpperCase() : email.toUpperCase());
        }
      } catch {
        setLoggedUser(null);
      }
    }

    loadLoggedUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadVehicle() {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "id, slug, model_name, title, description, image_url, catalog_cover_url, price_start, versions, colors, kits, accessories"
        )
        .eq("brand", "fiat")
        .eq("slug", vehicleSlug)
        .eq("is_visible", true)
        .maybeSingle();

      if (error || !data) {
        setDbId(null);
        setCurrentVehicle(fallbackVehicle);
        return;
      }

      const row = data as VehicleDbRow;
      setDbId(row.id || null);
      setCurrentVehicle(normalizeVehicleFromDb(row));
    }

    loadVehicle();
  }, [vehicleSlug]);

  useEffect(() => {
    const firstVersion = currentVehicle.versions?.[0];

    if (firstVersion) {
      setSelectedVersion(firstVersion);
      setSelectedColor(getFirstColorForVersion(currentVehicle.colors || [], firstVersion.id));
    }

    setSelectedKits([]);
    setSelectedAccessories([]);
    setStep(1);
  }, [currentVehicle.slug]);

  useEffect(() => {
    if (!selectedVersion?.id) return;

    const versionColors = getColorsForVersion(currentVehicle.colors || [], selectedVersion.id);
    const selectedColorStillBelongsToVersion =
      selectedColor?.versionId === selectedVersion.id &&
      versionColors.some((color) => color.id === selectedColor.id);

    if (!selectedColorStillBelongsToVersion) {
      setSelectedColor(versionColors[0] || null);
    }
  }, [selectedVersion.id, currentVehicle.colors, selectedColor?.id, selectedColor?.versionId]);

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
  const colorsForSelectedVersion = getColorsForVersion(colors, selectedVersion?.id);
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
    selectedVersion.price + (selectedColor?.price || 0) + kitsTotal + accessoriesTotal;

  const monthly = total / 108;

  const mainCarImage =
    selectedColor?.image || selectedVersion.image || currentVehicle.mainImage;

  const updateVehicle = (patch: Partial<VehicleBuilderConfig>) => {
    setCurrentVehicle((prev) => ({ ...prev, ...patch }));
  };

  const updateVersion = (id: string, patch: Partial<Version>) => {
    setCurrentVehicle((prev) => ({
      ...prev,
      versions: prev.versions.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));

    if (selectedVersion.id === id) {
      setSelectedVersion((prev) => ({ ...prev, ...patch }));
    }
  };

  const updateColor = (id: string, patch: Partial<OptionItem>) => {
    setCurrentVehicle((prev) => ({
      ...prev,
      colors: prev.colors.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));

    if (selectedColor?.id === id) {
      setSelectedColor((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  };

  const updateOption = (
    list: "kits" | "accessories",
    id: string,
    patch: Partial<OptionItem>
  ) => {
    setCurrentVehicle((prev) => ({
      ...prev,
      [list]: prev[list].map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    }));
  };

  async function handleEditUpload(
    file: File | null,
    target: string,
    callback: (url: string) => void
  ) {
    if (!file) return;

    setUploadingKey(target);
    setEditMessage("");

    try {
      const url = await uploadImageToSupabase(
        file,
        `fiat/${currentVehicle.slug || "sem-slug"}/${target}`
      );
      callback(url);
    } catch (e: any) {
      setEditMessage(e?.message || "Erro ao enviar imagem.");
    } finally {
      setUploadingKey("");
    }
  }

  async function saveInlineVehicle() {
    setEditMessage("");

    if (!currentVehicle.name.trim()) {
      setEditMessage("Informe o nome do veículo.");
      return;
    }

    if (!currentVehicle.mainImage.trim()) {
      setEditMessage("Informe a imagem principal.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        brand: "fiat",
        model_name: currentVehicle.name.trim(),
        slug: currentVehicle.slug.trim(),
        title: currentVehicle.title.trim(),
        description: currentVehicle.description.trim(),
        image_url: currentVehicle.mainImage.trim(),
        catalog_cover_url: currentVehicle.mainImage.trim(),
        is_visible: true,
        price_start: Number(currentVehicle.versions[0]?.price || 0),
        versions: currentVehicle.versions,
        colors: currentVehicle.colors,
        kits: currentVehicle.kits,
        accessories: currentVehicle.accessories,
        spec_groups: [],
      };

      if (dbId) {
        const { error } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", dbId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("vehicles")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        setDbId(data?.id || null);
      }

      setEditMessage("Alterações salvas com sucesso.");
    } catch (e: any) {
      setEditMessage(e?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function buildContractOrderPayload(): ContractOrderPayload {
    return {
      source: "fiat_builder",
      status: "pendente_analise",
      brand: "fiat",
      vehicle_slug: currentVehicle.slug,
      vehicle_name: currentVehicle.name,
      vehicle_title: currentVehicle.title,
      vehicle_description: currentVehicle.description,
      vehicle_image: mainCarImage,
      client: {
        name: clientName.trim(),
        cpf: clientCpf.trim(),
        email: clientEmail.trim().toLowerCase(),
        phone: toE164Digits(clientPhone) || "",
      },
      seller: {
        name: normalizeSellerName(sellerName),
        id: loggedUser?.id || null,
        email: String(loggedUser?.email || "").trim().toLowerCase() || null,
      },
      version: {
        id: selectedVersion.id,
        name: selectedVersion.name,
        description: selectedVersion.description || "",
        price: Number(selectedVersion.price || 0),
        image: selectedVersion.image || "",
      },
      color: selectedColor
        ? {
            id: selectedColor.id,
            name: selectedColor.name,
            description: selectedColor.description || "",
            category: selectedColor.category || "",
            price: Number(selectedColor.price || 0),
            image: selectedColor.image || "",
            hex: selectedColor.hex || selectedColor.swatch || "#111111",
            versionId: selectedColor.versionId || selectedVersion.id,
          }
        : null,
      kits: selectedKitItems,
      accessories: selectedAccessoryItems,
      totals: {
        vehicle: Number(selectedVersion.price || 0),
        color: Number(selectedColor?.price || 0),
        kits: kitsTotal,
        accessories: accessoriesTotal,
        total,
        monthly_108: monthly,
      },
      created_at: new Date().toISOString(),
    };
  }

  function validateCustomerData() {
    const nextErrors: CustomerErrors = { ...emptyCustomerErrors };
    let hasError = false;

    if (clientName.trim().length < 3) {
      nextErrors.clientName = "Nome completo é obrigatório.";
      hasError = true;
    }

    if (clientCpf.trim().length < 14) {
      nextErrors.clientCpf = "CPF inválido ou incompleto.";
      hasError = true;
    }

    if (!clientEmail.trim() || !validateEmail(clientEmail.trim())) {
      nextErrors.clientEmail = "Insira um e-mail válido.";
      hasError = true;
    }

    const phoneDigits = toE164Digits(clientPhone);
    if (!phoneDigits) {
      nextErrors.clientPhone = "Telefone inválido. Digite com DDD.";
      hasError = true;
    }

    if (normalizeSellerName(sellerName).length < 3) {
      nextErrors.sellerName = "Informe o vendedor que atendeu o cliente.";
      hasError = true;
    }

    setCustomerErrors(nextErrors);

    if (hasError) {
      setEditMessage("Preencha os dados do cliente antes de enviar para análise.");
      setStep(5);
      return false;
    }

    return true;
  }

  async function saveOrderAndGoAnalysis() {
    setEditMessage("");

    if (!selectedVersion?.id) {
      setEditMessage("Escolha uma versão antes de concluir.");
      setStep(1);
      return;
    }

    if (!selectedColor?.id) {
      setEditMessage("Escolha uma cor antes de concluir.");
      setStep(2);
      return;
    }

    if (!validateCustomerData()) return;

    const orderPayload = buildContractOrderPayload();

    try {
      setSavingOrder(true);

      localStorage.setItem("wb_builder_order", JSON.stringify(orderPayload));
      localStorage.setItem("wb_analysis_order", JSON.stringify(orderPayload));
      localStorage.setItem("wb_builder_order_updated_at", new Date().toISOString());
      localStorage.setItem("wb_analysis_order_updated_at", new Date().toISOString());
      localStorage.setItem("wb_builder_customer", JSON.stringify({
        nome: clientName.trim(),
        cpf: clientCpf.trim(),
        email: clientEmail.trim().toLowerCase(),
        telefone: toE164Digits(clientPhone) || "",
        vendedor: normalizeSellerName(sellerName),
      }));

      const { data, error } = await supabase
        .from(ORDER_TABLE_NAME)
        .insert({
          source: orderPayload.source,
          status: orderPayload.status,
          brand: orderPayload.brand,
          vehicle_slug: orderPayload.vehicle_slug,
          vehicle_name: orderPayload.vehicle_name,
          version_name: orderPayload.version.name,
          color_name: orderPayload.color?.name || "",
          vehicle_image: orderPayload.vehicle_image,
          total_value: orderPayload.totals.total,
          monthly_value: orderPayload.totals.monthly_108,
          payload: orderPayload,
        })
        .select("id")
        .single();

      if (error) throw error;

      const pedidoId = data?.id ? String(data.id) : "";

      const analysisParams = new URLSearchParams();
      analysisParams.set("origem", "builder");
      analysisParams.set("modelo", orderPayload.version.name || orderPayload.vehicle_name);
      analysisParams.set("valor", String(orderPayload.totals.total || orderPayload.version.price || 0));
      analysisParams.set("imagem", orderPayload.vehicle_image || orderPayload.color?.image || orderPayload.version.image || "");
      analysisParams.set("vehicle_slug", orderPayload.vehicle_slug);
      analysisParams.set("vehicle_name", orderPayload.vehicle_name);
      analysisParams.set("versao", orderPayload.version.name);
      analysisParams.set("cor", orderPayload.color?.name || "");
      analysisParams.set("nome", orderPayload.client.name);
      analysisParams.set("cpf", orderPayload.client.cpf);
      analysisParams.set("email", orderPayload.client.email);
      analysisParams.set("telefone", orderPayload.client.phone);
      analysisParams.set("vendedor", orderPayload.seller.name);
      analysisParams.set("vendedor_id", orderPayload.seller.id || "");
      analysisParams.set("vendedor_email", orderPayload.seller.email || "");

      if (pedidoId) {
        localStorage.setItem("wb_builder_order_id", pedidoId);
        analysisParams.set("pedido", pedidoId);
        router.push(`${ANALYSIS_ROUTE}?${analysisParams.toString()}`);
        return;
      }

      router.push(`${ANALYSIS_ROUTE}?${analysisParams.toString()}`);
    } catch (e: any) {
      console.error("Erro ao salvar pedido do builder:", e);
      setEditMessage(
        e?.message ||
          "Erro ao salvar o pedido. Verifique se a tabela de pedidos existe no Supabase."
      );
    } finally {
      setSavingOrder(false);
    }
  }

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

  const goNext = async () => {
    if (step < 5) {
      setStep((current) => ((current + 1) as BuilderStep));
      return;
    }

    await saveOrderAndGoAnalysis();
  };

  const stepTitle =
    step === 1
      ? "Versão"
      : step === 2
      ? "Cor"
      : step === 3
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
            {editMode && (
              <button
                onClick={saveInlineVehicle}
                disabled={saving}
                className="mr-3 flex h-[34px] items-center gap-2 rounded-full bg-[#ff1435] px-4 text-[11px] font-black uppercase text-white"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar edição"}
              </button>
            )}
          </div>
        </div>
      </header>

      {editMessage && (
        <div className="bg-black px-4 py-2 text-center text-[12px] font-bold text-white">
          {editMessage}
        </div>
      )}

      <section className="grid min-h-[calc(100vh-48px)] grid-cols-1 lg:grid-cols-[170px_365px_1fr]">
        <aside className="relative hidden border-r border-black/20 bg-[#f1f0e8] p-6 lg:block">
          {editMode ? (
            <InlineTextInput
              value={currentVehicle.name}
              onChange={(value) => updateVehicle({ name: value })}
              className="text-[18px] font-black uppercase leading-tight"
            />
          ) : (
            <h1 className="text-[18px] font-black uppercase leading-tight">
              Monte o
              <br />
              seu
              <br />
              {currentVehicle.name}
            </h1>
          )}

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

          {editMode && (
            <div className="mt-8 space-y-3 rounded-xl bg-white p-3">
              <p className="text-[10px] font-black uppercase text-black/50">
                Dados gerais
              </p>

              <InlineTextInput
                value={currentVehicle.slug}
                onChange={(value) => updateVehicle({ slug: value })}
                placeholder="slug-do-veiculo"
              />

              <InlineTextInput
                value={currentVehicle.title}
                onChange={(value) => updateVehicle({ title: value })}
                placeholder="Título"
              />

              <InlineUploadButton
                label="Imagem principal"
                loading={uploadingKey === "main-image"}
                onFile={(file) =>
                  handleEditUpload(file, "main-image", (url) =>
                    updateVehicle({ mainImage: url })
                  )
                }
              />
            </div>
          )}

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
                  <div
                    key={version.id}
                    className={`flex w-full gap-3 rounded-[3px] border-2 p-3 text-left transition-all duration-300 ${
                      active
                        ? "border-[#269f6b] bg-[#9edfe4]"
                        : "border-transparent bg-[#9edfe4]"
                    }`}
                  >
                    <button onClick={() => setSelectedVersion(version)}>
                      <Radio active={active} />
                    </button>

                    <img
                      src={version.image || currentVehicle.mainImage}
                      alt={version.name}
                      className="h-[70px] w-[105px] object-contain"
                    />

                    <div className="flex-1">
                      {editMode ? (
                        <div className="space-y-2">
                          <InlineTextInput
                            value={version.name}
                            onChange={(value) =>
                              updateVersion(version.id, { name: value })
                            }
                            className="text-[13px] font-black uppercase"
                          />

                          <InlineTextInput
                            type="number"
                            value={String(version.price)}
                            onChange={(value) =>
                              updateVersion(version.id, {
                                price: Number(value || 0),
                              })
                            }
                          />

                          <InlineTextarea
                            value={version.description}
                            onChange={(value) =>
                              updateVersion(version.id, { description: value })
                            }
                          />

                          <InlineUploadButton
                            label="Imagem versão"
                            loading={uploadingKey === `version-${version.id}`}
                            onFile={(file) =>
                              handleEditUpload(
                                file,
                                `version-${version.id}`,
                                (url) =>
                                  updateVersion(version.id, { image: url })
                              )
                            }
                          />
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {step === 2 && (
              <div className="space-y-5">
                {selectedColor ? (
                  <div className="rounded-[3px] bg-[#9edfe4] p-4">
                    {editMode ? (
                      <div className="space-y-2">
                        <InlineTextInput
                          value={selectedColor.category || ""}
                          onChange={(value) =>
                            updateColor(selectedColor.id, { category: value })
                          }
                          placeholder="Categoria"
                        />

                        <InlineTextInput
                          value={selectedColor.name}
                          onChange={(value) =>
                            updateColor(selectedColor.id, { name: value })
                          }
                          className="text-[16px] font-black uppercase"
                        />

                        <div className="grid grid-cols-[44px_1fr] items-center gap-2">
                          <input
                            type="color"
                            value={selectedColor.hex || selectedColor.swatch || "#111111"}
                            onChange={(e) =>
                              updateColor(selectedColor.id, {
                                hex: e.target.value,
                                swatch: e.target.value,
                              })
                            }
                            className="h-10 w-11 cursor-pointer rounded-md border border-black/20 bg-white p-1"
                          />
                          <InlineTextInput
                            value={selectedColor.hex || selectedColor.swatch || "#111111"}
                            onChange={(value) =>
                              updateColor(selectedColor.id, { hex: value, swatch: value })
                            }
                            placeholder="#111111"
                          />
                        </div>

                        <InlineTextInput
                          type="number"
                          value={String(selectedColor.price)}
                          onChange={(value) =>
                            updateColor(selectedColor.id, {
                              price: Number(value || 0),
                            })
                          }
                        />

                        <InlineTextarea
                          value={selectedColor.description}
                          onChange={(value) =>
                            updateColor(selectedColor.id, { description: value })
                          }
                        />

                        <InlineUploadButton
                          label="Imagem da cor"
                          loading={uploadingKey === `color-${selectedColor.id}`}
                          onFile={(file) =>
                            handleEditUpload(
                              file,
                              `color-${selectedVersion.id}-${selectedColor.id}`,
                              (url) => updateColor(selectedColor.id, { image: url })
                            )
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <p className="text-[12px] uppercase">
                          {selectedColor.category}
                        </p>
                        <h3 className="mt-1 text-[17px] font-black uppercase leading-tight">
                          {selectedColor.name}
                        </h3>
                        <p className="mt-1 text-[14px] font-bold">
                          {selectedColor.price > 0
                            ? money(selectedColor.price)
                            : "Incluso"}
                        </p>
                        <p className="mt-2 text-[12px] leading-tight text-black/70">
                          {selectedColor.description}
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-[3px] bg-[#9edfe4] p-4">
                    <h3 className="text-[17px] font-black uppercase leading-tight">
                      Nenhuma cor cadastrada para esta versão
                    </h3>
                    <p className="mt-2 text-[12px] leading-tight text-black/70">
                      No painel de cadastro, adicione cores vinculadas à versão selecionada: {selectedVersion.name}.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-4">
                  {colorsForSelectedVersion.map((color) => {
                    const active = selectedColor?.id === color.id;
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
                  <div
                    key={kit.id}
                    className={`flex w-full overflow-hidden rounded-[3px] border-2 bg-[#9edfe4] text-left transition-all duration-300 ${
                      active ? "border-[#269f6b]" : "border-transparent"
                    }`}
                  >
                    <button onClick={() => toggleKit(kit.id)}>
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
                    </button>

                    <div className="flex-1 p-3">
                      {editMode ? (
                        <div className="space-y-2">
                          <InlineTextInput
                            value={kit.name}
                            onChange={(value) =>
                              updateOption("kits", kit.id, { name: value })
                            }
                            className="text-[14px] font-black uppercase"
                          />

                          <InlineTextInput
                            type="number"
                            value={String(kit.price)}
                            onChange={(value) =>
                              updateOption("kits", kit.id, {
                                price: Number(value || 0),
                              })
                            }
                          />

                          <InlineTextarea
                            value={kit.description}
                            onChange={(value) =>
                              updateOption("kits", kit.id, {
                                description: value,
                              })
                            }
                          />

                          <InlineUploadButton
                            label="Imagem kit"
                            loading={uploadingKey === `kit-${kit.id}`}
                            onFile={(file) =>
                              handleEditUpload(file, `kit-${kit.id}`, (url) =>
                                updateOption("kits", kit.id, { image: url })
                              )
                            }
                          />
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {step === 4 &&
              accessories.map((accessory) => {
                const active = selectedAccessories.includes(accessory.id);

                return (
                  <div
                    key={accessory.id}
                    className={`flex w-full overflow-hidden rounded-[3px] border-2 bg-[#9edfe4] text-left transition-all duration-300 ${
                      active ? "border-[#269f6b]" : "border-transparent"
                    }`}
                  >
                    <button onClick={() => toggleAccessory(accessory.id)}>
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
                    </button>

                    <div className="flex-1 p-3">
                      {editMode ? (
                        <div className="space-y-2">
                          <InlineTextInput
                            value={accessory.name}
                            onChange={(value) =>
                              updateOption("accessories", accessory.id, {
                                name: value,
                              })
                            }
                            className="text-[14px] font-black uppercase"
                          />

                          <InlineTextInput
                            type="number"
                            value={String(accessory.price)}
                            onChange={(value) =>
                              updateOption("accessories", accessory.id, {
                                price: Number(value || 0),
                              })
                            }
                          />

                          <InlineTextarea
                            value={accessory.description}
                            onChange={(value) =>
                              updateOption("accessories", accessory.id, {
                                description: value,
                              })
                            }
                          />

                          <InlineUploadButton
                            label="Imagem acessório"
                            loading={uploadingKey === `accessory-${accessory.id}`}
                            onFile={(file) =>
                              handleEditUpload(
                                file,
                                `accessory-${accessory.id}`,
                                (url) =>
                                  updateOption("accessories", accessory.id, {
                                    image: url,
                                  })
                              )
                            }
                          />
                        </div>
                      ) : (
                        <>
                          <h3 className="text-[15px] font-black uppercase leading-tight">
                            {accessory.name}
                          </h3>
                          <p className="mt-1 text-[13px]">
                            {money(accessory.price)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-[11px] leading-tight">
                            {accessory.description}
                          </p>
                          <span className="mt-1 inline-flex items-center gap-1 text-[12px] font-bold underline">
                            <Info className="h-3.5 w-3.5" /> Mais detalhes
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h3 className="border-b border-black pb-1 text-[15px] font-black uppercase">
                    Total
                  </h3>

                  <SummaryLine label="Valor do carro" value={money(selectedVersion.price)} />
                  <SummaryLine label="Cor" value={`+ ${money(selectedColor?.price || 0)}`} />
                  <SummaryLine label="Kit opcionais" value={`+ ${money(kitsTotal)}`} />
                  <SummaryLine label="Acessórios" value={`+ ${money(accessoriesTotal)}`} />

                  <div className="mt-2 flex justify-between border-t border-black pt-2 text-[15px] font-black uppercase">
                    <span>Valor total</span>
                    <span>{money(total)}</span>
                  </div>
                </div>

                <div className="rounded-[3px] bg-white p-4 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-black uppercase">Dados do cliente</h3>
                    <p className="mt-1 text-[11px] leading-tight text-black/60">
                      Esses dados seguem para a análise, consulta de CPF e contrato junto com o veículo configurado.
                    </p>
                  </div>

                  <CustomerField
                    label="Nome completo"
                    value={clientName}
                    error={customerErrors.clientName}
                    placeholder="Nome do cliente"
                    onChange={(value) => {
                      setClientName(value);
                      if (customerErrors.clientName) {
                        setCustomerErrors((prev) => ({ ...prev, clientName: "" }));
                      }
                    }}
                  />

                  <CustomerField
                    label="CPF"
                    value={clientCpf}
                    error={customerErrors.clientCpf}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    onChange={(value) => {
                      setClientCpf(maskCPF(value));
                      if (customerErrors.clientCpf) {
                        setCustomerErrors((prev) => ({ ...prev, clientCpf: "" }));
                      }
                    }}
                  />

                  <CustomerField
                    label="E-mail"
                    value={clientEmail}
                    error={customerErrors.clientEmail}
                    placeholder="cliente@email.com"
                    onChange={(value) => {
                      setClientEmail(value);
                      if (customerErrors.clientEmail) {
                        setCustomerErrors((prev) => ({ ...prev, clientEmail: "" }));
                      }
                    }}
                  />

                  <CustomerField
                    label="Telefone"
                    value={clientPhone}
                    error={customerErrors.clientPhone}
                    placeholder="+55 (91) 9XXXX-XXXX"
                    maxLength={PHONE_PREFIX_DISPLAY.length + 16}
                    onChange={(value) => {
                      setClientPhone(formatPhoneInput(value));
                      if (customerErrors.clientPhone) {
                        setCustomerErrors((prev) => ({ ...prev, clientPhone: "" }));
                      }
                    }}
                  />

                  <CustomerField
                    label="Vendedor"
                    value={sellerName}
                    error={customerErrors.sellerName}
                    placeholder="Nome do vendedor"
                    icon={<UserRound className="h-3.5 w-3.5" />}
                    onChange={(value) => {
                      setSellerName(value);
                      if (customerErrors.sellerName) {
                        setCustomerErrors((prev) => ({ ...prev, sellerName: "" }));
                      }
                    }}
                  />

                  <div className="mt-3 rounded-xl border border-black/10 bg-[#f1f0e8] p-3 text-[11px] leading-tight text-black/70">
                    <strong>Prévia:</strong> {clientName || "Cliente"} será enviado para análise com CPF {clientCpf || "---"}, veículo {selectedVersion.name} e valor {money(total)}.
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={goNext}
            disabled={savingOrder}
            className="mt-6 flex h-[48px] w-full items-center justify-between bg-[#ff1435] px-5 text-[14px] font-black uppercase text-white transition hover:bg-[#e80f30] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {step === 1
              ? "Próximo: Cor"
              : step === 2
              ? "Próximo: Kit Opcionais"
              : step === 3
              ? "Próximo: Acessórios"
              : step === 4
              ? "Próximo: Resumo"
              : savingOrder
              ? "Salvando pedido..."
              : "Concluir e ir para análise"}
            <ChevronRight className="h-5 w-5" />
          </button>
        </aside>

        <section className="relative overflow-hidden bg-[#f1f0e8] px-6 py-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[13px]">Seu carro</span>

              {editMode ? (
                <InlineTextInput
                  value={selectedVersion.name}
                  onChange={(value) =>
                    updateVersion(selectedVersion.id, { name: value })
                  }
                  className="text-[26px] font-black uppercase leading-tight md:text-[34px]"
                />
              ) : (
                <h2 className="text-[26px] font-black uppercase leading-tight md:text-[34px]">
                  {selectedVersion.name}
                </h2>
              )}
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
                key={`${selectedVersion.id}-${selectedColor?.id || "sem-cor"}-${step}`}
                src={mainCarImage}
                alt={selectedVersion.name}
                className="builder-car-enter relative z-10 mx-auto w-full max-w-[1180px] object-contain"
              />
            </div>
          </div>

          {editMode && (
            <div className="mx-auto mb-3 flex max-w-[860px] justify-center">
              <InlineUploadButton
                label="Trocar imagem grande"
                loading={uploadingKey === "big-car"}
                onFile={(file) =>
                  handleEditUpload(file, "big-car", (url) =>
                    updateVehicle({ mainImage: url })
                  )
                }
              />
            </div>
          )}

          <div className="mx-auto mt-2 w-full max-w-[1120px]">
            {editMode ? (
              <InlineTextarea
                value={currentVehicle.description}
                onChange={(value) => updateVehicle({ description: value })}
                className="mx-auto text-center text-[14px] font-semibold leading-6 text-black/70"
              />
            ) : (
              <VehicleDescriptionSection
                step={step}
                vehicleDescription={currentVehicle.description}
                versionDescription={selectedVersion.description}
              />
            )}

            {step === 2 && selectedColor && (
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


function splitVehicleDescription(description?: string) {
  const raw = String(description || "").trim();
  if (!raw) return [];

  const normalized = raw
    .replace(/\r/g, "\n")
    .replace(/[•●]/g, "\n")
    .replace(/\s+-\s+/g, "\n")
    .replace(/\s{2,}/g, " ");

  const directLines = normalized
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (directLines.length > 1) return directLines;

  return raw
    .split(/(?<=[.!?;])\s+(?=[A-ZÁÀÂÃÉÈÊÍÓÔÕÚÇ0-9])/)
    .map((item) => item.trim().replace(/[.;]+$/, ""))
    .filter(Boolean);
}

function VehicleDescriptionSection({
  step,
  vehicleDescription,
  versionDescription,
}: {
  step: BuilderStep;
  vehicleDescription: string;
  versionDescription: string;
}) {
  const descriptionToUse =
    step === 1 && String(versionDescription || "").trim()
      ? versionDescription
      : vehicleDescription;

  const items = splitVehicleDescription(descriptionToUse);

  if (!items.length) return null;

  if (step !== 1) {
    return (
      <p className="mx-auto text-center text-[14px] font-semibold leading-6 text-black/70">
        {vehicleDescription}
      </p>
    );
  }

  return (
    <div className="mx-auto mt-1 max-w-[760px] text-left lg:ml-0 lg:mr-auto">
      <h3 className="mb-2 text-[13px] font-black uppercase tracking-tight text-black">
        Itens de série
      </h3>

      <ul className="max-h-[560px] list-disc space-y-1 overflow-y-auto pl-5 pr-2 text-[12px] font-semibold leading-[1.35] text-black/85 md:text-[13px]">
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
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

function CustomerField({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  icon?: any;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-black/50">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
            {icon}
          </span>
        ) : null}
        <input
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`h-10 w-full rounded-xl border bg-white px-3 text-[12px] font-bold outline-none transition focus:border-[#ff1435] ${
            icon ? "pl-9" : ""
          } ${error ? "border-red-400 bg-red-50" : "border-black/15"}`}
        />
      </div>
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-600">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      ) : null}
    </div>
  );
}

function InlineTextInput({
  value,
  onChange,
  placeholder,
  className = "",
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "w-full rounded-md border border-black/20 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-[#ff1435]",
        className,
      ].join(" ")}
    />
  );
}

function InlineTextarea({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={[
        "w-full resize-none rounded-md border border-black/20 bg-white/80 px-2 py-1 text-[12px] outline-none focus:border-[#ff1435]",
        className,
      ].join(" ")}
    />
  );
}

function InlineUploadButton({
  label,
  loading,
  onFile,
}: {
  label: string;
  loading: boolean;
  onFile: (file: File | null) => void;
}) {
  return (
    <label className="inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-3 text-[10px] font-black uppercase text-white hover:bg-[#ff1435]">
      <UploadCloud className="h-3.5 w-3.5" />
      {loading ? "Enviando..." : label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0] || null;
          e.currentTarget.value = "";
          onFile(file);
        }}
      />
    </label>
  );
}