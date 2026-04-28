"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Menu,
  User,
  ChevronRight,
  ChevronDown,
  MessageCircle,
  ChevronUp,
  Facebook,
  Instagram,
  Youtube,
  X,
  Phone,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  CarFront,
  LogIn,
  Search,
} from "lucide-react";

type FiatCategory =
  | "TODOS"
  | "PASSEIO"
  | "SUV"
  | "ESPORTIVOS"
  | "PICAPES"
  | "HÍBRIDOS"
  | "UTILITÁRIOS"
  | "ELÉTRICOS";

type Vehicle = {
  slug: string;
  name: string;
  image: string;
  categories: FiatCategory[];
};

type VehicleRow = {
  model_name: string;
  slug: string;
  catalog_cover_url?: string | null;
  image_url?: string | null;
  is_visible?: boolean | null;
};

const FIAT_IMAGES = {
  logo: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/logo_header_hub_fiat_02.svg",
  heroBg: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/Screenshot_24.svg",
  heroMain: "COLE_AQUI_IMAGEM_PRINCIPAL_HERO",
  promoLeft:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/banner-mini-home-fiat-dia-d@2x.webp",
  promoRight:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/fiat-por-assinatura-fastback-home.webp",
  carPulse: "COLE_AQUI_PULSE_HYBRID",
  carFastback: "COLE_AQUI_FASTBACK_HYBRID",
  carTitano: "COLE_AQUI_TITANO",
  carToro: "COLE_AQUI_TORO",
  carStrada: "COLE_AQUI_STRADA",
  abarthBanner:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/02_destaque_home_abarth_desk.webp",
  fastbackCard:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/minibanner_home_fastbackMY26.webp",
  connectMeCard:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/minibanner-destaque-home-connectme.webp",
  optPcd:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/pcd-novo-banner-home.webp",
  optFinanciamento:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/financiamento.webp",
  optConsorcio:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/consorcio.webp",
  optVendasDiretas:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/banner-vendas-diretas-novo-home.webp",
  optPlanoFazendeiro:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/1-plano-fazendeiro-home.webp",
  optSeminovos:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/seminovos.webp",
  footerLogo:
    "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/BANNERS%20FIAT/logo_footer_hub_fiat.svg",
};


const LOGO_SIDEBAR =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.png";

const CONSULTA_CLIENTE_LINK = "/vendedor/consulta-cliente";

const fiatCategories: FiatCategory[] = [
  "TODOS",
  "PASSEIO",
  "SUV",
  "ESPORTIVOS",
  "PICAPES",
  "HÍBRIDOS",
  "UTILITÁRIOS",
  "ELÉTRICOS",
];

const fallbackVehicles: Vehicle[] = [
  {
    slug: "pulse-hybrid",
    name: "Pulse Hybrid",
    image: FIAT_IMAGES.carPulse,
    categories: ["TODOS", "SUV", "HÍBRIDOS"],
  },
  {
    slug: "fastback-hybrid",
    name: "Fastback Hybrid",
    image: FIAT_IMAGES.carFastback,
    categories: ["TODOS", "SUV", "HÍBRIDOS"],
  },
  {
    slug: "titano",
    name: "Titano",
    image: FIAT_IMAGES.carTitano,
    categories: ["TODOS", "PICAPES", "UTILITÁRIOS"],
  },
  {
    slug: "toro",
    name: "Toro",
    image: FIAT_IMAGES.carToro,
    categories: ["TODOS", "PICAPES"],
  },
  {
    slug: "strada",
    name: "Strada",
    image: FIAT_IMAGES.carStrada,
    categories: ["TODOS", "PICAPES", "UTILITÁRIOS"],
  },
];

const fiatCategoryBySlug: Record<string, FiatCategory[]> = {
  // PASSEIO
  mobi: ["TODOS", "PASSEIO"],
  argo: ["TODOS", "PASSEIO"],
  cronos: ["TODOS", "PASSEIO"],
  "e500": ["TODOS", "ELÉTRICOS"],

  // SUV
  pulse: ["TODOS", "SUV"],
  "pulse-hybrid": ["TODOS", "SUV", "HÍBRIDOS"],
  fastback: ["TODOS", "SUV"],
  "fastback-hybrid": ["TODOS", "SUV", "HÍBRIDOS"],

  // ESPORTIVOS
  abarth: ["TODOS", "ESPORTIVOS"],
  "pulse-abarth": ["TODOS", "SUV", "ESPORTIVOS"],
  "fastback-abarth": ["TODOS", "SUV", "ESPORTIVOS"],

  // PICAPES
  strada: ["TODOS", "PICAPES", "UTILITÁRIOS"],
  toro: ["TODOS", "PICAPES"],
  titano: ["TODOS", "PICAPES", "UTILITÁRIOS"],

  // UTILITÁRIOS
  fiorino: ["TODOS", "UTILITÁRIOS"],
  ducato: ["TODOS", "UTILITÁRIOS"],
  scudo: ["TODOS", "UTILITÁRIOS"],
  "e-scudo": ["TODOS", "UTILITÁRIOS", "ELÉTRICOS"],
};

function normalizeText(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function uniqueCategories(categories: FiatCategory[]) {
  return Array.from(new Set(categories));
}

function getVehicleCategories(slug: string, name: string): FiatCategory[] {
  const normalizedSlug = normalizeText(slug);
  const normalizedName = normalizeText(name);
  const search = `${normalizedSlug} ${normalizedName}`;

  const exact = fiatCategoryBySlug[normalizedSlug];
  if (exact?.length) return exact;

  const partial = Object.entries(fiatCategoryBySlug).find(([key]) =>
    search.includes(normalizeText(key))
  );

  if (partial?.[1]?.length) return partial[1];

  const categories: FiatCategory[] = ["TODOS"];

  if (search.includes("hybrid") || search.includes("hibrido")) {
    categories.push("HÍBRIDOS");
  }

  if (search.includes("eletric") || search.includes("500e") || search.includes("e-scudo")) {
    categories.push("ELÉTRICOS");
  }

  if (search.includes("abarth") || search.includes("sport")) {
    categories.push("ESPORTIVOS");
  }

  if (
    search.includes("pulse") ||
    search.includes("fastback") ||
    search.includes("suv")
  ) {
    categories.push("SUV");
  }

  if (
    search.includes("strada") ||
    search.includes("toro") ||
    search.includes("titano") ||
    search.includes("picape")
  ) {
    categories.push("PICAPES");
  }

  if (
    search.includes("fiorino") ||
    search.includes("ducato") ||
    search.includes("scudo") ||
    search.includes("utilitario") ||
    search.includes("cargo")
  ) {
    categories.push("UTILITÁRIOS");
  }

  if (categories.length === 1) {
    categories.push("PASSEIO");
  }

  return uniqueCategories(categories);
}

const opportunities = [
  {
    title: "DESCONTO PARA PCD",
    image: FIAT_IMAGES.optPcd,
    description:
      "Vá além com a Fiat! Conheça os benefícios exclusivos para pessoas com deficiência.",
  },
  {
    title: "FINANCIAMENTO",
    image: FIAT_IMAGES.optFinanciamento,
    description:
      "Com ou sem entrada, aqui você encontra o financiamento ideal para realizar o sonho do carro novo.",
  },
  {
    title: "CONSÓRCIO",
    image: FIAT_IMAGES.optConsorcio,
    description:
      "No consórcio Fiat você investe e conquista um carro novinho em folha. Parcelas sem entrada e sem juros.",
  },
  {
    title: "VENDAS DIRETAS",
    image: FIAT_IMAGES.optVendasDiretas,
    description:
      "Um programa feito para empresas, com condições e ofertas exclusivas.",
  },
  {
    title: "PLANO FAZENDEIRO",
    image: FIAT_IMAGES.optPlanoFazendeiro,
    description: "O financiamento pensado para você que vive na terra.",
  },
  {
    title: "FIAT SEMINOVOS",
    image: FIAT_IMAGES.optSeminovos,
    description:
      "Mais tranquilidade e segurança na compra de usados com Spoticar, nossa parceira oficial.",
  },
];

const footerColumns = [
  [
    "Carros",
    "Fiat Professional",
    "Conheça Abarth",
    "Institucional",
    "Fiat Connect////Me",
    "Política de Qualidade",
  ],
  [
    "Ofertas Fiat",
    "Vendas Diretas",
    "Serviços Financeiros",
    "Fale Conosco",
    "Fiat Comuniità",
    "Política de Privacidade",
  ],
  [
    "Programa Acesse Fiat",
    "Fiat Seminovos",
    "Todos os Serviços",
    "Reparador Fiat",
    "Comunicado de Fraude",
  ],
  [
    "Serviços Fiat",
    "Manuais",
    "Recall",
    "Recall Airbag Takata",
    "Concessionárias",
    "Fiat Lovers",
    "Giro Fiat",
    "Fiatwear",
    "Proconve - Ruído e Opacidade",
    "Fichas de Resgate",
  ],
];

function mapVehicleFromDb(row: VehicleRow): Vehicle {
  return {
    slug: row.slug,
    name: row.model_name,
    image: row.catalog_cover_url || row.image_url || "",
    categories: getVehicleCategories(row.slug, row.model_name),
  };
}


function FiatNavbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

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
    } catch {
      // mantém a navbar funcionando mesmo se o perfil não carregar
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const u = session?.user ?? null;
        if (!mounted) return;

        setUser(u);
        currentUserIdRef.current = u?.id ?? null;
        setLoading(false);

        if (u?.id) {
          void fetchProfile(u.id);
        } else {
          setFullName("");
          setAvatarUrl("");
          setUserRole(null);
        }
      } catch {
        if (!mounted) return;
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        if (!mounted) return;

        const u = session?.user ?? null;
        setUser(u);

        const newId = u?.id ?? null;
        const prevId = currentUserIdRef.current;

        currentUserIdRef.current = newId;
        setLoading(false);

        if (!newId) {
          setFullName("");
          setAvatarUrl("");
          setUserRole(null);
          return;
        }

        if (newId !== prevId) {
          void fetchProfile(newId);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const consultaClienteLink = isSupervisor
    ? "/supervisor/consultar-cliente"
    : CONSULTA_CLIENTE_LINK;

  const dashboardIcon = isAdmin ? (
    <ShieldCheck size={16} />
  ) : (
    <LayoutDashboard size={16} />
  );

  const displayName = fullName || user?.email?.split("@")[0];

  return (
    <>
      <nav className="fixed top-0 z-[1001] flex h-16 w-full items-center justify-between border-b border-white/10 bg-black px-4 font-sans shadow-sm transition-all md:px-6">
        <div className="flex h-full items-center">
          <Link href="/fiat" className="flex h-full items-center">
            <img
              src={FIAT_IMAGES.logo}
              alt="Fiat"
              className="h-[28px] w-auto object-contain transition-opacity hover:opacity-80 md:h-[32px]"
            />
          </Link>
        </div>

        <div className="flex h-full items-center">
          <div className="hidden h-full items-center lg:flex">
            {loading ? (
              <div className="mx-4 h-8 w-8 animate-pulse rounded-full bg-white/20" />
            ) : user ? (
              <div className="group relative flex h-full items-center border-l border-white/20 px-3">
                <button
                  className="flex h-full min-w-[96px] items-center justify-center gap-2 text-white"
                  type="button"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${
                      isAdmin ? "bg-white text-black" : "bg-white/10 text-white"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>

                  <div className="text-left">
                    <p className="mb-0.5 text-[9px] font-bold uppercase leading-none text-white/45">
                      Fiat ID
                    </p>
                    <p className="max-w-[95px] truncate text-[11px] font-black uppercase leading-none text-white">
                      {displayName}
                    </p>
                  </div>

                  <ChevronDown size={14} className="text-white/45" />
                </button>

                <div className="invisible absolute right-0 top-full mt-3 w-64 translate-y-2 rounded-2xl border border-gray-100 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="mb-2 rounded-xl bg-gray-50 p-3">
                    <p className="truncate text-xs font-bold text-gray-900">{displayName}</p>
                    <p className="truncate text-[10px] text-gray-500">{user.email}</p>
                  </div>

                  <Link
                    href={dashboardLink}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-black"
                  >
                    {dashboardIcon} {dashboardLabel}
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-black"
                  >
                    <User size={16} /> Meus Dados
                  </Link>

                  <Link
                    href={consultaClienteLink}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-black"
                  >
                    <Search size={16} /> Consulta de Cliente
                  </Link>

                  <div className="my-1 h-px bg-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                    type="button"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex h-full min-w-[84px] flex-col items-center justify-center border-l border-white/20 px-3 text-white transition hover:bg-white/10"
              >
                <User className="h-[15px] w-[15px]" />
                <span className="mt-1 text-[9px] font-bold uppercase tracking-wide">
                  Entrar
                </span>
              </Link>
            )}
          </div>

          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-full min-w-[64px] flex-col items-center justify-center border-l border-white/20 px-3 text-white transition hover:bg-white/10"
            aria-label="Abrir Menu"
            type="button"
          >
            <Menu className="h-[16px] w-[16px]" />
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wide">
              Menu
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`fixed right-0 top-0 z-[2001] flex h-full w-[85%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-500 ease-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-100 p-6">
          <img src={FIAT_IMAGES.logo} alt="Fiat" className="h-8 w-auto object-contain" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-full bg-gray-50 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            {loading ? (
              <div className="h-20 animate-pulse rounded-xl bg-gray-200" />
            ) : user ? (
              <>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${
                      isAdmin
                        ? "bg-black text-[#f2e14c]"
                        : "border border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div>
                    <p className="max-w-[150px] truncate text-xs font-bold text-gray-900">
                      {displayName}
                    </p>
                    <p className="max-w-[150px] truncate text-[10px] text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href={dashboardLink}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                  >
                    {isAdmin ? <ShieldCheck size={14} /> : <LayoutDashboard size={14} />}
                    {dashboardLabel}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                  >
                    <User size={14} /> Meus Dados
                  </Link>

                  <Link
                    href={consultaClienteLink}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                  >
                    <Search size={14} /> Consulta de Cliente
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                    type="button"
                  >
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-3 text-xs text-gray-500">Acesse sua conta para gerenciar propostas.</p>
                <Link
                  href="/login"
                  onClick={() => setSidebarOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-gray-800"
                >
                  <LogIn size={16} /> Entrar / Cadastrar
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <p className="border-b border-gray-100 pb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Navegação
            </p>

            <Link
              href="/fiat"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors hover:text-[#ff1435]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-white">
                <ChevronRight size={18} />
              </span>
              Início Fiat
            </Link>

            <Link
              href="#fiat-catalogo"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors hover:text-[#ff1435]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-white">
                <ChevronDown size={18} />
              </span>
              Catálogo Fiat
            </Link>

            <Link
              href="/vendedor/seminovos"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors hover:text-[#ff1435]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-white">
                <ChevronRight size={18} />
              </span>
              SemiNovos
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 text-center">
          <p className="text-[10px] font-medium text-gray-400">© 2026 WBCNAC Digital</p>
        </div>
      </div>
    </>
  );
}

export default function FiatPage() {
  const [activeCategory, setActiveCategory] = useState<FiatCategory>("TODOS");
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [catalogMotionKey, setCatalogMotionKey] = useState(0);
  const [catalogDirection, setCatalogDirection] = useState<"category" | "next">(
    "category"
  );
  const [dbVehicles, setDbVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    async function loadFiatVehicles() {
      const { data, error } = await supabase
        .from("vehicles")
        .select("model_name, slug, catalog_cover_url, image_url, is_visible")
        .eq("brand", "fiat")
        .eq("is_visible", true)
        .order("id", { ascending: false });

      if (error) {
        console.error("Erro ao carregar veículos Fiat:", error.message);
        return;
      }

      const mapped = ((data || []) as VehicleRow[])
        .filter((vehicle) => vehicle.slug && vehicle.model_name)
        .map(mapVehicleFromDb);

      setDbVehicles(mapped);
    }

    loadFiatVehicles();
  }, []);

  useEffect(() => {
    const updateViewport = () => setIsMobile(window.innerWidth < 768);
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const catalogVehicles = dbVehicles.length > 0 ? dbVehicles : fallbackVehicles;

  const filteredVehicles = useMemo(() => {
    if (activeCategory === "TODOS") return catalogVehicles;
    return catalogVehicles.filter((vehicle) =>
      vehicle.categories.includes(activeCategory)
    );
  }, [activeCategory, catalogVehicles]);

  const itemsPerPage = isMobile ? 2 : 5;
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / itemsPerPage));

  const visibleVehicles = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredVehicles.slice(start, start + itemsPerPage);
  }, [filteredVehicles, page, itemsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [activeCategory]);

  useEffect(() => {
    if (filteredVehicles.length === 0) {
      setSelectedVehicle(null);
      return;
    }

    const exists = filteredVehicles.some(
      (vehicle) => vehicle.slug === selectedVehicle
    );

    if (!exists) {
      setSelectedVehicle(filteredVehicles[0].slug);
    }
  }, [filteredVehicles, selectedVehicle]);

  const handleCategoryClick = (category: FiatCategory) => {
    if (category === activeCategory) return;
    setCatalogDirection("category");
    setCatalogMotionKey((prev) => prev + 1);
    setActiveCategory(category);
  };

  const handleNextPage = () => {
    if (totalPages <= 1) return;
    setCatalogDirection("next");
    setCatalogMotionKey((prev) => prev + 1);
    setPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <main id="top" className="min-h-screen bg-[#f1f0e8] pt-16 text-black">
      <FiatNavbar />

      <section className="relative min-h-[690px] w-full overflow-hidden bg-[#006b16] md:min-h-[760px]">
        <div className="absolute inset-0">
          <img
            src={FIAT_IMAGES.heroBg}
            alt="Hero background"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.18),rgba(0,0,0,0.04))]" />

        <div className="relative mx-auto flex min-h-[690px] max-w-[1720px] flex-col justify-center px-6 md:min-h-[760px] md:px-12">
          <div className="grid items-center gap-8 md:grid-cols-[410px_1fr] md:gap-0">
            <div className="z-10 max-w-[360px] pt-10 md:pt-0">
              <h1 className="text-[44px] font-black leading-[1.05] text-white md:text-[64px]">
                Fiat Pulse
                <br />
                Edição Especial
                <br />
                LollaBR
              </h1>

              <p className="mt-6 max-w-[260px] text-[22px] font-medium leading-[1.2] text-white md:text-[18px]">
                Fiat: há 50 anos dançando conforme a sua música.
              </p>

              <button
                className="mt-10 inline-flex h-[52px] min-w-[155px] items-center justify-center bg-[#ff1435] px-8 text-[17px] font-extrabold uppercase text-white [clip-path:polygon(12%_0,100%_0,88%_100%,0_100%)]"
                type="button"
              >
                Conheça
              </button>
            </div>

            <div className="relative flex items-center justify-center md:justify-end">
              <img
                src={FIAT_IMAGES.heroMain}
                alt=""
                className="relative z-10 w-full max-w-[860px] object-contain md:max-w-[940px] md:translate-x-[-10px] md:translate-y-[10px]"
              />
            </div>
          </div>

          <div className="absolute bottom-[18px] left-1/2 flex -translate-x-1/2 items-center gap-2 text-white">
            <span className="text-[18px] font-medium md:text-[20px]">
              Conheça as novidades Fiat
            </span>
            <ChevronDown className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section className="relative z-20 -mt-[24px] bg-[#f1f0e8] px-5 pb-8 pt-0 md:-mt-[86px] md:px-8 md:pb-10">
        <div className="mx-auto grid max-w-[1660px] gap-7 md:grid-cols-2">
          <a className="block overflow-hidden shadow-none" href="#">
            <img
              src={FIAT_IMAGES.promoLeft}
              alt="Promoção esquerda"
              className="block w-full object-cover"
            />
          </a>

          <a className="block overflow-hidden shadow-none" href="#">
            <img
              src={FIAT_IMAGES.promoRight}
              alt="Promoção direita"
              className="block w-full object-cover"
            />
          </a>
        </div>
      </section>

      <section
        id="fiat-catalogo"
        className="bg-[#f1f0e8] px-5 pb-8 pt-2 md:px-8 md:pb-12"
      >
        <div className="mx-auto max-w-[1660px]">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 md:mb-10 md:gap-x-3">
            {fiatCategories.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`group relative h-[44px] border-b border-black px-4 text-[18px] font-extrabold uppercase tracking-tight transition-all duration-300 md:px-6 ${
                    isActive
                      ? "border-black bg-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                      : "bg-transparent text-black hover:bg-black hover:text-white"
                  }`}
                  type="button"
                >
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
          </div>

          <div className="relative overflow-hidden">
            {filteredVehicles.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[22px] font-black uppercase text-[#0a1230]">
                  Nenhum veículo encontrado nesta categoria
                </p>
              </div>
            ) : (
              <>
                <div
                  key={`${activeCategory}-${page}-${catalogMotionKey}`}
                  className={`grid grid-cols-1 gap-y-12 md:grid-cols-5 md:gap-x-6 ${
                    catalogDirection === "next"
                      ? "catalog-enter-side"
                      : "catalog-enter-category"
                  }`}
                >
                  {visibleVehicles.map((vehicle, index) => {
                    const isSelected = selectedVehicle === vehicle.slug;

                    return (
                      <div
                        key={vehicle.slug}
                        className={`min-w-0 transition-all duration-300 catalog-card-item ${
                          isSelected ? "scale-[1.01]" : ""
                        }`}
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <div className="flex h-[280px] items-end justify-center md:h-[250px]">
                          {vehicle.image ? (
                            <img
                              src={vehicle.image}
                              alt={vehicle.name}
                              className="max-h-full w-full object-contain transition-transform duration-500 hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/60 text-xs font-black uppercase text-black/40">
                              Sem imagem
                            </div>
                          )}
                        </div>

                        <div className="mt-5 text-center md:text-left">
                          <h3 className="text-[38px] font-black leading-none tracking-tight text-[#0a1230] md:text-[30px]">
                            {vehicle.name}
                          </h3>

                          <div className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                            {vehicle.categories
                              .filter((category) => category !== "TODOS")
                              .map((category) => (
                                <span
                                  key={`${vehicle.slug}-${category}`}
                                  className="rounded-full bg-black/10 px-3 py-1 text-[10px] font-black uppercase text-[#0a1230]"
                                >
                                  {category}
                                </span>
                              ))}
                          </div>

                          <div className="mt-5 flex items-center justify-center gap-8 md:justify-start">
                            <button
                              type="button"
                              onClick={() => setSelectedVehicle(vehicle.slug)}
                              className={`inline-flex items-center gap-1 text-[19px] font-black uppercase tracking-tight transition-colors duration-300 ${
                                isSelected ? "text-[#ff1435]" : "text-[#0a1230]"
                              }`}
                            >
                              Conheça <ChevronRight className="h-4 w-4" />
                            </button>

                            <Link
                              href={`/fiat/builder?vehicle=${vehicle.slug}`}
                              className="inline-flex items-center gap-1 text-[19px] font-black uppercase tracking-tight text-[#0a1230] transition-all duration-300 hover:text-[#ff1435]"
                            >
                              Monte <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <button
                    type="button"
                    onClick={handleNextPage}
                    className="absolute right-0 top-[120px] hidden h-[72px] w-[56px] items-center justify-center bg-[#ff1435] text-white transition-all duration-300 hover:scale-105 hover:bg-[#e80f30] active:scale-95 md:flex"
                  >
                    <ChevronRight className="h-8 w-8 transition-transform duration-300" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 py-4 md:px-8 md:py-6">
        <div className="mx-auto max-w-[1660px]">
          <a href="#" className="block overflow-hidden">
            <img
              src={FIAT_IMAGES.abarthBanner}
              alt="Abarth"
              className="block w-full object-cover"
            />
          </a>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 py-4 md:px-8 md:py-6">
        <div className="mx-auto grid max-w-[1660px] gap-7 md:grid-cols-2">
          <a href="#" className="block overflow-hidden">
            <img
              src={FIAT_IMAGES.fastbackCard}
              alt="Novo Fiat Fastback"
              className="block w-full object-cover"
            />
          </a>

          <a href="#" className="block overflow-hidden">
            <img
              src={FIAT_IMAGES.connectMeCard}
              alt="Fiat Connect Me"
              className="block w-full object-cover"
            />
          </a>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 pb-14 pt-8 md:px-8 md:pt-10">
        <div className="mx-auto flex max-w-[1660px] items-start gap-6 md:gap-14">
          <div className="pt-1">
            <div className="text-[74px] font-black italic leading-none text-[#ff1435] md:text-[86px]">
              ////
            </div>
          </div>

          <div className="max-w-[1100px]">
            <h2 className="text-[24px] font-black uppercase leading-[1.08] tracking-tight text-black md:text-[34px]">
              As melhores oportunidades e condições você encontra na Fiat.
            </h2>
          </div>
        </div>
      </section>

      <section className="bg-[#f1f0e8] px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-[1060px]">
          <div className="grid grid-cols-1 gap-x-[18px] gap-y-[40px] md:grid-cols-3">
            {opportunities.map((item) => (
              <div key={item.title}>
                <div className="mb-2 text-[11px] font-extrabold uppercase tracking-tight text-black">
                  {item.title}
                </div>

                <a href="#" className="block overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="block h-auto w-full object-cover"
                  />
                </a>

                <p className="mt-3 text-[11px] leading-[1.35] text-black">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#120b1d] px-5 pb-16 pt-10 text-white md:px-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-[1240px]">
          <div className="mb-14 flex justify-center">
            <a
              href="#top"
              className="inline-flex items-center gap-2 text-[13px] font-medium text-white/95"
            >
              <ChevronUp className="h-4 w-4" />
              Voltar para o topo
            </a>
          </div>

          <div className="grid grid-cols-1 gap-y-10 md:grid-cols-4 md:gap-x-12">
            {footerColumns.map((column, index) => (
              <div key={index} className="space-y-3">
                {column.map((item) => (
                  <a
                    key={item}
                    href="#"
                    className="block text-[14px] leading-[1.35] text-white/95 transition hover:text-white"
                  >
                    {item}
                  </a>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-20 flex flex-col items-center justify-center">
            <img
              src={FIAT_IMAGES.footerLogo}
              alt="Fiat"
              className="h-[86px] w-auto object-contain md:h-[96px]"
            />

            <div className="mt-10 flex items-center gap-8 text-white">
              <a href="#" aria-label="Facebook">
                <Facebook className="h-9 w-9 fill-current stroke-0" />
              </a>
              <a href="#" aria-label="YouTube">
                <Youtube className="h-10 w-10 fill-current stroke-0" />
              </a>
              <a href="#" aria-label="Instagram">
                <Instagram className="h-9 w-9" />
              </a>
              <a href="#" aria-label="X" className="text-[52px] leading-none text-white">
                𝕏
              </a>
            </div>
          </div>
        </div>
      </footer>

      <a
        href="#"
        className="fixed bottom-6 right-6 z-50 flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#2bd15c] text-white shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:scale-105"
      >
        <MessageCircle className="h-8 w-8" />
      </a>

      <div className="fixed right-0 top-[240px] z-40 hidden flex-col md:flex">
        <button className="flex h-[60px] w-[50px] items-center justify-center rounded-l-[10px] border border-white/20 bg-[#003da6] text-white">
          <span className="text-[26px] font-bold">♿</span>
        </button>
        <button className="mt-[2px] flex h-[60px] w-[50px] items-center justify-center rounded-l-[10px] border border-white/20 bg-[#003da6] text-white">
          <span className="text-[22px] font-bold">🤚</span>
        </button>
      </div>

      <style jsx global>{`
        .catalog-enter-category {
          animation: catalogFadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .catalog-enter-side {
          animation: catalogSlideLeft 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .catalog-card-item {
          opacity: 0;
          animation: catalogCardIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @keyframes catalogFadeUp {
          0% {
            opacity: 0;
            transform: translateY(18px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes catalogSlideLeft {
          0% {
            opacity: 0;
            transform: translateX(26px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes catalogCardIn {
          0% {
            opacity: 0;
            transform: translateY(24px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}