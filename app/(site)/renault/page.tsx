"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
  LogOut,
  LogIn,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Fuel,
  Ruler,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

/* =========================================================
   PALETA
========================================================= */

const R = {
  yellow: "#FFCC33",
  yellowDark: "#E6B800",
  black: "#0A0A0A",
  ink: "#111111",
  gray: "#F4F4F4",
  border: "#E5E5E5",
  muted: "#6B6B6B",
};

/* =========================================================
   IMAGENS DOS CARROS
========================================================= */

const CARS =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars";

const CAR_IMAGES = {
  kwid:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/_vn_unique_ONE_DACIA_PP_XLARGE_DENSITY2_r_brandSite_carPicker_1.png_uri=https___br.co.rplug.renault.png",

  kardian:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/kardian.png",

  duster:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/duster.png",

  oroch:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/oroch%20r.png",

  boreal:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/boreal.png",

  megane:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/megane.png",

  /* KWID */

  kwidBranco:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/KWID/branco.jpg",

  kwidPreto:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/KWID/preto.jpg",

  kwidPrata:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/KWID/prata.jpg",

  kwidLaranja:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/KWID/vermelho.jpg",

  /* KARDIAN */

  kardianPreto:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/kardian/preto.jpg",

  kardianBranco:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/kardian/branco.jpg",

  kardianCinza:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/kardian/cinza.jpg",

  kardianVermelho:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/kardian/Image.jpg",

  /* DUSTER */

  dusterBranco:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/duster/branco.jpg",

  dusterPreto:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/duster/preto.jpg",

  dusterLaranja:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/duster/pratar.jpg",

  dusterCinza:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/duster/cinza.jpg",

  /* OROCH */

  orochBranco:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/oroch/branco%20gooler.jpg",

  orochPreto:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/oroch/preto.jpg",

  orochPrata:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/oroch/prata%20etolle.jpg",

  orochvermelho:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/oroch/vermelho.jpg",

  /* BOREAL */

  borealPreto:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/boreal/preto.jpg",

  borealBranco:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/brancor.jpg",

  borealCinza:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/boreal/cinza.jpg",

  borealprata: "",

  /* MEGANE */

  meganeBranco:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/megane/cinza.png",

  meganePreto:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/megane/cinza%20mercurio.png",

  meganeAzul:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/RENAULT/megane/megane.jpeg",
};

/* =========================================================
   HELPER
========================================================= */

function imageOrFallback(image: string, fallback: string) {
  if (!image || image.startsWith("COLE_AQUI")) {
    return fallback;
  }

  return image;
}

/* =========================================================
   TIPOS
========================================================= */

type ColorItem = {
  id: string;
  name: string;
  swatch: string;
  extraPrice: number;
  image: string;
};

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  fuel: string;
  transmission: string;
  power: string;
  seats: number;
  length: string;
  highlights: string[];
};

type Vehicle = {
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  category: "Passeio" | "SUV" | "Picape" | "Elétrico";
  priceStart: number;
  cover: string;
  fuelLabel: string;
  seats: number;
  lengthM: string;
  versions: VersionItem[];
  colors: ColorItem[];
};

/* =========================================================
   VEÍCULOS
========================================================= */

const VEHICLES: Vehicle[] = [
  {
    slug: "kwid",
    name: "Renault Kwid",
    shortName: "KWID",
    tagline: "Compacto com atitude",
    category: "Passeio",
    priceStart: 82790,
    cover: CAR_IMAGES.kwid,
    fuelLabel: "flex",
    seats: 5,
    lengthM: "3,73",

    versions: [
      {
        id: "zen",
        title: "Zen 1.0",
        subtitle: "Entrada",
        price: 82790,
        fuel: "Flex",
        transmission: "Manual",
        power: "70 cv",
        seats: 5,
        length: "3,73 m",
        highlights: [
          "Ar-condicionado",
          "Direção elétrica",
          "Vidros elétricos",
          "ISOFIX",
        ],
      },
      {
        id: "intense",
        title: "Intense 1.0",
        subtitle: "Mais completo",
        price: 87990,
        fuel: "Flex",
        transmission: "Manual",
        power: "70 cv",
        seats: 5,
        length: "3,73 m",
        highlights: [
          "Central multimídia",
          "Câmera de ré",
          "Rodas de liga",
          "Ar-condicionado",
        ],
      },
      {
        id: "outsider",
        title: "Outsider 1.0",
        subtitle: "Visual aventureiro",
        price: 91990,
        fuel: "Flex",
        transmission: "Manual",
        power: "70 cv",
        seats: 5,
        length: "3,73 m",
        highlights: [
          "Kit Outsider",
          "Multimídia",
          "Câmera de ré",
          "Acabamento exclusivo",
        ],
      },
    ],

    colors: [
      {
        id: "branco",
        name: "Branco Glacier",
        swatch: "#F5F5F0",
        extraPrice: 0,
        image: imageOrFallback(
          CAR_IMAGES.kwidBranco,
          CAR_IMAGES.kwid
        ),
      },
      {
        id: "preto",
        name: "Preto Nacré",
        swatch: "#1A1A1A",
        extraPrice: 1000,
        image: imageOrFallback(
          CAR_IMAGES.kwidPreto,
          CAR_IMAGES.kwid
        ),
      },
      {
        id: "prata",
        name: "Prata Étoile",
        swatch: "#C5C5C5",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.kwidPrata,
          CAR_IMAGES.kwid
        ),
      },
      {
        id: "vermelho",
        name: "Vermelho",
        swatch: "#e80404",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.kwidLaranja,
          CAR_IMAGES.kwid
        ),
      },
    ],
  },

  {
    slug: "kardian",
    name: "Renault Kardian",
    shortName: "KARDIAN",
    tagline: "SUV compacto de nova geração",
    category: "SUV",
    priceStart: 113990,
    cover: CAR_IMAGES.kardian,
    fuelLabel: "flex",
    seats: 5,
    lengthM: "4,12",

    versions: [
      {
        id: "authentic",
        title: "Authentic 1.0T AT",
        subtitle: "A partir de",
        price: 113990,
        fuel: "Flex",
        transmission: "Automática",
        power: "1.0 Turbo",
        seats: 5,
        length: "4,12 m",
        highlights: [
          "Motor 1.0 Turbo",
          "Câmbio automático",
          "Central multimídia",
          "Câmera de ré",
          "6 airbags",
          "Controle de estabilidade",
        ],
      },
      {
        id: "evolution",
        title: "Evolution 1.0T AT",
        subtitle: "Mais equipamento",
        price: 124990,
        fuel: "Flex",
        transmission: "Automática",
        power: "1.0 Turbo",
        seats: 5,
        length: "4,12 m",
        highlights: [
          "Ar digital",
          "Sensor de estacionamento",
          "Rodas de liga",
          "Multimídia",
          "Câmera de ré",
          "Keyless",
        ],
      },
      {
        id: "techno",
        title: "Techno 1.0T EDC",
        subtitle: "Topo de linha",
        price: 139990,
        fuel: "Flex",
        transmission: "EDC",
        power: "1.0 Turbo",
        seats: 5,
        length: "4,12 m",
        highlights: [
          "Câmbio EDC",
          "ADAS",
          "Câmera 360º",
          "Ar dual zone",
          "Bancos Geometric",
          'Rodas 17"',
        ],
      },
    ],

    colors: [
      {
        id: "preto-nacre",
        name: "Preto Nacré",
        swatch: "#1A1A1A",
        extraPrice: 0,
        image: imageOrFallback(
          CAR_IMAGES.kardianPreto,
          CAR_IMAGES.kardian
        ),
      },
      {
        id: "branco",
        name: "Branco Glacier",
        swatch: "#F5F5F0",
        extraPrice: 1000,
        image: imageOrFallback(
          CAR_IMAGES.kardianBranco,
          CAR_IMAGES.kardian
        ),
      },
      {
        id: "cinza",
        name: "Cinza Cassiopée",
        swatch: "#5A5A5A",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.kardianCinza,
          CAR_IMAGES.kardian
        ),
      },
      {
        id: "prata",
        name: "Prata",
        swatch: "#b1b1b1",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.kardianVermelho,
          CAR_IMAGES.kardian
        ),
      },
    ],
  },

  {
    slug: "duster",
    name: "Renault Duster",
    shortName: "DUSTER",
    tagline: "SUV para qualquer caminho",
    category: "SUV",
    priceStart: 131990,
    cover: CAR_IMAGES.duster,
    fuelLabel: "flex",
    seats: 5,
    lengthM: "4,38",

    versions: [
      {
        id: "zen",
        title: "Zen 1.6",
        subtitle: "SUV acessível",
        price: 131990,
        fuel: "Flex",
        transmission: "Manual",
        power: "120 cv",
        seats: 5,
        length: "4,38 m",
        highlights: [
          "Ar-condicionado",
          "Multimídia",
          "Câmera de ré",
          "6 airbags",
        ],
      },
      {
        id: "intense",
        title: "Intense 1.6 CVT",
        subtitle: "Automático",
        price: 144990,
        fuel: "Flex",
        transmission: "CVT",
        power: "120 cv",
        seats: 5,
        length: "4,38 m",
        highlights: [
          "CVT",
          "Ar dual zone",
          "Sensores",
          'Rodas 17"',
        ],
      },
      {
        id: "iconic",
        title: "Iconic 1.3 Turbo",
        subtitle: "Performance",
        price: 159990,
        fuel: "Flex",
        transmission: "CVT",
        power: "1.3 Turbo",
        seats: 5,
        length: "4,38 m",
        highlights: [
          "Turbo",
          "Keyless",
          "Câmera 360º",
          "ADAS",
        ],
      },
    ],

    colors: [
      {
        id: "branco",
        name: "Branco Glacier",
        swatch: "#F5F5F0",
        extraPrice: 0,
        image: imageOrFallback(
          CAR_IMAGES.dusterBranco,
          CAR_IMAGES.duster
        ),
      },
      {
        id: "preto",
        name: "Preto Nacré",
        swatch: "#1A1A1A",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.dusterPreto,
          CAR_IMAGES.duster
        ),
      },
      {
        id: "prata",
        name: "Prata",
        swatch: "#cccccc",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.dusterLaranja,
          CAR_IMAGES.duster
        ),
      },
      {
        id: "cinza",
        name: "Cinza Cassiopée",
        swatch: "#5A5A5A",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.dusterCinza,
          CAR_IMAGES.duster
        ),
      },
    ],
  },

  {
    slug: "oroch",
    name: "Renault Oroch",
    shortName: "OROCH",
    tagline: "Picape média versátil",
    category: "Picape",
    priceStart: 126690,
    cover: CAR_IMAGES.oroch,
    fuelLabel: "flex",
    seats: 5,
    lengthM: "4,72",

    versions: [
      {
        id: "zen",
        title: "Zen 1.6",
        subtitle: "Trabalho e lazer",
        price: 126690,
        fuel: "Flex",
        transmission: "Manual",
        power: "120 cv",
        seats: 5,
        length: "4,72 m",
        highlights: [
          "Caçamba ampla",
          "Ar-condicionado",
          "Multimídia",
          "Câmera de ré",
        ],
      },
      {
        id: "intense",
        title: "Intense 1.3 Turbo",
        subtitle: "Turbo + CVT",
        price: 149990,
        fuel: "Flex",
        transmission: "CVT",
        power: "1.3 Turbo",
        seats: 5,
        length: "4,72 m",
        highlights: [
          "Motor turbo",
          "CVT",
          "Ar digital",
          "Rodas de liga",
        ],
      },
    ],

    colors: [
      {
        id: "branco",
        name: "Branco Glacier",
        swatch: "#F5F5F0",
        extraPrice: 0,
        image: imageOrFallback(
          CAR_IMAGES.orochBranco,
          CAR_IMAGES.oroch
        ),
      },
      {
        id: "preto",
        name: "Preto Nacré",
        swatch: "#1A1A1A",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.orochPreto,
          CAR_IMAGES.oroch
        ),
      },
      {
        id: "prata",
        name: "Prata Étoile",
        swatch: "#C5C5C5",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.orochPrata,
          CAR_IMAGES.oroch
        ),
      },
      {
        id: "vermelho",
        name: "Vermelho",
        swatch: "#d30000",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.orochvermelho,
          CAR_IMAGES.oroch
        ),
      },
    ],
  },

  {
    slug: "boreal",
    name: "Renault Boreal",
    shortName: "BOREAL",
    tagline: "Novo SUV médio",
    category: "SUV",
    priceStart: 179990,
    cover: CAR_IMAGES.boreal,
    fuelLabel: "flex",
    seats: 5,
    lengthM: "4,56",

    versions: [
      {
        id: "evolution",
        title: "Evolution",
        subtitle: "Novo patamar",
        price: 179990,
        fuel: "Flex",
        transmission: "Automática",
        power: "Turbo",
        seats: 5,
        length: "4,56 m",
        highlights: [
          "SUV médio",
          "Multimídia avançada",
          "Segurança ativa",
          "Conforto premium",
        ],
      },
      {
        id: "techno",
        title: "Techno",
        subtitle: "Tecnologia",
        price: 199990,
        fuel: "Flex",
        transmission: "Automática",
        power: "Turbo",
        seats: 5,
        length: "4,56 m",
        highlights: [
          "ADAS",
          "Câmera 360º",
          "Ar dual zone",
          "Acabamento premium",
        ],
      },
    ],

    colors: [
      {
        id: "preto",
        name: "Preto Nacré",
        swatch: "#1A1A1A",
        extraPrice: 0,
        image: imageOrFallback(
          CAR_IMAGES.borealPreto,
          CAR_IMAGES.boreal
        ),
      },
      {
        id: "branco",
        name: "Branco Glacier",
        swatch: "#F5F5F0",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.borealBranco,
          CAR_IMAGES.boreal
        ),
      },
      {
        id: "cinza",
        name: "Cinza Cassiopée",
        swatch: "#5A5A5A",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.borealCinza,
          CAR_IMAGES.boreal
        ),
      },
      {
        id: "prata",
        name: "Boreal",
        swatch: "#9ee4e4",
        extraPrice: 1900,
        image: imageOrFallback(
          CAR_IMAGES.borealprata,
          CAR_IMAGES.boreal
        ),
      },
    ],
  },

  {
    slug: "megane-e-tech",
    name: "Renault Megane E-Tech",
    shortName: "MEGANE",
    tagline: "100% elétrico",
    category: "Elétrico",
    priceStart: 279990,
    cover: CAR_IMAGES.megane,
    fuelLabel: "100% elétrico",
    seats: 5,
    lengthM: "4,20",

    versions: [
      {
        id: "techno",
        title: "Techno EV",
        subtitle: "Elétrico",
        price: 279990,
        fuel: "Elétrico",
        transmission: "Automática",
        power: "EV",
        seats: 5,
        length: "4,20 m",
        highlights: [
          "Zero emissão",
          "Autonomia elevada",
          "Recarga rápida",
          "ADAS",
        ],
      },
    ],

    colors: [
      {
        id: "cinza",
        name: "Cinza",
        swatch: "#F5F5F0",
        extraPrice: 0,
        image: imageOrFallback(
          CAR_IMAGES.meganeBranco,
          CAR_IMAGES.megane
        ),
      },
      {
        id: "mercurio",
        name: "Cinza Mercurio",
        swatch: "#1A1A1A",
        extraPrice: 2000,
        image: imageOrFallback(
          CAR_IMAGES.meganePreto,
          CAR_IMAGES.megane
        ),
      },
      {
        id: "azul",
        name: "Azul Iron",
        swatch: "#1B3A4B",
        extraPrice: 2000,
        image: imageOrFallback(
          CAR_IMAGES.meganeAzul,
          CAR_IMAGES.megane
        ),
      },
    ],
  },
];

/* =========================================================
   FUNÇÕES
========================================================= */

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function maskCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);

  if (d.length <= 2) return d;

  if (d.length <= 7) {
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  }

  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

type BuilderStep = "version" | "color" | "summary";

const INPUT =
  "h-12 w-full rounded-xl border border-[#E5E5E5] bg-white px-4 text-sm text-[#111] outline-none transition-all duration-300 placeholder:text-[#999] hover:border-[#BBB] focus:border-black focus:ring-4 focus:ring-black/[0.04]";

/* =========================================================
   COMPONENTE
========================================================= */

export default function RenaultPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fullName, setFullName] = useState("");

  const currentUserIdRef = useRef<string | null>(null);

  const [filter, setFilter] = useState("Todos");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [versionId, setVersionId] = useState("");
  const [colorId, setColorId] = useState("");
  const [builderStep, setBuilderStep] =
    useState<BuilderStep>("version");

  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSeller, setClientSeller] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  /* =======================================================
     AUTH
  ======================================================= */

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name || "");
        setUserRole(data.role || "vendedor");
      }
    } catch {}
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!active) return;

        const u = session?.user ?? null;

        setUser(u);
        currentUserIdRef.current = u?.id ?? null;
        setLoadingAuth(false);

        if (u?.id) {
          void fetchProfile(u.id);
        }
      } catch {
        if (active) {
          setLoadingAuth(false);
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_e: AuthChangeEvent, session: Session | null) => {
        if (!active) return;

        const u = session?.user ?? null;

        setUser(u);
        currentUserIdRef.current = u?.id ?? null;
        setLoadingAuth(false);

        if (!u?.id) {
          setFullName("");
          setUserRole(null);
          return;
        }

        void fetchProfile(u.id);
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (fullName && !clientSeller) {
      setClientSeller(fullName);
    }
  }, [fullName, clientSeller]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setFullName("");
      setUserRole(null);

      router.push("/login");
      router.refresh();
    }
  };

  /* =======================================================
     PERMISSÕES
  ======================================================= */

  const role = (userRole || "").toLowerCase();
  const email = (user?.email || "").toLowerCase();

  const isAdmin =
    role === "admin" || email.includes("admin");

  const isSupervisor =
    role === "supervisor" || email.startsWith("s");

  const dashboardLink = isAdmin
    ? "/admin"
    : isSupervisor
    ? "/supervisor/dashboard"
    : "/vendedor/dashboard";

  const dashboardLabel = isAdmin
    ? "Painel Gerencial"
    : isSupervisor
    ? "Painel do Supervisor"
    : "Painel do Vendedor";

  const displayName =
    fullName || user?.email?.split("@")[0];

  /* =======================================================
     FILTROS
  ======================================================= */

  const filters = [
    "Todos",
    "Passeio",
    "SUV",
    "Picape",
    "Elétrico",
  ];

  const list =
    filter === "Todos"
      ? VEHICLES
      : VEHICLES.filter(
          (v) => v.category === filter
        );

  /* =======================================================
     CONFIGURADOR
  ======================================================= */

  const version =
    vehicle?.versions.find(
      (v) => v.id === versionId
    ) ?? null;

  const color =
    vehicle?.colors.find(
      (c) => c.id === colorId
    ) ??
    vehicle?.colors[0] ??
    null;

  const extra = color?.extraPrice ?? 0;

  const total =
    (version?.price ?? 0) + extra;

  const photo =
    color?.image ||
    vehicle?.cover ||
    "";

  const openBuilder = (car: Vehicle) => {
    const first = car.versions[0];

    setVehicle(car);
    setVersionId(first.id);
    setColorId(car.colors[0]?.id ?? "");
    setBuilderStep("version");
    setClosing(false);
    setFormError("");
  };

  const closeBuilder = useCallback(() => {
    setClosing(true);

    setTimeout(() => {
      setVehicle(null);
      setClosing(false);
      setBuilderStep("version");
    }, 280);
  }, []);

  /* =======================================================
     VALIDAÇÃO
  ======================================================= */

  const validateClient = () => {
    if (!clientName.trim()) {
      return "Informe o nome do cliente.";
    }

    if (
      !/^\d{11}$/.test(
        clientCpf.replace(/\D/g, "")
      )
    ) {
      return "CPF inválido.";
    }

    if (!clientEmail.includes("@")) {
      return "E-mail inválido.";
    }

    if (
      clientPhone.replace(/\D/g, "").length < 10
    ) {
      return "Telefone inválido.";
    }

    if (!clientSeller.trim()) {
      return "Informe o vendedor.";
    }

    return "";
  };

  /* =======================================================
     ENVIO
  ======================================================= */

  const goToAnalise = () => {
    const err = validateClient();

    if (err) {
      setFormError(err);
      return;
    }

    if (!vehicle || !version || !color) {
      return;
    }

    const payload = {
      source: "renault-builder",
      status: "configured",
      brand: "renault",

      vehicle_slug: vehicle.slug,
      vehicle_name: vehicle.name,
      vehicle_title: vehicle.name,
      vehicle_description: version.subtitle,

      vehicle_image:
        color.image || vehicle.cover,

      version: {
        id: version.id,
        name: version.title,
        description: version.subtitle,
        price: version.price,
        image:
          color.image || vehicle.cover,
      },

      color: {
        id: color.id,
        name: color.name,
        description: color.name,
        price: extra,
        image:
          color.image || vehicle.cover,
        hex: color.swatch,
        versionId: version.id,
      },

      client: {
        full_name: clientName.trim(),
        cpf: clientCpf.replace(/\D/g, ""),
        email: clientEmail
          .trim()
          .toLowerCase(),
        phone: clientPhone.replace(
          /\D/g,
          ""
        ),
        seller: clientSeller.trim(),
      },

      kits: [],
      accessories: [],

      totals: {
        vehicle: version.price,
        color: extra,
        kits: 0,
        accessories: 0,
        total,
      },
    };

    localStorage.setItem(
      "wb_builder_order",
      JSON.stringify(payload)
    );

    localStorage.setItem(
      "wb_analysis_order",
      JSON.stringify(payload)
    );

    router.push("/vendedor/analise");
  };

  const steps: {
    id: BuilderStep;
    label: string;
  }[] = [
    {
      id: "version",
      label: "Versão",
    },
    {
      id: "color",
      label: "Cor",
    },
    {
      id: "summary",
      label: "Resumo",
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        * {
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden;
        }

        /* =================================================
           ANIMAÇÕES DE INTERFACE
        ================================================= */

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes pulseGlow {
          0%,
          100% {
            opacity: 0.15;
            transform: scale(1);
          }

          50% {
            opacity: 0.28;
            transform: scale(1.08);
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-up {
          animation:
            fadeUp 0.8s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .animate-fade-in {
          animation: fadeIn 0.7s ease both;
        }

        .animate-modal {
          animation:
            modalIn 0.45s
            cubic-bezier(0.22, 1, 0.36, 1)
            both;
        }

        .delay-100 {
          animation-delay: 100ms;
        }

        .delay-200 {
          animation-delay: 200ms;
        }

        .delay-300 {
          animation-delay: 300ms;
        }

        .delay-400 {
          animation-delay: 400ms;
        }

        .delay-500 {
          animation-delay: 500ms;
        }

        /* =================================================
           CARDS
        ================================================= */

        .car-card {
          transition:
            transform 0.45s
              cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.45s
              cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.35s ease;
        }

        .car-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 24px 55px
              rgba(0, 0, 0, 0.08);
        }

        /* =================================================
           IMAGENS DOS VEÍCULOS
           
           IMPORTANTE:
           - sem animação
           - sem sombra
           - sem zoom
           - sem filtro
           - sem movimento
        ================================================= */

        .car-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: none !important;
          filter: none !important;
          box-shadow: none !important;
        }

        .car-card:hover .car-image {
          transform: none !important;
          filter: none !important;
        }

        .vehicle-preview-image {
          display: block;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transform: none !important;
          filter: none !important;
          box-shadow: none !important;
          animation: none !important;
        }

        /* =================================================
           FILTROS
        ================================================= */

        .filter-button {
          transition:
            transform 0.25s ease,
            background-color 0.3s ease,
            color 0.3s ease,
            border-color 0.3s ease;
        }

        .filter-button:hover {
          transform: translateY(-2px);
        }

        /* =================================================
           BOTÕES AMARELOS
        ================================================= */

        .yellow-button {
          position: relative;
          overflow: hidden;
          transition:
            transform 0.3s
              cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.3s ease,
            background-color 0.3s ease;
        }

        .yellow-button::after {
          content: "";
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 40%;
          transform: translateX(-150%)
            skewX(-20deg);
          background: rgba(
            255,
            255,
            255,
            0.32
          );
          transition: transform 0.7s ease;
        }

        .yellow-button:hover {
          transform: translateY(-3px);
          box-shadow:
            0 14px 30px
              rgba(255, 204, 51, 0.28);
        }

        .yellow-button:hover::after {
          transform: translateX(350%)
            skewX(-20deg);
        }

        /* =================================================
           VERSÕES
        ================================================= */

        .version-card {
          transition:
            transform 0.3s ease,
            border-color 0.3s ease,
            background-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .version-card:hover {
          transform: translateX(4px);
        }

        /* =================================================
           CORES
        ================================================= */

        .color-card {
          transition:
            transform 0.3s
              cubic-bezier(0.22, 1, 0.36, 1),
            border-color 0.3s ease,
            box-shadow 0.3s ease;
        }

        .color-card:hover {
          transform: translateY(-4px);
          box-shadow:
            0 14px 30px
              rgba(0, 0, 0, 0.07);
        }

        /* =================================================
           HERO
        ================================================= */

        .hero-grid {
          background-image:
            linear-gradient(
              rgba(255, 255, 255, 0.035)
                1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255, 255, 255, 0.035)
                1px,
              transparent 1px
            );
          background-size:
            50px 50px;
        }

        .smooth {
          transition:
            all 0.35s
              cubic-bezier(
                0.22,
                1,
                0.36,
                1
              );
        }

        /* =================================================
           ACESSIBILIDADE / MOBILE
        ================================================= */

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .car-image,
          .vehicle-preview-image {
            animation: none !important;
            transform: none !important;
          }
        }

        @media (max-width: 1023px) {
          .vehicle-preview-image {
            max-height: 230px;
          }
        }

        @media (min-width: 1024px) {
          .vehicle-preview-image {
            max-height: 580px;
          }
        }
      `}</style>

      <main className="min-h-screen bg-white text-[#111]">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="sticky top-0 z-50 border-b border-[#E5E5E5]/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-[66px] max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="group flex items-center gap-3"
            >
              <span
                className="
                  inline-block
                  h-8
                  w-8
                  rotate-45
                  border-[3px]
                  border-black
                  transition-transform
                  duration-500
                  group-hover:rotate-[225deg]
                "
                style={{
                  borderRadius: 3,
                }}
              />

              <span className="text-sm font-bold tracking-[0.18em]">
                RENAULT
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {!loadingAuth && user ? (
                <>
                  <Link
                    href={dashboardLink}
                    className="
                      hidden
                      items-center
                      gap-2
                      rounded-full
                      px-4
                      py-2
                      text-xs
                      font-medium
                      text-[#6B6B6B]
                      transition-all
                      hover:bg-white
                      hover:text-black
                      sm:flex
                    "
                  >
                    <LayoutDashboard size={14} />

                    {dashboardLabel}
                  </Link>

                  <span className="hidden text-xs text-[#6B6B6B] md:inline">
                    {displayName}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="
                      flex
                      h-9
                      w-9
                      items-center
                      justify-center
                      rounded-full
                      border
                      border-[#E5E5E5]
                      transition-all
                      hover:-translate-y-0.5
                      hover:border-black
                      hover:bg-black
                      hover:text-white
                    "
                  >
                    <LogOut size={15} />
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    px-4
                    py-2
                    text-xs
                    font-semibold
                    transition-all
                    hover:bg-black
                    hover:text-white
                  "
                >
                  <LogIn size={14} />
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* =================================================
            HERO
        ================================================= */}

        <section className="hero-grid relative overflow-hidden bg-[#080808] text-white">
          <div
            className="
              pointer-events-none
              absolute
              -right-40
              -top-40
              h-[550px]
              w-[550px]
              rounded-full
              blur-3xl
            "
            style={{
              background:
                "rgba(255,204,51,0.16)",
              animation:
                "pulseGlow 5s ease-in-out infinite",
            }}
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-60
              -left-40
              h-[500px]
              w-[500px]
              rounded-full
              bg-white/[0.025]
              blur-3xl
            "
          />

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-32">
            <div
              className={`
                max-w-2xl
                ${
                  mounted
                    ? "animate-fade-up"
                    : "opacity-0"
                }
              `}
            >
              <div className="mb-6 flex items-center gap-3">
                <span
                  className="h-px w-10"
                  style={{
                    backgroundColor:
                      R.yellow,
                  }}
                />

                <p
                  className="text-[10px] font-bold uppercase tracking-[0.3em]"
                  style={{
                    color: R.yellow,
                  }}
                >
                  veículos Renault
                </p>
              </div>

              <h1 className="text-4xl font-light leading-[1.03] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                descubra
                <br />

                <span className="font-semibold">
                  o seu Renault.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                Escolha seu veículo, compare versões,
                selecione a cor e envie sua configuração
                para análise de consórcio.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="#veiculos"
                  className="
                    yellow-button
                    inline-flex
                    h-12
                    items-center
                    gap-3
                    px-7
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    text-black
                  "
                  style={{
                    backgroundColor:
                      R.yellow,
                  }}
                >
                  explorar veículos

                  <ArrowRight size={15} />
                </a>

                <Link
                  href="/"
                  className="
                    inline-flex
                    h-12
                    items-center
                    border
                    border-white/20
                    px-7
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.16em]
                    transition-all
                    hover:border-white/50
                    hover:bg-white/[0.06]
                  "
                >
                  outras marcas
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap gap-8 border-t border-white/10 pt-7">
                <div>
                  <p className="text-2xl font-semibold">
                    {VEHICLES.length}
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                    modelos
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold">
                    100%
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                    configuração digital
                  </p>
                </div>

                <div>
                  <p className="text-2xl font-semibold">
                    <Zap size={21} />
                  </p>

                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                    processo rápido
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FFCC33]/40 to-transparent" />
        </section>

        {/* =================================================
            CATÁLOGO
        ================================================= */}

        <section
          id="veiculos"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20"
        >
          <div className="mb-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles
                  size={15}
                  style={{
                    color: R.yellowDark,
                  }}
                />

                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B6B6B]">
                  nossos veículos
                </p>
              </div>

              <h2 className="mt-2 text-3xl font-light tracking-[-0.03em] sm:text-4xl">
                escolha seu{" "}
                <span className="font-semibold">
                  Renault
                </span>
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-[#777]">
                Explore os modelos disponíveis e
                configure o veículo ideal para seu
                cliente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((f) => {
                const active = filter === f;

                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`
                      filter-button
                      h-10
                      rounded-full
                      px-5
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.12em]
                      ${
                        active
                          ? "bg-black text-white shadow-lg shadow-black/10"
                          : "border border-[#E5E5E5] text-[#777] hover:border-black hover:text-black"
                      }
                    `}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* =================================================
              GRID
          ================================================= */}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((car, index) => (
              <article
                key={car.slug}
                className={`
                  car-card
                  group
                  flex
                  flex-col
                  overflow-hidden
                  rounded-[2px]
                  border
                  border-[#E8E8E8]
                  bg-white
                  ${
                    mounted
                      ? "animate-fade-up"
                      : "opacity-0"
                  }
                `}
                style={{
                  animationDelay: `${index * 80}ms`,
                }}
              >
                {/* IMAGE */}

                <div className="relative aspect-[16/10] overflow-hidden bg-[#F5F5F5]">
                  <img
                    src={car.cover}
                    alt={car.name}
                    className="car-image h-full w-full object-contain p-7"
                    draggable={false}
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).style.opacity = "0.18";
                    }}
                  />

                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-black px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
                      {car.category}
                    </span>
                  </div>

                  {car.category === "Elétrico" && (
                    <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur">
                      <Zap
                        size={11}
                        style={{
                          color: R.yellowDark,
                        }}
                      />
                      elétrico
                    </div>
                  )}
                </div>

                {/* INFO */}

                <div className="flex flex-1 flex-col p-6">
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-[0.04em]">
                      {car.shortName}
                    </h3>

                    <p className="mt-1 text-xs text-[#777]">
                      {car.tagline}
                    </p>
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-wider text-[#999]">
                      a partir de
                    </p>

                    <p className="mt-0.5 text-xl font-bold">
                      {formatPrice(
                        car.priceStart
                      )}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 border-y border-[#EEEEEE] py-4">
                    <div className="flex flex-col items-center gap-1 text-center">
                      <Fuel
                        size={14}
                        className="text-[#777]"
                      />

                      <span className="text-[9px] uppercase text-[#777]">
                        {car.fuelLabel}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 border-x border-[#EEEEEE] text-center">
                      <Users
                        size={14}
                        className="text-[#777]"
                      />

                      <span className="text-[9px] uppercase text-[#777]">
                        {car.seats} lugares
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                      <Ruler
                        size={14}
                        className="text-[#777]"
                      />

                      <span className="text-[9px] uppercase text-[#777]">
                        {car.lengthM} m
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      openBuilder(car)
                    }
                    className="
                      yellow-button
                      mt-6
                      flex
                      h-12
                      w-full
                      items-center
                      justify-center
                      gap-2
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.16em]
                      text-black
                    "
                    style={{
                      backgroundColor:
                        R.yellow,
                    }}
                  >
                    configurar veículo

                    <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* =================================================
            BLOCO FINAL
        ================================================= */}

        <section className="overflow-hidden bg-[#0A0A0A] px-4 py-16 text-white sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{
                  color: R.yellow,
                }}
              >
                seu próximo passo
              </p>

              <h2 className="mt-2 text-2xl font-light tracking-tight sm:text-3xl">
                Escolha um modelo e{" "}
                <span className="font-semibold">
                  monte sua configuração.
                </span>
              </h2>
            </div>

            <a
              href="#veiculos"
              className="
                yellow-button
                flex
                h-12
                items-center
                gap-2
                px-7
                text-[10px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-black
              "
              style={{
                backgroundColor:
                  R.yellow,
              }}
            >
              ver veículos
              <ChevronRight size={15} />
            </a>
          </div>
        </section>

        {/* =================================================
            BUILDER / MODAL
        ================================================= */}

        {vehicle && (
          <div
            className={`
              fixed
              inset-0
              z-[70]
              flex
              flex-col
              bg-white
              ${
                closing
                  ? "opacity-0"
                  : "animate-fade-in opacity-100"
              }
            `}
          >
            {/* HEADER */}

            <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-4 sm:px-6">
              <button
                onClick={closeBuilder}
                className="
                  flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-3
                  py-2
                  text-xs
                  font-medium
                  text-[#777]
                  transition-all
                  hover:bg-[#F5F5F5]
                  hover:text-black
                "
              >
                <ChevronLeft size={16} />
                voltar
              </button>

              <div className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#999]">
                  configure o seu
                </p>

                <p className="mt-0.5 text-sm font-bold uppercase">
                  {vehicle.shortName}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] uppercase tracking-wider text-[#999]">
                  preço total
                </p>

                <p className="text-sm font-bold">
                  {formatPrice(total)}
                </p>
              </div>
            </div>

            {/* STEPS */}

            <div className="flex shrink-0 justify-center border-b border-[#E5E5E5] bg-[#FAFAFA] px-3 py-3">
              <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-sm">
                {steps.map((s, i) => {
                  const active =
                    builderStep === s.id;

                  const completed =
                    (s.id === "version" &&
                      (builderStep ===
                        "color" ||
                        builderStep ===
                          "summary")) ||
                    (s.id === "color" &&
                      builderStep ===
                        "summary");

                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (
                          s.id === "color" &&
                          !versionId
                        ) {
                          return;
                        }

                        if (
                          s.id === "summary" &&
                          (!versionId ||
                            !colorId)
                        ) {
                          return;
                        }

                        setBuilderStep(s.id);
                      }}
                      className={`
                        flex
                        items-center
                        gap-2
                        rounded-full
                        px-4
                        py-2
                        text-[9px]
                        font-bold
                        uppercase
                        tracking-[0.12em]
                        transition-all
                        ${
                          active
                            ? "bg-black text-white shadow-md"
                            : "text-[#777] hover:bg-[#F4F4F4] hover:text-black"
                        }
                      `}
                    >
                      <span
                        className={`
                          flex
                          h-5
                          w-5
                          items-center
                          justify-center
                          rounded-full
                          border
                          text-[9px]
                          ${
                            active
                              ? "border-white/30"
                              : completed
                              ? "border-black bg-black text-white"
                              : "border-current"
                          }
                        `}
                      >
                        {completed ? (
                          <Check size={11} />
                        ) : (
                          i + 1
                        )}
                      </span>

                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* =================================================
                CONTEÚDO
            ================================================= */}

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
              {/* =================================================
                  PREVIEW DO VEÍCULO

                  TOTALMENTE ESTÁTICO
                  SEM SOMBRA
                  SEM GLOW
                  SEM FUNDO CINZA
              ================================================= */}

              <div className="relative flex h-[280px] shrink-0 items-center justify-center overflow-hidden bg-white lg:h-auto lg:w-[53%]">
                <div className="relative flex h-full w-full items-center justify-center bg-white">
                  <img
                    src={photo}
                    alt={vehicle.name}
                    className="
                      vehicle-preview-image
                      relative
                      z-10
                      h-full
                      w-full
                      object-contain
                      p-8
                    "
                    draggable={false}
                  />
                </div>

                <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#999]">
                      configuração
                    </p>

                    <p className="mt-1 text-xs font-semibold">
                      {version?.title}
                    </p>
                  </div>

                  <div className="rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5 text-[10px] font-medium">
                    {color?.name}
                  </div>
                </div>
              </div>

              {/* =================================================
                  PAINEL
              ================================================= */}

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-[#E5E5E5] lg:border-l lg:border-t-0">
                <div className="flex-1 p-5 sm:p-8">
                  {/* =================================================
                      VERSÃO
                  ================================================= */}

                  {builderStep === "version" && (
                    <div className="animate-modal">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
                          etapa 01
                        </p>

                        <h3 className="mt-2 text-2xl font-light tracking-tight">
                          escolha sua{" "}
                          <span className="font-semibold">
                            versão
                          </span>
                        </h3>

                        <p className="mt-2 text-xs leading-5 text-[#777]">
                          Compare equipamentos,
                          motorização e preço.
                        </p>
                      </div>

                      <div className="mt-7 space-y-3">
                        {vehicle.versions.map(
                          (v) => {
                            const selected =
                              versionId ===
                              v.id;

                            return (
                              <button
                                key={v.id}
                                onClick={() =>
                                  setVersionId(
                                    v.id
                                  )
                                }
                                className={`
                                  version-card
                                  flex
                                  w-full
                                  items-start
                                  justify-between
                                  rounded-xl
                                  border
                                  p-4
                                  text-left
                                  ${
                                    selected
                                      ? "border-black bg-[#FAFAFA] shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
                                      : "border-[#E5E5E5] hover:border-[#999]"
                                  }
                                `}
                              >
                                <div className="pr-3">
                                  <p className="text-sm font-bold">
                                    {v.title}
                                  </p>

                                  <p className="mt-1 text-[10px] text-[#777]">
                                    {v.fuel}
                                    {" · "}
                                    {v.transmission}
                                    {" · "}
                                    {v.power}
                                  </p>

                                  <ul className="mt-3 space-y-1">
                                    {v.highlights
                                      .slice(
                                        0,
                                        3
                                      )
                                      .map(
                                        (h) => (
                                          <li
                                            key={
                                              h
                                            }
                                            className="flex items-center gap-1.5 text-[10px] text-[#777]"
                                          >
                                            <Check
                                              size={
                                                11
                                              }
                                              className="text-[#999]"
                                            />

                                            {h}
                                          </li>
                                        )
                                      )}
                                  </ul>
                                </div>

                                <div className="shrink-0 text-right">
                                  <p className="text-[9px] uppercase tracking-wider text-[#999]">
                                    a partir de
                                  </p>

                                  <p className="mt-1 text-sm font-bold">
                                    {formatPrice(
                                      v.price
                                    )}
                                  </p>

                                  {selected && (
                                    <span
                                      className="
                                        mt-3
                                        inline-flex
                                        h-6
                                        w-6
                                        items-center
                                        justify-center
                                        rounded-full
                                      "
                                      style={{
                                        backgroundColor:
                                          R.yellow,
                                      }}
                                    >
                                      <Check
                                        size={
                                          13
                                        }
                                        className="text-black"
                                      />
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      COR
                  ================================================= */}

                  {builderStep === "color" && (
                    <div className="animate-modal">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
                        etapa 02
                      </p>

                      <h3 className="mt-2 text-2xl font-light tracking-tight">
                        escolha sua{" "}
                        <span className="font-semibold">
                          cor
                        </span>
                      </h3>

                      <p className="mt-2 text-xs text-[#777]">
                        {vehicle.colors.length}{" "}
                        opções disponíveis
                      </p>

                      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {vehicle.colors.map(
                          (c) => {
                            const selected =
                              colorId === c.id;

                            return (
                              <button
                                key={c.id}
                                onClick={() =>
                                  setColorId(
                                    c.id
                                  )
                                }
                                className={`
                                  color-card
                                  rounded-xl
                                  border
                                  p-3
                                  text-left
                                  ${
                                    selected
                                      ? "border-black shadow-lg shadow-black/5"
                                      : "border-[#E5E5E5]"
                                  }
                                `}
                              >
                                <span className="relative mb-3 block h-20 overflow-hidden rounded-lg border border-[#E5E5E5] bg-white">
                                  <img
                                    src={
                                      c.image
                                    }
                                    alt={
                                      c.name
                                    }
                                    className="
                                      h-full
                                      w-full
                                      object-contain
                                      transition-none
                                    "
                                    draggable={
                                      false
                                    }
                                  />

                                  <span
                                    className="
                                      absolute
                                      bottom-2
                                      left-2
                                      h-4
                                      w-4
                                      rounded-full
                                      border
                                      border-black/10
                                    "
                                    style={{
                                      backgroundColor:
                                        c.swatch,
                                    }}
                                  />

                                  {selected && (
                                    <span
                                      className="
                                        absolute
                                        right-2
                                        top-2
                                        flex
                                        h-6
                                        w-6
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-black
                                        text-white
                                      "
                                    >
                                      <Check
                                        size={
                                          12
                                        }
                                      />
                                    </span>
                                  )}
                                </span>

                                <p className="text-xs font-semibold">
                                  {c.name}
                                </p>

                                <p className="mt-1 text-[10px] text-[#777]">
                                  {c.extraPrice ===
                                  0
                                    ? "incluso"
                                    : `+ ${formatPrice(
                                        c.extraPrice
                                      )}`}
                                </p>
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      RESUMO
                  ================================================= */}

                  {builderStep === "summary" && (
                    <div className="animate-modal">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#999]">
                        etapa 03
                      </p>

                      <h3 className="mt-2 text-2xl font-light tracking-tight">
                        resumo da{" "}
                        <span className="font-semibold">
                          configuração
                        </span>
                      </h3>

                      <div className="mt-6 overflow-hidden rounded-xl border border-[#E5E5E5]">
                        <div className="bg-[#FAFAFA] p-5">
                          <div className="flex items-center gap-4">
                            <div className="h-20 w-28 overflow-hidden rounded-lg bg-white">
                              <img
                                src={photo}
                                alt={
                                  vehicle.name
                                }
                                className="h-full w-full object-contain p-2"
                                draggable={
                                  false
                                }
                              />
                            </div>

                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-[#999]">
                                veículo
                              </p>

                              <p className="mt-1 text-sm font-bold uppercase">
                                {
                                  vehicle.shortName
                                }
                              </p>

                              <p className="mt-1 text-[10px] text-[#777]">
                                {version?.title}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4 p-5">
                          <div className="flex justify-between gap-5 text-sm">
                            <span className="text-[#777]">
                              Versão
                            </span>

                            <span className="text-right font-medium">
                              {
                                version?.title
                              }

                              <br />

                              <span className="text-xs text-[#777]">
                                {formatPrice(
                                  version?.price ??
                                    0
                                )}
                              </span>
                            </span>
                          </div>

                          <div className="flex justify-between gap-5 text-sm">
                            <span className="text-[#777]">
                              Cor
                            </span>

                            <span className="text-right font-medium">
                              {color?.name}

                              <br />

                              <span className="text-xs text-[#777]">
                                {extra ===
                                0
                                  ? "incluso"
                                  : formatPrice(
                                      extra
                                    )}
                              </span>
                            </span>
                          </div>

                          <div className="flex justify-between border-t border-[#E5E5E5] pt-4 text-base font-bold">
                            <span>
                              preço total
                            </span>

                            <span>
                              {formatPrice(
                                total
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CLIENTE */}

                      <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
                        dados do cliente ·
                        consórcio
                      </p>

                      <div className="mt-3 space-y-3">
                        <input
                          className={INPUT}
                          placeholder="Nome completo"
                          value={
                            clientName
                          }
                          onChange={(e) =>
                            setClientName(
                              e.target.value
                            )
                          }
                        />

                        <div className="grid gap-3 sm:grid-cols-2">
                          <input
                            className={INPUT}
                            placeholder="CPF"
                            value={
                              clientCpf
                            }
                            onChange={(e) =>
                              setClientCpf(
                                maskCPF(
                                  e.target.value
                                )
                              )
                            }
                          />

                          <input
                            className={INPUT}
                            placeholder="Telefone"
                            value={
                              clientPhone
                            }
                            onChange={(e) =>
                              setClientPhone(
                                maskPhone(
                                  e.target.value
                                )
                              )
                            }
                          />
                        </div>

                        <input
                          className={INPUT}
                          placeholder="E-mail"
                          value={
                            clientEmail
                          }
                          onChange={(e) =>
                            setClientEmail(
                              e.target.value
                            )
                          }
                        />

                        <input
                          className={INPUT}
                          placeholder="Vendedor"
                          value={
                            clientSeller
                          }
                          onChange={(e) =>
                            setClientSeller(
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {formError && (
                        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-600">
                          {formError}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="flex shrink-0 gap-3 border-t border-[#E5E5E5] bg-white p-4 sm:p-5">
                  {builderStep !==
                    "version" && (
                    <button
                      onClick={() =>
                        setBuilderStep(
                          builderStep ===
                            "summary"
                            ? "color"
                            : "version"
                        )
                      }
                      className="
                        smooth
                        flex
                        h-12
                        flex-1
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-[#E5E5E5]
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        hover:border-black
                        hover:bg-[#FAFAFA]
                      "
                    >
                      voltar
                    </button>
                  )}

                  {builderStep ===
                    "version" && (
                    <button
                      disabled={!versionId}
                      onClick={() =>
                        setBuilderStep(
                          "color"
                        )
                      }
                      className="
                        yellow-button
                        flex
                        h-12
                        flex-1
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-black
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                      style={{
                        backgroundColor:
                          R.yellow,
                      }}
                    >
                      continuar
                      <ChevronRight
                        size={14}
                      />
                    </button>
                  )}

                  {builderStep ===
                    "color" && (
                    <button
                      disabled={!colorId}
                      onClick={() =>
                        setBuilderStep(
                          "summary"
                        )
                      }
                      className="
                        yellow-button
                        flex
                        h-12
                        flex-1
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-black
                        disabled:cursor-not-allowed
                        disabled:opacity-40
                      "
                      style={{
                        backgroundColor:
                          R.yellow,
                      }}
                    >
                      ver resumo
                      <ChevronRight
                        size={14}
                      />
                    </button>
                  )}

                  {builderStep ===
                    "summary" && (
                    <button
                      onClick={
                        goToAnalise
                      }
                      className="
                        yellow-button
                        flex
                        h-12
                        flex-1
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.14em]
                        text-black
                      "
                      style={{
                        backgroundColor:
                          R.yellow,
                      }}
                    >
                      <Check size={15} />
                      enviar para análise
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="border-t border-[#E5E5E5] bg-[#F5F5F5]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-center sm:px-6">
            <div className="mx-auto flex items-center gap-3">
              <span
                className="h-6 w-6 rotate-45 border-2 border-black"
                style={{
                  borderRadius: 2,
                }}
              />

              <span className="text-xs font-bold tracking-[0.15em]">
                RENAULT
              </span>
            </div>

            <p className="text-[10px] text-[#777]">
              © 2026 Nacional Consórcio LTDA.
              Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
