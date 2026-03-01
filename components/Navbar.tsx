"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User,
  Menu,
  X,
  Phone,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  CarFront,
  ChevronDown,
  LogIn,
} from "lucide-react";
import VehiclesMenu from "./VehiclesMenu";
import MobileCatalogModal from "./MobileCatalogModal"; // ✅ NOVO
import { detectBrandFromPath, withBrandPath } from "@/lib/brand";

// =====================================================================
// 🔧 ÁREA DE CONFIGURAÇÃO DE IMAGENS
// =====================================================================
const BRAND_ASSETS = {
  chevrolet: {
    logoNavbar: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg",
    logoSidebar: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.png",
  },
  hyundai: {
    logoNavbar: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg",
    logoSidebar: "https://upload.wikimedia.org/wikipedia/commons/4/44/Hyundai_Motor_Company_logo.svg",
  },
};
// =====================================================================

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ NOVO: modal catálogo mobile (full screen)
  const [catalogOpen, setCatalogOpen] = useState(false);

  // Estados de Usuário
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const activeBrand = detectBrandFromPath(pathname);
  const brandAssets = BRAND_ASSETS[activeBrand];

  // 👇 evita bug de closure (listener comparando com user antigo)
  const currentUserIdRef = useRef<string | null>(null);

  // Fecha sidebar ao navegar
  useEffect(() => {
    setSidebarOpen(false);
    setMenuAberto(null);
    setCatalogOpen(false); // ✅ fecha catálogo ao navegar
  }, [pathname]);

  // ✅ trava scroll do body quando o catálogo full-screen estiver aberto
  useEffect(() => {
    if (!catalogOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [catalogOpen]);

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
      // ignora silencioso
    }
  };

  // ✅ Auth: não bloqueia UI, não dá “travada” ao navegar
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

        // libera UI logo (não espera profile)
        setLoading(false);

        if (u?.id) {
          void fetchProfile(u.id);
        } else {
          setFullName("");
          setAvatarUrl("");
          setUserRole(null);
        }
      } catch (e) {
        if (!mounted) return;
        setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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
    });

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

      setMenuAberto(null);
      setSidebarOpen(false);
      setCatalogOpen(false);

      router.push("/login");
      router.refresh();
    }
  };

  const toggleMenu = (menu: string) => setMenuAberto(menuAberto === menu ? null : menu);

  // ✅ REGRAS DE ROLE
  const role = (userRole || "").toLowerCase();
  const email = (user?.email || "").toLowerCase();

  // fallback por email (se quiser tirar depois, ok)
  const isAdmin = role === "admin" || email.includes("admin");
  const isSupervisor = role === "supervisor" || email.startsWith("s");
  const isVendedor = !isAdmin && !isSupervisor;

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

  const dashboardIcon = isAdmin ? (
    <ShieldCheck size={16} />
  ) : (
    <LayoutDashboard size={16} />
  );

  const displayName = fullName || user?.email?.split("@")[0];

  return (
    <>
      {/* --- NAVBAR FIXA --- */}
      <nav className="fixed w-full z-[1001] top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-12 shadow-sm font-sans transition-all">
        {/* ESQUERDA */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
            aria-label="Abrir Menu"
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:flex items-center">
            <button
              onClick={() => toggleMenu("veiculos")}
              className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all px-4 py-2 rounded-full ${
                menuAberto === "veiculos"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:text-black hover:bg-gray-100"
              }`}
            >
              {menuAberto === "veiculos" ? <X size={14} /> : <Menu size={14} />} Veículos
            </button>
          </div>
        </div>

        {/* CENTRO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href={withBrandPath("/", activeBrand)}
            onClick={() => {
              setMenuAberto(null);
              setCatalogOpen(false);
            }}
            className="block"
          >
            <img
              src={brandAssets.logoNavbar}
              alt="Logo"
              className="h-6 lg:h-8 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            <Link href="/chevrolet" className={`px-2 py-1 rounded ${activeBrand === "chevrolet" ? "bg-black text-white" : "text-gray-500"}`}>Chevrolet</Link>
            <Link href="/hyundai" className={`px-2 py-1 rounded ${activeBrand === "hyundai" ? "bg-black text-white" : "text-gray-500"}`}>Hyundai</Link>
          </div>
          <div className="hidden lg:block">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${
                      isAdmin ? "bg-black text-[#f2e14c]" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">
                      Olá,
                    </p>
                    <p className="text-xs font-bold text-gray-900 leading-none max-w-[80px] truncate">
                      {displayName}
                    </p>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="p-3 mb-2 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                    <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>

                  {/* ✅ UM ÚNICO BOTÃO (muda conforme role) */}
                  <Link
                    href={dashboardLink}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-black"
                  >
                    {dashboardIcon} {dashboardLabel}
                  </Link>

                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-black"
                  >
                    <User size={16} /> Meus Dados
                  </Link>
                  <div className="h-px bg-gray-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex text-xs font-black uppercase tracking-wide text-black hover:bg-black hover:text-[#f2e14c] px-6 py-2.5 rounded-full border border-black transition-all"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* --- MEGA MENU (DESKTOP) --- */}
      <div
        className={`fixed top-[0px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] menu-dropdown ${
          menuAberto === "veiculos" ? "menu-dropdown-ativo" : ""
        }`}
      >
        <VehiclesMenu onClose={() => setMenuAberto(null)} />
      </div>

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(null)}
          className="fixed inset-0 top-16 bg-black/40 z-[999] backdrop-blur-[2px] transition-opacity duration-300"
        />
      )}

      {/* --- SIDEBAR (MOBILE) --- */}
      <div
        className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-500 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-[2001] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 h-20">
          <img src={brandAssets.logoSidebar} alt="Logo" className="h-12 w-auto object-contain" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            {user ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${
                      isAdmin
                        ? "bg-black text-[#f2e14c]"
                        : "bg-white border border-gray-200 text-gray-600"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={18} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  {/* ✅ UM ÚNICO BOTÃO (muda conforme role) */}
                  <Link
                    href={dashboardLink}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
                  >
                    {isAdmin ? <ShieldCheck size={14} /> : <LayoutDashboard size={14} />}{" "}
                    {dashboardLabel}
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} /> Sair da Conta
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-3">Acesse sua conta para gerenciar propostas.</p>
                <Link
                  href="/login"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-bold uppercase py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <LogIn size={16} /> Entrar / Cadastrar
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
              Navegação
            </p>

            {/* ✅ NOVO: CATÁLOGO (abre full screen) */}
            <button
              onClick={() => {
                setSidebarOpen(false);
                setCatalogOpen(true);
              }}
              className="w-full flex items-center gap-4 text-gray-900 font-bold text-sm uppercase tracking-wide hover:text-[#f2e14c] group transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-[#f2e14c] transition-colors text-gray-400">
                <CarFront size={18} />
              </span>
              Catálogo
            </button>

            <Link
              href="/vendedor/seminovos"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-4 text-gray-900 font-bold text-sm uppercase tracking-wide hover:text-[#f2e14c] group transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-[#f2e14c] transition-colors text-gray-400">
                <CarFront size={18} />
              </span>
              SemiNovos
            </Link>

            <Link
              href="#"
              className="flex items-center gap-4 text-gray-900 font-bold text-sm uppercase tracking-wide hover:text-[#f2e14c] group transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-[#f2e14c] transition-colors text-gray-400">
                <Phone size={18} />
              </span>
              Fale Conosco
            </Link>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium">© 2026 WBCNAC Digital</p>
        </div>
      </div>

      {/* ✅ MODAL FULL SCREEN DO CATÁLOGO (MOBILE) */}
      <MobileCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </>
  );
}