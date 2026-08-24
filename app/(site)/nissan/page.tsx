"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  User,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  CarFront,
  ChevronDown,
  LogIn,
  Search,
  Check,
  ChevronLeft,
  Sparkles,
  Fuel,
  Gauge,
  Settings2,
  ArrowLeft,
} from "lucide-react";

/* =========================================================
   IMAGENS
========================================================= */
const CARS = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars";

const PHOTO = {
  kicks: `${CARS}/kicks_frente.webp.ximg.l_4_m.smart.webp`,
  kait: `${CARS}/kait_frontal_v2.webp.ximg.l_4_m.smart.webp`,
  versa: `${CARS}/versa_exclusive_frontal_v2.webp.ximg.l_4_m.smart.webp`,
};

type ColorItem = {
  id: string;
  name: string;
  swatch: string;
  extraPrice: number;
  versionIds?: string[];
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
  highlights: string[];
};

type Vehicle = {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  priceStart: number;
  cover: string;
  versions: VersionItem[];
  colors: ColorItem[];
};

const VEHICLES: Vehicle[] = [
  {
    slug: "kait",
    name: "Nissan Kait",
    tagline: "Cabe tudo que é bom",
    category: "SUV",
    priceStart: 117990,
    cover: PHOTO.kait,
    versions: [
      {
        id: "active",
        title: "Active CVT",
        subtitle: "Entrada inteligente",
        price: 117990,
        fuel: "Flex",
        transmission: "CVT",
        power: "114 cv",
        highlights: [
          "Central multimídia 8\"",
          "Câmera de ré",
          "6 airbags",
          "Ar-condicionado",
          "Direção elétrica",
          "Vidros elétricos",
          "Travas elétricas",
          "Computador de bordo",
        ],
      },
      {
        id: "sense",
        title: "Sense CVT",
        subtitle: "Mais conforto",
        price: 136990,
        fuel: "Flex",
        transmission: "CVT",
        power: "114 cv",
        highlights: [
          "Rodas de liga leve 16\"",
          "Sensor de estacionamento traseiro",
          "Central multimídia 8\"",
          "Câmera de ré",
          "6 airbags",
          "Ar-condicionado digital",
          "Volante multifuncional",
          "Bancos em tecido premium",
        ],
      },
      {
        id: "sense-plus",
        title: "Sense Plus CVT",
        subtitle: "Pack extra",
        price: 139590,
        fuel: "Flex",
        transmission: "CVT",
        power: "114 cv",
        highlights: [
          "Faróis em LED",
          "Rodas de liga leve 16\"",
          "Sensor de estacionamento",
          "Central multimídia 8\"",
          "Câmera de ré",
          "6 airbags",
          "Ar digital",
          "Acabamento exclusivo",
        ],
      },
      {
        id: "advance",
        title: "Advance CVT",
        subtitle: "Tecnologia",
        price: 146990,
        fuel: "Flex",
        transmission: "CVT",
        power: "114 cv",
        highlights: [
          "Nissan Safety Shield",
          "Cruise control",
          "Faróis em LED",
          "Rodas de liga 17\"",
          "Sensor dianteiro e traseiro",
          "Central multimídia",
          "Câmera de ré",
          "Ar dual zone",
        ],
      },
      {
        id: "advance-plus",
        title: "Advance Plus CVT",
        subtitle: "Advance + pack",
        price: 149890,
        fuel: "Flex",
        transmission: "CVT",
        power: "114 cv",
        highlights: [
          "Câmera 360º",
          "Nissan Safety Shield",
          "Cruise control",
          "Faróis Full LED",
          "Rodas 17\"",
          "Sensores 360º",
          "Central multimídia avançada",
          "Ar dual zone",
        ],
      },
      {
        id: "exclusive",
        title: "Exclusive CVT",
        subtitle: "Topo de linha",
        price: 152990,
        fuel: "Flex",
        transmission: "CVT",
        power: "114 cv",
        highlights: [
          "Teto solar elétrico",
          "ADAS completo",
          "Câmera 360º",
          "Nissan Safety Shield",
          "Bancos em couro",
          "Faróis Full LED",
          "Rodas 17\" diamantadas",
          "Sistema de som premium",
        ],
      },
    ],
    colors: [
      { id: "branco-solid", name: "Branco Solid", swatch: "#F4F4F0", extraPrice: 0, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/brancoexclusive.webp.ximg.full.conf.webp" },
      { id: "preto-metalico", name: "Preto Metálico", swatch: "#141414", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/active.webp.ximg.full.conf.webp" },
      { id: "prata-lunar", name: "Prata Lunar", swatch: "#B8B8B8", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/kait_sense_prata.webp.ximg.full.conf.webp" },
      { id: "cinza-storm", name: "Cinza Storm", swatch: "#5C5C5C", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/sense-plus-cinza-grafite.webp.ximg.full.conf.webp" },
      { id: "vermelho-passion", name: "Vermelho Passion", swatch: "#8E1B1B", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/kait_advance_vermelho.webp.ximg.full.conf.webp" },
    ],
  },
  {
    slug: "versa",
    name: "Nissan Versa",
    tagline: "Desafiamos os seus conceitos",
    category: "Sedã",
    priceStart: 119990,
    cover: PHOTO.versa,
    versions: [
      {
        id: "sense",
        title: "Sense 1.6 CVT",
        subtitle: "Pintura inclusa",
        price: 119990,
        fuel: "Flex",
        transmission: "CVT",
        power: "117 cv",
        highlights: [
          "Porta-malas de 510 litros",
          "Pintura sem custo extra",
          "Central multimídia",
          "Câmera de ré",
          "6 airbags",
          "Ar-condicionado",
          "Direção elétrica",
          "Computador de bordo",
        ],
      },
      {
        id: "advance",
        title: "Advance 1.6 CVT",
        subtitle: "Conforto e tech",
        price: 129990,
        fuel: "Flex",
        transmission: "CVT",
        power: "117 cv",
        highlights: [
          "Ar-condicionado digital",
          "Rodas de liga leve",
          "Central multimídia 8\"",
          "Câmera de ré",
          "Sensor de estacionamento",
          "Volante multifuncional",
          "6 airbags",
          "Keyless Entry",
        ],
      },
      {
        id: "exclusive",
        title: "Exclusive 1.6 CVT",
        subtitle: "Sedã completo",
        price: 148290,
        fuel: "Flex",
        transmission: "CVT",
        power: "117 cv",
        highlights: [
          "Nissan Safety Shield",
          "Keyless Entry & Start",
          "Ar dual zone",
          "Rodas de liga 16\"",
          "Bancos em material premium",
          "Faróis em LED",
          "Câmera de ré",
          "Sistema de som avançado",
        ],
      },
    ],
    colors: [
      { id: "branco-pearl", name: "Branco Pearl", swatch: "#F7F6F1", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/versa/brancoR.png" },
      { id: "preto-super-black", name: "Preto Super Black", swatch: "#0D0D0D", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/versa/pretoR.png" },
      { id: "prata-brilliant", name: "Prata Brilliant", swatch: "#C5C5C5", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/versa/prataR.png" },
      { id: "cinza-gun", name: "Cinza Gun Metallic", swatch: "#4A4A4A", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/versa/cimzaR.png" },
    ],
  },
  {
    slug: "kicks",
    name: "Nissan Kicks",
    tagline: "Attitude to disrupt",
    category: "SUV",
    priceStart: 159990,
    cover: PHOTO.kicks,
    versions: [
      {
        id: "sense",
        title: "Sense 1.0 Turbo AT",
        subtitle: "Novo Kicks global",
        price: 159990,
        fuel: "Flex",
        transmission: "Automático",
        power: "1.0 Turbo",
        highlights: [
          "Nova plataforma global",
          "Nissan Safety Shield",
          "Motor 1.0 Turbo",
          "Central multimídia",
          "Câmera de ré",
          "6 airbags",
          "Ar-condicionado",
          "Rodas de liga",
        ],
      },
      {
        id: "advance",
        title: "Advance 1.0 Turbo AT",
        subtitle: "Mais equipamento",
        price: 169990,
        fuel: "Flex",
        transmission: "Automático",
        power: "1.0 Turbo",
        highlights: [
          "Câmera 360º",
          "Ar-condicionado dual zone",
          "Nissan Safety Shield",
          "Motor 1.0 Turbo",
          "Faróis em LED",
          "Sensores de estacionamento",
          "Volante multifuncional",
          "Bancos premium",
        ],
      },
      {
        id: "exclusive",
        title: "Exclusive 1.0 Turbo AT",
        subtitle: "Acabamento premium",
        price: 179990,
        fuel: "Flex",
        transmission: "Automático",
        power: "1.0 Turbo",
        highlights: [
          "ADAS completo",
          "Keyless Entry & Start",
          "Câmera 360º",
          "Ar dual zone",
          "Bancos em material premium",
          "Faróis Full LED",
          "Rodas diamantadas",
          "Sistema de som Bose",
        ],
      },
      {
        id: "platinum",
        title: "Platinum 1.0 Turbo AT",
        subtitle: "Topo · bi-tone",
        price: 189000,
        fuel: "Flex",
        transmission: "Automático",
        power: "1.0 Turbo",
        highlights: [
          "Teto contrastante bi-tone",
          "Interior exclusivo Platinum",
          "ADAS completo",
          "Câmera 360º",
          "Bancos em couro",
          "Teto solar",
          "Rodas 17\" exclusivas",
          "Pacote de iluminação ambiente",
        ],
      },
    ],
    colors: [
      { id: "vermelho-carmim", name: "Vermelho Carmim", swatch: "#973131", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/new/vermelho%20carmimR.png" },
      { id: "preto-premium", name: "Preto Super Black", swatch: "#0D0D0D", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/new/preto%20premiumR.png" },
      { id: "cinza-grafite", name: "Cinza Gun Metallic", swatch: "#4A4A4A", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/new/cinza%20grafiteR.png" },
      { id: "branco-beje", name: "Branco Beje", swatch: "#e7d8d8", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/new/bejeR.png" },
      { id: "azul-oceanico", name: "Azul Oceânico", swatch: "#2c3983", extraPrice: 2000, image: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/nissancarros/new/azul%20oceanicoR.png" },
    ],
  },
];

function formatPrice(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });
}

function colorsOf(vehicle: Vehicle, versionId: string) {
  return vehicle.colors.filter((c) => !c.versionIds || c.versionIds.includes(versionId));
}

function extraOf(vehicle: Vehicle, versionId: string, color: ColorItem) {
  if (vehicle.slug === "versa" && versionId === "sense") return 0;
  return color.extraPrice;
}

function preloadImages(urls: string[]) {
  urls.forEach((url) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  });
}

// Máscara simples de CPF
function maskCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .slice(0, 14);
}

// Máscara de telefone
function maskPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  return `${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
}

export default function NissanPage() {
  const router = useRouter();
  const pathname = usePathname();

  // ===== AUTH =====
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  // ===== BUILDER =====
  const [filter, setFilter] = useState("Todos");
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [versionId, setVersionId] = useState("");
  const [colorId, setColorId] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"config" | "client">("config");

  // ===== DADOS DO CLIENTE =====
  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSeller, setClientSeller] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => setSidebarOpen(false), [pathname]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, role")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        setFullName(profile.full_name || "");
        setAvatarUrl(profile.avatar_url || "");
        setUserRole(profile.role || "vendedor");
      }
    } catch {}
  };

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        if (!active) return;
        setUser(u);
        currentUserIdRef.current = u?.id ?? null;
        setLoadingAuth(false);
        if (u?.id) void fetchProfile(u.id);
      } catch {
        if (active) setLoadingAuth(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        const u = session?.user ?? null;
        setUser(u);
        const newId = u?.id ?? null;
        currentUserIdRef.current = newId;
        setLoadingAuth(false);
        if (!newId) {
          setFullName("");
          setAvatarUrl("");
          setUserRole(null);
          return;
        }
        if (newId !== currentUserIdRef.current) void fetchProfile(newId);
      }
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Pré-preenche o vendedor com o usuário logado
  useEffect(() => {
    if (fullName && !clientSeller) {
      setClientSeller(fullName);
    }
  }, [fullName]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setFullName("");
      setAvatarUrl("");
      setUserRole(null);
      currentUserIdRef.current = null;
      setSidebarOpen(false);
      router.push("/login");
      router.refresh();
    }
  };

  const role = (userRole || "").toLowerCase();
  const email = (user?.email || "").toLowerCase();
  const isAdmin = role === "admin" || email.includes("admin");
  const isSupervisor = role === "supervisor" || email.startsWith("s");
  const dashboardLink = isAdmin ? "/admin" : isSupervisor ? "/supervisor/dashboard" : "/vendedor/dashboard";
  const dashboardLabel = isAdmin ? "Painel Gerencial" : isSupervisor ? "Painel do Supervisor" : "Painel do Vendedor";
  const displayName = fullName || user?.email?.split("@")[0];

  // Preload
  useEffect(() => {
    const covers = VEHICLES.map((v) => v.cover);
    const allColors = VEHICLES.flatMap((v) => v.colors.map((c) => c.image));
    preloadImages([...covers, ...allColors]);
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    preloadImages(vehicle.colors.map((c) => c.image));
  }, [vehicle]);

  useEffect(() => setImageLoaded(false), [colorId, vehicle]);

  const list = filter === "Todos" ? VEHICLES : VEHICLES.filter((v) => v.category === filter);
  const version = vehicle?.versions.find((v) => v.id === versionId) ?? null;
  const palette = useMemo(() => (vehicle && versionId ? colorsOf(vehicle, versionId) : []), [vehicle, versionId]);
  const color = palette.find((c) => c.id === colorId) ?? palette[0] ?? null;
  const extra = vehicle && version && color ? extraOf(vehicle, version.id, color) : 0;
  const total = (version?.price ?? 0) + extra;
  const photo = color?.image || vehicle?.cover || "";

  const openBuilder = (car: Vehicle) => {
    const first = car.versions[0];
    const firstColor = colorsOf(car, first.id)[0];
    setVehicle(car);
    setVersionId(first.id);
    setColorId(firstColor?.id ?? "");
    setIsClosing(false);
    setStep("config");
    setFormError("");
  };

  const closeBuilder = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setVehicle(null);
      setIsClosing(false);
      setStep("config");
      setFormError("");
    }, 320);
  }, []);

  const pickVersion = (id: string) => {
    if (!vehicle) return;
    setVersionId(id);
    const next = colorsOf(vehicle, id);
    if (!next.some((c) => c.id === colorId)) setColorId(next[0]?.id ?? "");
  };

  const validateClientForm = () => {
    if (!clientName.trim()) return "Informe o nome completo do cliente.";
    if (!clientCpf.replace(/\D/g, "").match(/^\d{11}$/)) return "CPF inválido. Digite os 11 números.";
    if (!clientEmail.trim() || !clientEmail.includes("@")) return "Informe um e-mail válido.";
    if (clientPhone.replace(/\D/g, "").length < 10) return "Informe um telefone válido.";
    if (!clientSeller.trim()) return "Informe o nome do vendedor.";
    return "";
  };

  const goToAnalise = () => {
    const error = validateClientForm();
    if (error) {
      setFormError(error);
      return;
    }
    if (!vehicle || !version || !color) return;

    const payload = {
      source: "nissan-builder",
      status: "configured",
      brand: "nissan",
      vehicle_slug: vehicle.slug,
      vehicle_name: vehicle.name,
      vehicle_title: vehicle.name,
      vehicle_description: version.subtitle,
      vehicle_image: color.image || vehicle.cover,
      version: {
        id: version.id,
        name: version.title,
        description: version.subtitle,
        price: version.price,
        image: color.image || vehicle.cover,
      },
      color: {
        id: color.id,
        name: color.name,
        description: color.name,
        price: extra,
        image: color.image || vehicle.cover,
        hex: color.swatch,
        versionId: version.id,
      },
      client: {
        full_name: clientName.trim(),
        cpf: clientCpf.replace(/\D/g, ""),
        email: clientEmail.trim().toLowerCase(),
        phone: clientPhone.replace(/\D/g, ""),
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

    localStorage.setItem("wb_builder_order", JSON.stringify(payload));
    localStorage.setItem("wb_analysis_order", JSON.stringify(payload));
    router.push("/vendedor/analise");
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-white text-zinc-900 antialiased">
      {/* ========== HEADER COM LOGIN ========== */}
      <nav className="fixed top-0 z-[1001] flex h-16 w-full items-center justify-between border-b border-zinc-200 bg-black px-4 text-white lg:px-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full p-2 text-white/80 transition hover:bg-white/10 lg:hidden"
          >
            <Menu size={22} />
          </button>
          <Link
            href="/"
            className="hidden items-center gap-2 border border-white/20 px-3 py-2 text-xs tracking-wide transition hover:bg-white/10 lg:inline-flex"
          >
            <ChevronLeft size={14} /> Marcas
          </Link>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold tracking-[0.28em]">NISSAN</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {loadingAuth ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
          ) : user ? (
            <div className="group relative hidden lg:block">
              <button className="flex items-center gap-2.5 rounded-full border border-white/20 bg-white/5 py-1 pl-1 pr-3 transition hover:border-white/40">
                <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${isAdmin ? "bg-[#C3002F] text-white" : "bg-white/15 text-white"}`}>
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <User size={15} />}
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-bold uppercase text-white/50">Olá,</p>
                  <p className="max-w-[90px] truncate text-xs font-bold">{displayName}</p>
                </div>
                <ChevronDown size={14} className="text-white/40" />
              </button>
              <div className="invisible absolute right-0 top-full mt-3 w-64 translate-y-2 rounded-2xl border border-zinc-100 bg-white p-2 text-zinc-900 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="mb-2 rounded-xl bg-zinc-50 p-3">
                  <p className="truncate text-xs font-bold">{displayName}</p>
                  <p className="truncate text-[10px] text-zinc-500">{user.email}</p>
                </div>
                <Link href={dashboardLink} className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
                  {isAdmin ? <ShieldCheck size={16} /> : <LayoutDashboard size={16} />} {dashboardLabel}
                </Link>
                <Link href="/profile" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
                  <User size={16} /> Meus Dados
                </Link>
                <Link href="/vendedor/consulta-cliente" className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50">
                  <Search size={16} /> Consulta de Cliente
                </Link>
                <div className="my-1 h-px bg-zinc-100" />
                <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50">
                  <LogOut size={16} /> Sair
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full border border-white/30 px-5 py-2 text-xs font-black uppercase tracking-wide transition hover:bg-white hover:text-black lg:block"
            >
              Entrar
            </Link>
          )}
        </div>
        <div className="absolute bottom-0 left-0 h-[3px] w-full bg-[#C3002F]" />
      </nav>

      {/* Sidebar Mobile */}
      <div
        className={`fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${sidebarOpen ? "visible opacity-100" : "invisible opacity-0"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed left-0 top-0 z-[2001] flex h-full w-[85%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-500 ease-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-zinc-100 px-6">
          <span className="text-lg font-semibold tracking-[0.28em]">NISSAN</span>
          <button onClick={() => setSidebarOpen(false)} className="rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
            {user ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${isAdmin ? "bg-[#C3002F] text-white" : "bg-zinc-200 text-zinc-600"}`}>
                    {avatarUrl ? <img src={avatarUrl} className="h-full w-full object-cover" /> : <User size={18} />}
                  </div>
                  <div>
                    <p className="max-w-[150px] truncate text-xs font-bold">{displayName}</p>
                    <p className="max-w-[150px] truncate text-[10px] text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link href={dashboardLink} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:border-black">
                    {isAdmin ? <ShieldCheck size={14} /> : <LayoutDashboard size={14} />} {dashboardLabel}
                  </Link>
                  <Link href="/profile" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 hover:border-black">
                    <User size={14} /> Meus Dados
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-3 text-xs text-zinc-500">Acesse sua conta</p>
                <Link href="/login" onClick={() => setSidebarOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-xs font-bold uppercase text-white">
                  <LogIn size={16} /> Entrar
                </Link>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Navegação</p>
            <Link href="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-zinc-800 hover:text-[#C3002F]">
              <CarFront size={18} /> Voltar às Marcas
            </Link>
          </div>
        </div>
      </div>

      {/* ========== HERO ========== */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-black pt-16 text-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img src={PHOTO.kicks} alt="" className="absolute -right-16 top-8 w-[52%] max-w-3xl opacity-[0.12] animate-float-slow" />
          <img src={PHOTO.kait} alt="" className="absolute -left-28 bottom-0 w-[48%] max-w-2xl opacity-[0.09] animate-float-delayed" />
          <img src={PHOTO.versa} alt="" className="absolute right-1/4 top-1/3 w-[38%] max-w-xl opacity-[0.07] animate-float" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div className={`space-y-6 transition-all duration-1000 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <p className="text-[11px] font-semibold tracking-[0.28em] text-[#C3002F]">
              LINHA NISSAN BRASIL 2026
            </p>
            <h1 className="text-4xl font-light tracking-tight sm:text-5xl lg:text-6xl">
              Escolha o seu Nissan
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-white/65">
              Configure versão e cor com todos os detalhes. Ao finalizar, você cadastra o cliente e segue para a análise de consórcio.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => document.getElementById("modelos")?.scrollIntoView({ behavior: "smooth" })}
                className="h-12 bg-[#C3002F] px-8 text-[12px] font-semibold uppercase tracking-[0.16em] transition hover:bg-[#9a0025] active:scale-95"
              >
                Ver modelos
              </button>
              <Link
                href="/"
                className="flex h-12 items-center border border-white/25 px-6 text-[12px] font-semibold uppercase tracking-[0.14em] transition hover:bg-white/10"
              >
                Outras marcas
              </Link>
            </div>
          </div>

          <div className={`relative flex items-center justify-center transition-all duration-1000 delay-150 ${mounted ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}>
          </div>
        </div>
      </section>

      {/* ========== MODELOS ========== */}
      <section id="modelos" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[#C3002F]">ESCOLHA O SEU</p>
            <h2 className="mt-1 text-2xl font-light tracking-tight sm:text-3xl">Modelos disponíveis</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["Todos", "SUV", "Sedã"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-10 px-5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 ${
                  filter === f
                    ? "bg-black text-white"
                    : "border border-zinc-200 text-zinc-500 hover:border-black hover:text-black"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((car, idx) => (
            <article
              key={car.slug}
              className="group flex flex-col overflow-hidden border border-zinc-200 bg-white transition-all duration-400 hover:-translate-y-1.5 hover:border-zinc-300 hover:shadow-xl"
              style={{
                animation: mounted ? `fadeUp 0.65s ease-out ${idx * 0.1}s both` : "none",
              }}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                  {car.category}
                </span>
              </div>

              <div className="relative flex h-52 items-center justify-center bg-[#f3f3f3] px-6">
                <img
                  src={car.cover}
                  alt={car.name}
                  className="max-h-44 w-full object-contain transition-transform duration-600 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-semibold tracking-wide">{car.name}</h3>
                <p className="mt-1 text-sm text-zinc-500">{car.tagline}</p>
                <p className="mt-5 text-sm text-zinc-500">
                  A partir de <span className="font-semibold text-black">{formatPrice(car.priceStart)}</span>
                </p>
                <button
                  onClick={() => openBuilder(car)}
                  className="mt-6 h-12 w-full bg-[#C3002F] text-[12px] font-semibold uppercase tracking-[0.16em] text-white transition-all duration-200 hover:bg-[#9a0025] active:scale-[0.98]"
                >
                  Monte o seu
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200">
        <p className="mx-auto max-w-6xl px-4 py-8 text-[11px] leading-relaxed text-zinc-400">
          © 2026 Nacional Consórcio LTDA — Todos os direitos reservados.
        </p>
      </footer>

      {/* ========== BUILDER MODAL ========== */}
      {vehicle && version && color && (
        <div
          className={`fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 p-0 backdrop-blur-sm transition-opacity duration-300 sm:p-4 ${
            isClosing ? "opacity-0" : "opacity-100"
          }`}
          onClick={(e) => e.target === e.currentTarget && closeBuilder()}
        >
          <div
            className={`flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 sm:h-auto sm:max-h-[92vh] sm:rounded-lg ${
              isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
            }`}
          >
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-black px-5 py-4 text-white">
              <div>
                <p className="text-[10px] tracking-[0.22em] text-white/50 uppercase">
                  {step === "config" ? vehicle.category : "Cadastro do Cliente"}
                </p>
                <h3 className="text-lg font-semibold tracking-wide">
                  {step === "config" ? vehicle.name : "Dados para análise"}
                </h3>
              </div>
              <button
                onClick={closeBuilder}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid flex-1 overflow-y-auto lg:grid-cols-2">
              {/* Imagem + Resumo (sempre visível) */}
              <div className="flex flex-col bg-[#f3f3f3]">
                <div className="relative flex min-h-[220px] flex-1 items-center justify-center p-6">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-zinc-300 border-t-[#C3002F]" />
                    </div>
                  )}
                  <img
                    key={photo}
                    src={photo}
                    alt={`${vehicle.name} ${color.name}`}
                    onLoad={() => setImageLoaded(true)}
                    className={`max-h-56 w-full object-contain transition-all duration-500 sm:max-h-64 ${
                      imageLoaded ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
                  />
                </div>

                <div className="border-t border-zinc-200 bg-white p-5">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Resumo da configuração
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Modelo</span>
                      <span className="font-medium">{vehicle.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Versão</span>
                      <span className="font-medium">{version.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Cor</span>
                      <span className="flex items-center gap-2 font-medium">
                        <span className="inline-block h-3.5 w-3.5 rounded-full border border-zinc-300" style={{ backgroundColor: color.swatch }} />
                        {color.name}
                      </span>
                    </div>
                    <div className="my-2 h-px bg-zinc-100" />
                    <div className="flex justify-between text-zinc-500">
                      <span>Versão</span>
                      <span>{formatPrice(version.price)}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Cor</span>
                      <span>{extra > 0 ? `+ ${formatPrice(extra)}` : "Inclusa"}</span>
                    </div>
                    <div className="flex justify-between pt-1 text-base font-semibold">
                      <span>Total estimado</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conteúdo direito: Config ou Formulário */}
              <div className="flex flex-col p-6">
                {step === "config" ? (
                  <>
                    {/* Versões */}
                    <div className="mb-6">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Escolha a versão
                      </p>
                      <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                        {vehicle.versions.map((v) => (
                          <button
                            key={v.id}
                            onClick={() => pickVersion(v.id)}
                            className={`w-full border p-3 text-left transition-all duration-200 ${
                              versionId === v.id
                                ? "border-black bg-zinc-50"
                                : "border-zinc-200 hover:border-zinc-400"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <span className="text-sm font-medium">{v.title}</span>
                                <p className="mt-0.5 text-[11px] text-zinc-400">{v.subtitle}</p>
                              </div>
                              <span className="shrink-0 text-sm font-medium">{formatPrice(v.price)}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ficha técnica */}
                    <div className="mb-6 grid grid-cols-3 gap-3">
                      <div className="flex flex-col items-center rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
                        <Fuel size={16} className="mb-1 text-[#C3002F]" />
                        <span className="text-[10px] text-zinc-400">Combustível</span>
                        <span className="text-xs font-semibold">{version.fuel}</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
                        <Settings2 size={16} className="mb-1 text-[#C3002F]" />
                        <span className="text-[10px] text-zinc-400">Câmbio</span>
                        <span className="text-xs font-semibold">{version.transmission}</span>
                      </div>
                      <div className="flex flex-col items-center rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-center">
                        <Gauge size={16} className="mb-1 text-[#C3002F]" />
                        <span className="text-[10px] text-zinc-400">Potência</span>
                        <span className="text-xs font-semibold">{version.power}</span>
                      </div>
                    </div>

                    {/* Cores */}
                    <div className="mb-6">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Escolha a cor
                      </p>
                      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                        {palette.map((c) => {
                          const price = extraOf(vehicle, versionId, c);
                          const selected = color.id === c.id;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setColorId(c.id)}
                              className={`flex flex-col items-center gap-2 border p-2.5 transition-all duration-200 ${
                                selected ? "border-black bg-zinc-50" : "border-zinc-200 hover:border-zinc-400"
                              }`}
                            >
                              <span
                                className="h-8 w-8 rounded-full border border-zinc-300 shadow-inner"
                                style={{ backgroundColor: c.swatch }}
                              />
                              <span className="text-center text-[10px] leading-tight">{c.name}</span>
                              <span className="text-[9px] text-zinc-400">
                                {price > 0 ? `+ ${formatPrice(price)}` : "Inclusa"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Equipamentos */}
                    <div className="mb-6">
                      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Principais equipamentos
                      </p>
                      <ul className="grid grid-cols-1 gap-1.5 text-xs text-zinc-600 sm:grid-cols-2">
                        {version.highlights.map((h) => (
                          <li key={h} className="flex items-start gap-2">
                            <Check size={14} className="mt-0.5 shrink-0 text-[#C3002F]" />
                            {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto border-t border-zinc-200 pt-5">
                      <button
                        onClick={() => setStep("client")}
                        className="h-12 w-full bg-[#C3002F] text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-all duration-200 hover:bg-[#9a0025] active:scale-[0.98]"
                      >
                        Continuar para dados do cliente
                      </button>
                    </div>
                  </>
                ) : (
                  /* ========== FORMULÁRIO DO CLIENTE ========== */
                  <div className="flex h-full flex-col">
                    <button
                      onClick={() => {
                        setStep("config");
                        setFormError("");
                      }}
                      className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-zinc-500 transition hover:text-black"
                    >
                      <ArrowLeft size={14} />
                      Voltar para configuração
                    </button>

                    <p className="mb-5 text-sm text-zinc-500">
                      Preencha os dados do cliente para seguir.
                    </p>

                    <div className="space-y-4">
                      {/* Nome */}
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Nome completo do cliente"
                          className="h-11 w-full border border-zinc-200 px-3 text-sm outline-none transition focus:border-black"
                        />
                      </div>

                      {/* CPF */}
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          CPF *
                        </label>
                        <input
                          type="text"
                          value={clientCpf}
                          onChange={(e) => setClientCpf(maskCPF(e.target.value))}
                          placeholder="000.000.000-00"
                          className="h-11 w-full border border-zinc-200 px-3 text-sm outline-none transition focus:border-black"
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="cliente@email.com"
                          className="h-11 w-full border border-zinc-200 px-3 text-sm outline-none transition focus:border-black"
                        />
                      </div>

                      {/* Telefone */}
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Telefone *
                        </label>
                        <input
                          type="text"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(maskPhone(e.target.value))}
                          placeholder="91 9XXXX XXXX"
                          className="h-11 w-full border border-zinc-200 px-3 text-sm outline-none transition focus:border-black"
                        />
                        <p className="mt-1 text-[10px] text-zinc-400">
                          Dica: digite assim: 91 9XXXX XXXX
                        </p>
                      </div>

                      {/* Vendedor */}
                      <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                          Vendedor *
                        </label>
                        <input
                          type="text"
                          value={clientSeller}
                          onChange={(e) => setClientSeller(e.target.value)}
                          placeholder="Nome do vendedor responsável"
                          className="h-11 w-full border border-zinc-200 px-3 text-sm outline-none transition focus:border-black"
                        />
                      </div>
                    </div>

                    {formError && (
                      <p className="mt-4 text-sm font-medium text-red-600">{formError}</p>
                    )}

                    <div className="mt-auto border-t border-zinc-200 pt-5">
                      <button
                        onClick={goToAnalise}
                        className="h-12 w-full bg-[#C3002F] text-[12px] font-semibold uppercase tracking-[0.18em] text-white transition-all duration-200 hover:bg-[#9a0025] active:scale-[0.98]"
                      >
                        Enviar para análise de consórcio
                      </button>
                      <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-400">
                        Ao continuar, os dados do cliente e da configuração serão enviados para análise.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animações */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-1deg); }
          50% { transform: translateY(-16px) rotate(1deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(1deg); }
          50% { transform: translateY(-12px) rotate(-1deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 9s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 12s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 11s ease-in-out infinite 1.2s; }
      `}</style>
    </main>
  );
}