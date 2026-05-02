"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Car,
  Check,
  ChevronRight,
  ImageIcon,
  Loader2,
  MessageCircle,
  Search,
  AlertCircle,
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

type ContractOrderPayload = {
  source: "volkswagen_builder";
  status: "pendente_analise";
  brand: "volkswagen";
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
  motor: {
    id: string;
    name: string;
    description: string;
    price: number;
    power: string;
    fuel: string;
    transmission: string;
    traction: string;
  };
  color: {
    id: string;
    name: string;
    type: string;
    price: number;
    image: string;
    hex: string;
    versionId?: string;
  } | null;
  interior: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
  } | null;
  totals: {
    vehicle: number;
    color: number;
    interior: number;
    total: number;
    monthly_108: number;
  };
  payment: PaymentPayload;
  created_at: string;
};

type PaymentType = "consorcio" | "financiamento";

type ConsortiumInstallment = {
  months: number;
  value: number;
};

type ConsortiumPlan = {
  code: string;
  category: "auto" | "pesados";
  tableName: string;
  credit: number;
  adminTax: number;
  installments: ConsortiumInstallment[];
};

type PaymentPayload =
  | {
      type: "consorcio";
      tableName: string;
      category: "auto" | "pesados";
      code: string;
      credit: number;
      adminTax: number;
      selectedMonths: number;
      installment: number;
      vehicleValue: number;
      rule: "credito_igual_ou_acima";
    }
  | {
      type: "financiamento";
      vehicleValue: number;
      status: "simular_na_analise";
    };

type CustomerErrors = {
  clientName: string;
  clientCpf: string;
  clientEmail: string;
  clientPhone: string;
  sellerName: string;
};

const ORDER_TABLE_NAME = "contract_orders";
const ANALYSIS_ROUTE = "/vendedor/analise";

const PHONE_PREFIX_DISPLAY = "+55 ";
const DEFAULT_DDD = "91";

const emptyCustomerErrors: CustomerErrors = {
  clientName: "",
  clientCpf: "",
  clientEmail: "",
  clientPhone: "",
  sellerName: "",
};

const VW_AUTO_CONSORTIUM_PLANS: ConsortiumPlan[] = [
  {
    code: "VW003",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 45000,
    adminTax: 21,
    installments: [
      { months: 80, value: 556 },
      { months: 70, value: 665 },
      { months: 60, value: 770 },
    ],
  },
  {
    code: "VW005",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 55000,
    adminTax: 21,
    installments: [
      { months: 80, value: 717 },
      { months: 70, value: 813 },
      { months: 60, value: 942 },
    ],
  },
  {
    code: "VW008",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 70000,
    adminTax: 21,
    installments: [
      { months: 80, value: 915 },
      { months: 70, value: 1038 },
      { months: 60, value: 1202 },
    ],
  },
  {
    code: "VW012",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 90000,
    adminTax: 21,
    installments: [
      { months: 80, value: 1175 },
      { months: 70, value: 1336 },
      { months: 60, value: 1547 },
    ],
  },
  {
    code: "VW016",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 120000,
    adminTax: 21,
    installments: [
      { months: 80, value: 1564 },
      { months: 70, value: 1775 },
      { months: 60, value: 2055 },
    ],
  },
  {
    code: "VW017",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 130000,
    adminTax: 21,
    installments: [
      { months: 80, value: 1694 },
      { months: 70, value: 1929 },
      { months: 60, value: 2227 },
    ],
  },
  {
    code: "VW018",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 140000,
    adminTax: 21,
    installments: [
      { months: 80, value: 1824 },
      { months: 70, value: 2074 },
      { months: 60, value: 2400 },
    ],
  },
  {
    code: "VW019",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 150000,
    adminTax: 21,
    installments: [
      { months: 80, value: 1955 },
      { months: 70, value: 2218 },
      { months: 60, value: 2570 },
    ],
  },
  {
    code: "VW020",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 160000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2085 },
      { months: 70, value: 2368 },
      { months: 60, value: 2730 },
    ],
  },
  {
    code: "VW021",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 170000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2216 },
      { months: 70, value: 2515 },
      { months: 60, value: 2921 },
    ],
  },
  {
    code: "VW022",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 180000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2346 },
      { months: 70, value: 2659 },
      { months: 60, value: 3095 },
    ],
  },
  {
    code: "VW023",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 190000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2477 },
      { months: 70, value: 2811 },
      { months: 60, value: 3255 },
    ],
  },
  {
    code: "VW024",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 200000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2607 },
      { months: 70, value: 2959 },
      { months: 60, value: 3420 },
    ],
  },
  {
    code: "VW025",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 210000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2738 },
      { months: 70, value: 3106 },
      { months: 60, value: 3598 },
    ],
  },
  {
    code: "VW026",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 220000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2868 },
      { months: 70, value: 3255 },
      { months: 60, value: 3780 },
    ],
  },
  {
    code: "VW027",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 230000,
    adminTax: 21,
    installments: [
      { months: 80, value: 2999 },
      { months: 70, value: 3402 },
      { months: 60, value: 3940 },
    ],
  },
  {
    code: "VW028",
    category: "auto",
    tableName: "Tabela Normal Auto",
    credit: 240000,
    adminTax: 21,
    installments: [
      { months: 80, value: 3129 },
      { months: 70, value: 3549 },
      { months: 60, value: 4115 },
    ],
  },
];


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
      image: VW_IMAGES.teraThumb || VW_IMAGES.teraExterior,
      description: "Versão de entrada do Volkswagen Tera.",
      images: {
        front: VW_IMAGES.teraExterior,
        side: VW_IMAGES.teraExterior,
        rear: VW_IMAGES.teraExterior,
      },
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
      images: {
        front: VW_IMAGES.teraExterior,
        side: VW_IMAGES.teraExterior,
        rear: VW_IMAGES.teraExterior,
      },
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

const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizeSellerName = (value: string) =>
  String(value || "").replace(/\s+/g, " ").trim().toUpperCase();

const toE164Digits = (displayPhone: string) => {
  const digits = onlyDigits(displayPhone);

  if (digits.startsWith("55")) {
    const national = digits.slice(2);

    if (national.length === 10 || national.length === 11) {
      return `55${national}`;
    }

    if ((national.length === 8 || national.length === 9) && DEFAULT_DDD) {
      return `55${DEFAULT_DDD}${national}`;
    }

    return null;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  if ((digits.length === 8 || digits.length === 9) && DEFAULT_DDD) {
    return `55${DEFAULT_DDD}${digits}`;
  }

  return null;
};

const formatPhoneInput = (value: string) => {
  let digits = onlyDigits(value);

  if (digits.startsWith("55")) {
    digits = digits.slice(2);
  }

  digits = digits.slice(0, 11);

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (!digits) return PHONE_PREFIX_DISPLAY;
  if (digits.length <= 2) return `${PHONE_PREFIX_DISPLAY}(${ddd}`;
  if (number.length <= 5) return `${PHONE_PREFIX_DISPLAY}(${ddd}) ${number}`;

  return `${PHONE_PREFIX_DISPLAY}(${ddd}) ${number.slice(0, 5)}-${number.slice(
    5
  )}`;
};

function normalizeColor(color: any): Color {
  const images = color?.images || {};

  const image =
    images.front ||
    images.threeQuarter ||
    images.side ||
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
  const versions =
    Array.isArray(row.versions) && row.versions.length
      ? row.versions
      : fallbackVehicle.versions;

  const motors =
    Array.isArray(row.motors) && row.motors.length
      ? row.motors
      : fallbackVehicle.motors;

  const colors =
    Array.isArray(row.colors) && row.colors.length
      ? row.colors.map(normalizeColor)
      : fallbackVehicle.colors;

  const interiors =
    Array.isArray(row.interiors) && row.interiors.length
      ? row.interiors
      : fallbackVehicle.interiors;

  const mainFrontImage =
    row.exterior_image_url ||
    row.image_url ||
    row.catalog_cover_url ||
    row.side_image_url ||
    "";

  return {
    slug: row.slug,
    name: row.model_name,
    fullName: row.full_name || row.model_name,
    heroImage: mainFrontImage,
    exteriorImage: mainFrontImage,
    interiorImage: row.interior_image_url || interiors[0]?.image || "",
    sideImage: row.side_image_url || mainFrontImage,
    catalogCover: row.catalog_cover_url || mainFrontImage,
    versions: versions.map((item) => {
      const itemImages = item.images || {};

      const frontImage =
        itemImages.front ||
        itemImages.threeQuarter ||
        item.image ||
        row.exterior_image_url ||
        row.image_url ||
        row.catalog_cover_url ||
        row.side_image_url ||
        "";

      return {
        ...item,
        price: Number(item.price || 0),
        image: frontImage,
        description: item.description || "",
        images: {
          front:
            itemImages.front ||
            itemImages.threeQuarter ||
            frontImage ||
            mainFrontImage,
          side:
            itemImages.side ||
            row.side_image_url ||
            itemImages.front ||
            frontImage ||
            mainFrontImage,
          rear:
            itemImages.rear ||
            itemImages.side ||
            row.side_image_url ||
            frontImage ||
            mainFrontImage,
          threeQuarter:
            itemImages.threeQuarter || itemImages.front || frontImage,
        },
      };
    }),
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
      images: {
        front:
          item.images?.front ||
          item.images?.threeQuarter ||
          item.image ||
          mainFrontImage,
        side:
          item.images?.side ||
          row.side_image_url ||
          item.images?.front ||
          item.image ||
          mainFrontImage,
        rear:
          item.images?.rear ||
          item.images?.side ||
          row.side_image_url ||
          item.image ||
          mainFrontImage,
        threeQuarter:
          item.images?.threeQuarter || item.images?.front || item.image,
      },
      image:
        item.images?.front ||
        item.images?.threeQuarter ||
        item.image ||
        mainFrontImage,
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

function getVersionImage(version: Version, view: ViewKey = "front") {
  return (
    version.images?.[view] ||
    version.images?.front ||
    version.images?.threeQuarter ||
    version.images?.side ||
    version.images?.rear ||
    version.image ||
    ""
  );
}

function getColorImage(color: Color, view: ViewKey = "front") {
  return (
    color.images?.[view] ||
    color.images?.front ||
    color.images?.threeQuarter ||
    color.images?.side ||
    color.images?.rear ||
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

  return (
    text.includes("volante") ||
    text.includes("direcao") ||
    text.includes("steering")
  );
}

function isSeatReference(item: Interior | GalleryImage) {
  const title = "title" in item ? item.title || "" : "";
  const name = "name" in item ? item.name || "" : "";
  const description = "description" in item ? item.description || "" : "";
  const text = normalizeForSearch(`${title} ${name} ${description}`);

  return (
    text.includes("banco") ||
    text.includes("assento") ||
    text.includes("seat") ||
    text.includes("couro") ||
    text.includes("tecido")
  );
}

function getInteriorReference(vehicle: VehicleConfig, key: InteriorViewKey) {
  const matcher =
    key === "steeringWheel" ? isSteeringWheelReference : isSeatReference;

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
      description:
        key === "steeringWheel"
          ? "Referência de volante"
          : "Referência de banco",
    } as Interior;
  }

  return null;
}

function getInteriorImage(
  vehicle: VehicleConfig,
  selectedInterior: Interior,
  key: InteriorViewKey
) {
  return (
    getInteriorReference(vehicle, key)?.image ||
    selectedInterior?.image ||
    vehicle.interiorImage ||
    vehicle.heroImage
  );
}

function getSafeImageUrls(vehicle: VehicleConfig) {
  const urls = new Set<string>();

  const add = (url?: string | null) => {
    if (url && typeof url === "string" && url.trim().startsWith("http")) {
      urls.add(url.trim());
    }
  };

  add(vehicle.heroImage);
  add(vehicle.exteriorImage);
  add(vehicle.sideImage);
  add(vehicle.catalogCover);
  add(vehicle.interiorImage);

  vehicle.versions.forEach((version) => {
    add(version.image);
    add(version.images?.front);
    add(version.images?.side);
    add(version.images?.rear);
    add(version.images?.threeQuarter);
  });

  vehicle.colors.forEach((color) => {
    add(color.image);
    add(color.images?.front);
    add(color.images?.side);
    add(color.images?.rear);
    add(color.images?.threeQuarter);
  });

  vehicle.interiors.forEach((interior) => {
    add(interior.image);
  });

  vehicle.gallery.forEach((item) => {
    add(item.image);
  });

  return Array.from(urls);
}

function preloadOneImage(url: string) {
  return new Promise<void>((resolve) => {
    const img = new Image();

    const done = () => resolve();

    img.onload = done;
    img.onerror = done;
    img.src = url;
  });
}

async function preloadVehicleImages(vehicle: VehicleConfig) {
  const urls = getSafeImageUrls(vehicle);

  if (!urls.length) return;

  const timeout = new Promise<void>((resolve) => {
    window.setTimeout(resolve, 2600);
  });

  const preload = Promise.all(urls.map(preloadOneImage)).then(() => undefined);

  await Promise.race([preload, timeout]);
}

function findBestConsortiumPlan(totalValue: number, plans: ConsortiumPlan[]) {
  const sorted = [...plans].sort((a, b) => a.credit - b.credit);

  return (
    sorted.find((plan) => plan.credit >= totalValue) ||
    sorted[sorted.length - 1]
  );
}

function getPreferredInstallment(plan: ConsortiumPlan, selectedMonths: number) {
  return (
    plan.installments.find((item) => item.months === selectedMonths) ||
    plan.installments[0]
  );
}

export default function VolkswagenBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vehicleSlug = searchParams.get("vehicle") || "tera";

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleConfig>(fallbackVehicle);
  const [step, setStep] = useState<Step>("versoes");
  const [view, setView] = useState<ViewKey>("front");
  const [interiorView, setInteriorView] =
    useState<InteriorViewKey>("steeringWheel");

  const [selectedVersion, setSelectedVersion] = useState<Version>(
    fallbackVehicle.versions[0]
  );
  const [selectedMotor, setSelectedMotor] = useState<Motor>(
    fallbackVehicle.motors[0]
  );
  const [selectedColor, setSelectedColor] = useState<Color>(
    fallbackVehicle.colors[0]
  );
  const [selectedInterior, setSelectedInterior] = useState<Interior>(
    fallbackVehicle.interiors[0]
  );

  const [savingOrder, setSavingOrder] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  const [loggedUser, setLoggedUser] = useState<any>(null);
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState(PHONE_PREFIX_DISPLAY);
  const [sellerName, setSellerName] = useState("");
  const [customerErrors, setCustomerErrors] =
    useState<CustomerErrors>(emptyCustomerErrors);

  const [paymentType, setPaymentType] = useState<PaymentType>("consorcio");
  const [selectedConsortiumMonths, setSelectedConsortiumMonths] = useState(80);

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
    let mounted = true;

    async function loadVehicle() {
      setLoading(true);
      setEditMessage("");

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

      const nextVehicle =
        !error && data
          ? normalizeVehicleFromDb(data as VehicleDbRow)
          : fallbackVehicle;

      const firstVersion = nextVehicle.versions[0];

      const firstMotor =
        nextVehicle.motors.find(
          (motor) => motor.versionId === firstVersion?.id
        ) || nextVehicle.motors[0];

      const firstColor =
        nextVehicle.colors.find(
          (color) => color.versionId === firstVersion?.id
        ) || nextVehicle.colors[0];

      setVehicle(nextVehicle);
      setSelectedVersion(firstVersion);
      setSelectedMotor(firstMotor);
      setSelectedColor(firstColor);
      setSelectedInterior(nextVehicle.interiors[0]);
      setStep("versoes");
      setView("front");
      setInteriorView("steeringWheel");

      await preloadVehicleImages(nextVehicle);

      if (!mounted) return;

      setLoading(false);
    }

    loadVehicle();

    return () => {
      mounted = false;
    };
  }, [vehicleSlug]);

  const availableMotors = useMemo(() => {
    const filtered = vehicle.motors.filter(
      (motor) => motor.versionId === selectedVersion?.id
    );

    return filtered.length ? filtered : vehicle.motors;
  }, [vehicle.motors, selectedVersion]);

  const availableColors = useMemo(() => {
    const filtered = vehicle.colors.filter(
      (color) => color.versionId === selectedVersion?.id
    );

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
  }, [
    selectedVersion,
    availableMotors,
    availableColors,
    selectedMotor?.id,
    selectedColor?.id,
  ]);

  const total =
    Number(selectedVersion?.price || 0) +
    Number(selectedColor?.price || 0) +
    Number(selectedInterior?.price || 0);

  const monthly = total / 108;

  const suggestedConsortiumPlan = useMemo(() => {
    return findBestConsortiumPlan(total, VW_AUTO_CONSORTIUM_PLANS);
  }, [total]);

  const selectedConsortiumInstallment = useMemo(() => {
    return getPreferredInstallment(
      suggestedConsortiumPlan,
      selectedConsortiumMonths
    );
  }, [suggestedConsortiumPlan, selectedConsortiumMonths]);

  useEffect(() => {
    if (
      suggestedConsortiumPlan &&
      !suggestedConsortiumPlan.installments.some(
        (item) => item.months === selectedConsortiumMonths
      )
    ) {
      setSelectedConsortiumMonths(
        suggestedConsortiumPlan.installments[0]?.months || 80
      );
    }
  }, [suggestedConsortiumPlan, selectedConsortiumMonths]);

  const currentImage = useMemo(() => {
    if (step === "interior") {
      return getInteriorImage(vehicle, selectedInterior, interiorView);
    }

    if (step === "cor") {
      return (
        getColorImage(selectedColor, view) ||
        getColorImage(selectedColor, "front") ||
        getVersionImage(selectedVersion, "front") ||
        vehicle.exteriorImage ||
        vehicle.heroImage ||
        vehicle.sideImage
      );
    }

    if (step === "resumo") {
      return (
        getColorImage(selectedColor, "front") ||
        getVersionImage(selectedVersion, "front") ||
        vehicle.exteriorImage ||
        vehicle.heroImage ||
        vehicle.sideImage
      );
    }

    return (
      getVersionImage(selectedVersion, view) ||
      getVersionImage(selectedVersion, "front") ||
      vehicle.exteriorImage ||
      vehicle.heroImage ||
      vehicle.sideImage
    );
  }, [
    step,
    vehicle,
    selectedVersion,
    selectedColor,
    selectedInterior,
    view,
    interiorView,
  ]);

  function buildContractOrderPayload(): ContractOrderPayload {
    const vehicleImage =
      currentImage ||
      getColorImage(selectedColor, "front") ||
      getVersionImage(selectedVersion, "front") ||
      vehicle.heroImage ||
      vehicle.exteriorImage ||
      vehicle.sideImage ||
      "";

    return {
      source: "volkswagen_builder",
      status: "pendente_analise",
      brand: "volkswagen",
      vehicle_slug: vehicle.slug,
      vehicle_name: vehicle.name,
      vehicle_title: `Monte o seu ${vehicle.name}`,
      vehicle_description: vehicle.fullName || vehicle.name,
      vehicle_image: vehicleImage,
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
        image:
          getVersionImage(selectedVersion, "front") ||
          selectedVersion.image ||
          vehicleImage,
      },
      motor: {
        id: selectedMotor.id,
        name: selectedMotor.name,
        description: selectedMotor.description || "",
        price: Number(selectedMotor.price || 0),
        power: selectedMotor.power || "",
        fuel: selectedMotor.fuel || "",
        transmission: selectedMotor.transmission || "",
        traction: selectedMotor.traction || "",
      },
      color: selectedColor
        ? {
            id: selectedColor.id,
            name: selectedColor.name,
            type: selectedColor.type || "",
            price: Number(selectedColor.price || 0),
            image:
              getColorImage(selectedColor, "front") ||
              selectedColor.image ||
              vehicleImage,
            hex: selectedColor.hex || "#111111",
            versionId: selectedColor.versionId || selectedVersion.id,
          }
        : null,
      interior: selectedInterior
        ? {
            id: selectedInterior.id,
            name: selectedInterior.name,
            price: Number(selectedInterior.price || 0),
            image: selectedInterior.image || "",
            description: selectedInterior.description || "",
          }
        : null,
      totals: {
        vehicle: Number(selectedVersion.price || 0),
        color: Number(selectedColor?.price || 0),
        interior: Number(selectedInterior?.price || 0),
        total,
        monthly_108: monthly,
      },
      payment:
        paymentType === "consorcio"
          ? {
              type: "consorcio",
              tableName: suggestedConsortiumPlan.tableName,
              category: suggestedConsortiumPlan.category,
              code: suggestedConsortiumPlan.code,
              credit: suggestedConsortiumPlan.credit,
              adminTax: suggestedConsortiumPlan.adminTax,
              selectedMonths: selectedConsortiumInstallment.months,
              installment: selectedConsortiumInstallment.value,
              vehicleValue: total,
              rule: "credito_igual_ou_acima",
            }
          : {
              type: "financiamento",
              vehicleValue: total,
              status: "simular_na_analise",
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
      setStep("resumo");
      return false;
    }

    return true;
  }

  async function saveOrderAndGoAnalysis() {
    setEditMessage("");

    if (!selectedVersion?.id) {
      setEditMessage("Escolha uma versão antes de concluir.");
      setStep("versoes");
      return;
    }

    if (!selectedColor?.id) {
      setEditMessage("Escolha uma cor antes de concluir.");
      setStep("cor");
      return;
    }

    if (!validateCustomerData()) return;

    const orderPayload = buildContractOrderPayload();

    try {
      setSavingOrder(true);

      localStorage.setItem("wb_builder_order", JSON.stringify(orderPayload));
      localStorage.setItem("wb_analysis_order", JSON.stringify(orderPayload));
      localStorage.setItem(
        "wb_builder_order_updated_at",
        new Date().toISOString()
      );
      localStorage.setItem(
        "wb_analysis_order_updated_at",
        new Date().toISOString()
      );

      localStorage.setItem(
        "wb_builder_customer",
        JSON.stringify({
          nome: clientName.trim(),
          cpf: clientCpf.trim(),
          email: clientEmail.trim().toLowerCase(),
          telefone: toE164Digits(clientPhone) || "",
          vendedor: normalizeSellerName(sellerName),
        })
      );

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
      analysisParams.set(
        "modelo",
        orderPayload.version.name || orderPayload.vehicle_name
      );
      analysisParams.set(
        "valor",
        String(orderPayload.totals.total || orderPayload.version.price || 0)
      );
      analysisParams.set("imagem", orderPayload.vehicle_image || "");
      analysisParams.set("vehicle_slug", orderPayload.vehicle_slug);
      analysisParams.set("vehicle_name", orderPayload.vehicle_name);
      analysisParams.set("versao", orderPayload.version.name);
      analysisParams.set("motor", orderPayload.motor.name);
      analysisParams.set("cor", orderPayload.color?.name || "");
      analysisParams.set("nome", orderPayload.client.name);
      analysisParams.set("cpf", orderPayload.client.cpf);
      analysisParams.set("email", orderPayload.client.email);
      analysisParams.set("telefone", orderPayload.client.phone);
      analysisParams.set("vendedor", orderPayload.seller.name);
      analysisParams.set("vendedor_id", orderPayload.seller.id || "");
      analysisParams.set("vendedor_email", orderPayload.seller.email || "");
      analysisParams.set("payment_type", orderPayload.payment.type);

      if (orderPayload.payment.type === "consorcio") {
        analysisParams.set("consorcio_tabela", orderPayload.payment.tableName);
        analysisParams.set("consorcio_codigo", orderPayload.payment.code);
        analysisParams.set("consorcio_credito", String(orderPayload.payment.credit));
        analysisParams.set("consorcio_prazo", String(orderPayload.payment.selectedMonths));
        analysisParams.set("consorcio_parcela", String(orderPayload.payment.installment));
        analysisParams.set("consorcio_taxa_admin", String(orderPayload.payment.adminTax));
      }

      if (pedidoId) {
        localStorage.setItem("wb_builder_order_id", pedidoId);
        analysisParams.set("pedido", pedidoId);
      }

      router.push(`${ANALYSIS_ROUTE}?${analysisParams.toString()}`);
    } catch (e: any) {
      console.error("Erro ao salvar pedido do builder Volkswagen:", e);

      setEditMessage(
        e?.message ||
          "Erro ao salvar o pedido. Verifique se a tabela contract_orders existe no Supabase."
      );
    } finally {
      setSavingOrder(false);
    }
  }

  const goNext = async () => {
    if (step === "versoes") return setStep("motor");
    if (step === "motor") return setStep("cor");
    if (step === "cor") return setStep("interior");
    if (step === "interior") return setStep("resumo");

    await saveOrderAndGoAnalysis();
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
      : savingOrder
      ? "Salvando pedido..."
      : "Concluir e ir para análise";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-[#001e50]">
        <div className="w-full max-w-[420px] px-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef4ff]">
            <Loader2 className="h-8 w-8 animate-spin text-[#001e50]" />
          </div>

          <h1 className="mt-6 text-[26px] font-bold tracking-[-0.03em]">
            Preparando seu Volkswagen
          </h1>

          <p className="mt-3 text-[14px] leading-6 text-[#001e50]/70">
          </p>

          <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#e7edf7]">
            <div className="builder-loading-bar h-full rounded-full bg-[#0055d8]" />
          </div>
        </div>

        <style jsx global>{`
          .builder-loading-bar {
            width: 45%;
            animation: builderLoadingBar 1.15s ease-in-out infinite;
          }

          @keyframes builderLoadingBar {
            0% {
              transform: translateX(-110%);
            }

            50% {
              transform: translateX(55%);
            }

            100% {
              transform: translateX(230%);
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-[#001e50]">
      <header className="fixed left-0 top-0 z-[80] h-[46px] w-full border-b border-black/10 bg-white text-[#001e50]">
        <div className="flex h-full items-center justify-between px-4 md:px-[76px]">
          <div className="flex h-full items-center gap-6">
            <img
              src={VW_IMAGES.logo}
              alt="Volkswagen"
              className="h-[24px] w-auto"
            />

            <Link
              href="/volkswagen"
              className="hidden text-[13px] font-bold md:block"
            >
              Menu
            </Link>

            <Link
              href="/volkswagen"
              className="hidden text-[13px] font-bold md:block"
            >
              Configure seu novo Volkswagen
            </Link>

            <Link
              href="/volkswagen"
              className="hidden text-[13px] font-bold md:block"
            >
              Conheça nossas ofertas
            </Link>

            <Link
              href="/volkswagen"
              className="hidden text-[13px] font-bold md:block"
            >
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
              onClick={() => {
                setStep(key as Step);
                if (key !== "interior") setView("front");
              }}
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

      {editMessage && (
        <div className="fixed left-0 top-[88px] z-[120] w-full bg-[#001e50] px-4 py-2 text-center text-[12px] font-bold text-white">
          {editMessage}
        </div>
      )}

      <section className="grid min-h-screen grid-cols-1 pb-[78px] pt-[88px] lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)] lg:pb-[70px]">
        <div className="builder-vw-stage relative min-h-[58vh] overflow-hidden bg-white lg:min-h-[calc(100vh-158px)]">
          {step !== "resumo" ? (
            <>
              {currentImage ? (
                <div className="flex h-[58vh] w-full items-center justify-center overflow-visible bg-white px-2 py-3 md:px-4 lg:h-[calc(100vh-158px)] lg:px-5">
                  <img
                    key={`${step}-${
                      step === "interior" ? interiorView : view
                    }-${currentImage}`}
                    src={currentImage}
                    alt={vehicle.name}
                    className="builder-vw-image h-full w-full object-contain"
                    draggable={false}
                  />
                </div>
              ) : (
                <div className="flex h-[58vh] items-center justify-center bg-white text-sm font-black uppercase text-[#001e50]/40 lg:h-[calc(100vh-138px)]">
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
                          interiorView === key
                            ? "bg-[#001e50] text-white"
                            : "text-[#001e50]"
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
                          view === key
                            ? "bg-[#001e50] text-white"
                            : "text-[#001e50]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
              </div>

              <div className="absolute bottom-8 right-8 hidden gap-2 rounded-md bg-white px-3 py-2 shadow md:flex">
                <ImageIcon className="h-5 w-5" />
                <Car className="h-5 w-5" />
              </div>
            </>
          ) : (
            <div className="mx-auto grid max-w-[1420px] grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:px-10 xl:px-14">
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_55px_rgba(0,30,80,0.08)]">
                  <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(0,85,216,0.08),transparent_48%),#ffffff] p-6">
                    {currentImage ? (
                      <img
                        src={currentImage}
                        alt={vehicle.name}
                        className="builder-vw-summary-car h-full max-h-[430px] w-full scale-[1.08] object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="text-sm font-black uppercase text-[#001e50]/35">
                        Sem imagem cadastrada
                      </div>
                    )}

                    <div className="absolute left-6 top-6 rounded-full bg-[#001e50] px-4 py-2 text-[12px] font-bold text-white">
                      Configuração selecionada
                    </div>
                  </div>

                  <div className="grid gap-6 border-t border-black/10 p-6 md:grid-cols-[1fr_auto] md:items-end">
                    <div>
                      <p className="text-[13px] font-bold text-[#0055d8]">
                        {vehicle.name}
                      </p>

                      <h1 className="mt-1 text-[34px] font-bold leading-tight tracking-[-0.04em] md:text-[42px]">
                        {selectedVersion.name}
                      </h1>

                      <p className="mt-3 max-w-[760px] text-[14px] leading-6 text-[#001e50]/70">
                        {vehicle.fullName}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#f4f7fb] p-5 text-left md:min-w-[230px]">
                      <p className="text-[12px] font-bold uppercase text-[#001e50]/55">
                        Preço total
                      </p>
                      <strong className="mt-1 block text-[28px] leading-none">
                        {money(total)}
                      </strong>
                      <p className="mt-3 text-[13px] text-[#001e50]/65">
                        Simulação em 108x: <strong>{money(monthly)}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <SummaryBox
                    title="1. Versão selecionada"
                    main={selectedVersion.name}
                    sub={selectedVersion.description || vehicle.fullName}
                    right={money(selectedVersion.price)}
                    footer={`${selectedVersion.fuel} • ${selectedVersion.transmission}`}
                  />

                  <SummaryBox
                    title="2. Motor selecionado"
                    main={selectedMotor.name}
                    sub={selectedMotor.description}
                    right=""
                    footer={`Potência ${selectedMotor.power}${
                      selectedMotor.torque
                        ? ` • Torque ${selectedMotor.torque}`
                        : ""
                    }`}
                  />

                  <SummaryBox
                    title="3. Exterior selecionado"
                    main={selectedColor.name}
                    sub={
                      selectedColor.price === 0
                        ? "Sem custos adicionais"
                        : money(selectedColor.price)
                    }
                    right=""
                    footer={selectedColor.type}
                    color={selectedColor.hex}
                  />

                  <SummaryBox
                    title="4. Interior selecionado"
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
              </div>

              <aside className="h-fit rounded-[28px] border border-black/10 bg-[#f7f9fc] p-5 shadow-[0_18px_55px_rgba(0,30,80,0.08)] lg:sticky lg:top-[112px] lg:p-6">
                <div className="rounded-3xl bg-white p-5 shadow-sm">
                  <p className="text-center text-[13px] font-bold text-[#0055d8]">
                    {vehicle.name}. {selectedVersion.name}
                  </p>

                  <h2 className="mt-2 text-center text-[30px] font-bold tracking-[-0.04em]">
                    Finalizar configuração
                  </h2>

                  <div className="mt-6 rounded-2xl bg-[#001e50] p-5 text-white">
                    <div className="flex justify-between gap-4 text-[14px]">
                      <span>Preço Total</span>
                      <strong>{money(total)}</strong>
                    </div>

                    <div className="mt-3 flex justify-between gap-4 border-t border-white/15 pt-3 text-[13px] text-white/80">
                      <span>Simulação 108x</span>
                      <strong>{money(monthly)}</strong>
                    </div>
                  </div>
                </div>

                <PaymentChoiceBox
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  total={total}
                  consortiumPlan={suggestedConsortiumPlan}
                  selectedMonths={selectedConsortiumMonths}
                  setSelectedMonths={setSelectedConsortiumMonths}
                  selectedInstallment={selectedConsortiumInstallment}
                />

                <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-[15px] font-bold uppercase">
                      Dados do cliente
                    </h3>

                    <p className="mt-1 text-[12px] leading-tight text-[#001e50]/60">
                      Esses dados seguem para a análise, consulta de CPF e contrato
                      junto com o Volkswagen configurado.
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
                        setCustomerErrors((prev) => ({
                          ...prev,
                          clientName: "",
                        }));
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
                        setCustomerErrors((prev) => ({
                          ...prev,
                          clientCpf: "",
                        }));
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
                        setCustomerErrors((prev) => ({
                          ...prev,
                          clientEmail: "",
                        }));
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
                        setCustomerErrors((prev) => ({
                          ...prev,
                          clientPhone: "",
                        }));
                      }
                    }}
                  />

                  <CustomerField
                    label="Vendedor"
                    value={sellerName}
                    error={customerErrors.sellerName}
                    placeholder="Nome do vendedor"
                    onChange={(value) => {
                      setSellerName(value);
                      if (customerErrors.sellerName) {
                        setCustomerErrors((prev) => ({
                          ...prev,
                          sellerName: "",
                        }));
                      }
                    }}
                  />

                  <div className="mt-4 rounded-2xl border border-black/10 bg-[#f4f7fb] p-4 text-[12px] leading-tight text-[#001e50]/75">
                    <strong>Prévia:</strong> {clientName || "Cliente"} será
                    enviado para análise com CPF {clientCpf || "---"}, veículo{" "}
                    {selectedVersion.name}, cor {selectedColor?.name || "---"},
                    valor {money(total)} e forma de pagamento {paymentType === "consorcio" ? "consórcio" : "financiamento"}.
                  </div>

                  <button
                    onClick={saveOrderAndGoAnalysis}
                    disabled={savingOrder}
                    className="mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-[#0055d8] text-[14px] font-bold text-white shadow-lg transition hover:bg-[#0044ad] disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                  >
                    {savingOrder
                      ? "Salvando pedido..."
                      : "Concluir e ir para análise"}
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </aside>
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

                  <button
                    className="rounded-full border border-[#001e50] px-4 py-2 text-[13px]"
                    type="button"
                  >
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
                            vehicle.motors.find(
                              (motor) => motor.versionId === version.id
                            ) || vehicle.motors[0];

                          const nextColor =
                            vehicle.colors.find(
                              (color) => color.versionId === version.id
                            ) || vehicle.colors[0];

                          setSelectedVersion(version);
                          if (nextMotor) setSelectedMotor(nextMotor);
                          if (nextColor) setSelectedColor(nextColor);
                          setView("front");
                        }}
                        className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="text-[18px] font-bold">
                              {version.name}
                            </h3>
                            <p className="mt-2 text-[13px]">
                              {version.description}
                            </p>
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
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {version.fuel}
                          </span>
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {version.transmission}
                          </span>
                        </div>

                        <strong className="mt-4 block">
                          {money(version.price)}
                        </strong>
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

                <h1 className="text-[34px] font-bold">
                  {availableMotors.length} Motor
                </h1>

                <div className="mt-6 space-y-4">
                  {availableMotors.map((motor) => {
                    const active = selectedMotor.id === motor.id;

                    return (
                      <button
                        key={motor.id}
                        onClick={() => {
                          setSelectedMotor(motor);
                          setView("front");
                        }}
                        className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md ${
                          active ? "border-[#159447]" : "border-black/15"
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="text-[17px] font-bold">
                              {motor.name}
                            </h3>
                            <p className="mt-1">{motor.description}</p>
                          </div>

                          {active && (
                            <Check className="h-5 w-5 shrink-0 rounded-full bg-[#159447] text-white" />
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
                          <span className="bg-[#eef2f5] px-2 py-1">
                            {motor.fuel}
                          </span>
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
                          {motor.acceleration ? (
                            <strong>{motor.acceleration}</strong>
                          ) : null}

                          {motor.maxSpeed ? <span>Vel. máxima</span> : null}
                          {motor.maxSpeed ? (
                            <strong>{motor.maxSpeed}</strong>
                          ) : null}
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

                <h1 className="text-[34px] font-bold">
                  {availableColors.length} Exterior
                </h1>

                {Array.from(
                  new Set(availableColors.map((item) => item.type || "Cores"))
                ).map((type) => (
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
                            onClick={() => {
                              setSelectedColor(color);
                              setView("front");
                            }}
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

                <h1 className="text-[34px] font-bold">
                  {vehicle.interiors.length} Interior
                </h1>

                <p className="mt-8 text-[15px] font-bold">
                  Referências internas
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    [
                      "steeringWheel",
                      "Volante",
                      "Cadastre uma imagem com nome contendo Volante",
                    ],
                    ["seat", "Banco", "Cadastre uma imagem com nome contendo Banco"],
                  ].map(([key, label, hint]) => {
                    const viewKey = key as InteriorViewKey;
                    const ref = getInteriorReference(vehicle, viewKey);
                    const active = interiorView === viewKey;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setInteriorView(viewKey);
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

                <p className="mt-8 text-[15px] font-bold">
                  Outros acabamentos internos
                </p>

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
                              <p className="mt-1 text-xs text-[#001e50]/70">
                                {interior.description}
                              </p>
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
            disabled={savingOrder}
            className="flex h-[44px] shrink-0 items-center gap-2 rounded-full bg-[#0055d8] px-5 text-[14px] font-bold text-white shadow-lg transition hover:bg-[#0044ad] disabled:cursor-not-allowed disabled:opacity-70 md:px-8"
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
        .builder-vw-stage {
          background:
            radial-gradient(circle at center, rgba(0, 30, 80, 0.035), transparent 46%),
            #ffffff;
        }

        .builder-vw-image {
          width: 100%;
          height: 100%;
          max-width: 108%;
          max-height: 108%;
          object-fit: contain;
          object-position: center;
          animation: builderVwImage 0.35s ease-out;
          image-rendering: auto;
          filter: contrast(1.035) saturate(1.035);
          transform: scale(1.1);
        }

        .builder-vw-summary-car {
          animation: builderSummaryCar 0.45s cubic-bezier(0.22, 1, 0.36, 1);
          filter: contrast(1.035) saturate(1.035);
        }

        @media (min-width: 1024px) {
          .builder-vw-image {
            max-width: 112%;
            max-height: 112%;
            transform: scale(1.14);
          }
        }

        @keyframes builderVwImage {
          from {
            opacity: 0;
            transform: translateY(8px) scale(1.06);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1.1);
          }
        }

        @media (min-width: 1024px) {
          @keyframes builderVwImage {
            from {
              opacity: 0;
              transform: translateY(8px) scale(1.1);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1.14);
            }
          }
        }

        @keyframes builderSummaryCar {
          from {
            opacity: 0;
            transform: translateY(14px) scale(1.04);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1.08);
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

function PaymentChoiceBox({
  paymentType,
  setPaymentType,
  total,
  consortiumPlan,
  selectedMonths,
  setSelectedMonths,
  selectedInstallment,
}: {
  paymentType: PaymentType;
  setPaymentType: (value: PaymentType) => void;
  total: number;
  consortiumPlan: ConsortiumPlan;
  selectedMonths: number;
  setSelectedMonths: (value: number) => void;
  selectedInstallment: ConsortiumInstallment;
}) {
  return (
    <div className="mt-5 rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-[15px] font-bold uppercase">Forma de pagamento</h3>
        <p className="mt-1 text-[12px] leading-tight text-[#001e50]/60">
          Escolha se o cliente seguirá para análise como consórcio ou financiamento.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[#eef2f7] p-1">
        <button
          type="button"
          onClick={() => setPaymentType("consorcio")}
          className={`h-10 rounded-xl text-[12px] font-bold transition ${
            paymentType === "consorcio"
              ? "bg-[#001e50] text-white shadow"
              : "text-[#001e50]/70 hover:bg-white"
          }`}
        >
          Consórcio
        </button>

        <button
          type="button"
          onClick={() => setPaymentType("financiamento")}
          className={`h-10 rounded-xl text-[12px] font-bold transition ${
            paymentType === "financiamento"
              ? "bg-[#001e50] text-white shadow"
              : "text-[#001e50]/70 hover:bg-white"
          }`}
        >
          Financiamento
        </button>
      </div>

      {paymentType === "consorcio" ? (
        <div className="mt-4 rounded-2xl border border-[#0055d8]/20 bg-[#f4f7fb] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase text-[#0055d8]">
                Plano sugerido
              </p>
              <h4 className="mt-1 text-[18px] font-bold">
                Crédito {money(consortiumPlan.credit)}
              </h4>
              <p className="mt-1 text-[11px] text-[#001e50]/60">
                {consortiumPlan.tableName} • Código {consortiumPlan.code} • Taxa adm. {consortiumPlan.adminTax}%
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#001e50] shadow-sm">
              Valor do carro: {money(total)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {consortiumPlan.installments.map((item) => {
              const active = selectedMonths === item.months;

              return (
                <button
                  key={item.months}
                  type="button"
                  onClick={() => setSelectedMonths(item.months)}
                  className={`rounded-2xl border p-3 text-left transition ${
                    active
                      ? "border-[#159447] bg-white shadow"
                      : "border-black/10 bg-white/70 hover:bg-white"
                  }`}
                >
                  <span className="block text-[11px] font-bold text-[#001e50]/55">
                    {item.months}x
                  </span>
                  <strong className="mt-1 block text-[13px]">
                    {money(item.value)}
                  </strong>
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-white p-3 text-[12px] text-[#001e50]/70">
            Selecionado: <strong>{selectedInstallment.months}x de {money(selectedInstallment.value)}</strong>.
            O sistema usa o primeiro crédito igual ou acima do valor configurado.
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-black/10 bg-[#f4f7fb] p-4 text-[12px] leading-5 text-[#001e50]/70">
          <strong>Financiamento selecionado.</strong> O valor {money(total)} será enviado para a análise para simulação manual/financeira.
          Quando seu cliente enviar a tabela de financiamento, dá para automatizar as parcelas igual ao consórcio.
        </div>
      )}
    </div>
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
    <div className="h-full rounded-3xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(0,30,80,0.06)]">
      <h3 className="text-[13px] font-bold uppercase text-[#0055d8]">
        {title}
      </h3>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <strong className="block text-[16px] leading-tight">{main}</strong>
          <p className="mt-2 text-[13px] leading-5 text-[#001e50]/65">{sub}</p>
        </div>

        {color ? (
          <span
            className="h-[58px] w-[58px] shrink-0 rounded-full border border-black/20 shadow-inner"
            style={{ background: color }}
          />
        ) : right ? (
          <strong className="text-[15px]">{right}</strong>
        ) : null}
      </div>

      {footer && (
        <div className="mt-5 border-t border-black/10 pt-4 text-[13px] text-[#001e50]/75">
          {footer}
        </div>
      )}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
}) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-[#001e50]/50">
        {label}
      </label>

      <input
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`h-10 w-full rounded-xl border bg-white px-3 text-[12px] font-bold outline-none transition focus:border-[#0055d8] ${
          error ? "border-red-400 bg-red-50" : "border-black/15"
        }`}
      />

      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-600">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      ) : null}
    </div>
  );
}