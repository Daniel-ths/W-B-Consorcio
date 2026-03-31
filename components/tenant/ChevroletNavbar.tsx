"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
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
  Search,
} from "lucide-react";
import VehiclesMenu from "@/components/VehiclesMenu";
import MobileCatalogModal from "@/components/MobileCatalogModal";

// =====================================================================
// 🔧 ÁREA DE CONFIGURAÇÃO DE IMAGENS
// =====================================================================
const LOGO_NAVBAR =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg";
const LOGO_SIDEBAR =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.png";
// =====================================================================

const CONSULTA_CLIENTE_LINK = "/vendedor/consulta-cliente";

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [catalogOpen, setCatalogOpen] = useState(false);

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
    setMenuAberto(null);
    setCatalogOpen(false);
  }, [pathname]);

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
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
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

  const dashboardIcon = isAdmin ? (
    <ShieldCheck size={16} />
  ) : (
    <LayoutDashboard size={16} />
  );

  const displayName = fullName || user?.email?.split("@")[0];

  return (
    <>
      <nav className="fixed top-0 z-[1001] flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white/95 px-4 font-sans shadow-sm backdrop-blur-md transition-all lg:px-12">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-full p-2 text-gray-700 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Abrir Menu"
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:flex items-center">
            <button
              onClick={() => toggleMenu("veiculos")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all ${
                menuAberto === "veiculos"
                  ? "bg-black text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-black"
              }`}
            >
              {menuAberto === "veiculos" ? <X size={14} /> : <Menu size={14} />} Veículos
            </button>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link
            href="/"
            onClick={() => {
              setMenuAberto(null);
              setCatalogOpen(false);
            }}
            className="block"
          >
            <img
              src={LOGO_NAVBAR}
              alt="Logo"
              className="h-6 w-auto object-contain transition-opacity hover:opacity-80 lg:h-8"
            />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <div className="group relative">
                <button className="flex items-center gap-3 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 transition-all hover:border-gray-300 hover:shadow-sm">
                  <div
                    className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${
                      isAdmin ? "bg-black text-[#f2e14c]" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <User size={16} />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="mb-0.5 text-[10px] font-bold uppercase leading-none text-gray-400">
                      Olá,
                    </p>
                    <p className="max-w-[80px] truncate text-xs font-bold leading-none text-gray-900">
                      {displayName}
                    </p>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
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
                    href={CONSULTA_CLIENTE_LINK}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:text-black"
                  >
                    <Search size={16} /> Consulta de Cliente
                  </Link>

                  <div className="my-1 h-px bg-gray-100" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex rounded-full border border-black px-6 py-2.5 text-xs font-black uppercase tracking-wide text-black transition-all hover:bg-black hover:text-[#f2e14c]"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div
        className={`menu-dropdown fixed left-0 top-[0px] z-[1000] w-full border-t border-gray-100 bg-white shadow-2xl ${
          menuAberto === "veiculos" ? "menu-dropdown-ativo" : ""
        }`}
      >
        <VehiclesMenu onClose={() => setMenuAberto(null)} />
      </div>

      {menuAberto && (
        <div
          onClick={() => setMenuAberto(null)}
          className="fixed inset-0 top-16 z-[999] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        />
      )}

      <div
        className={`fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <div
        className={`fixed left-0 top-0 z-[2001] flex h-full w-[85%] max-w-[320px] flex-col bg-white shadow-2xl transition-transform duration-500 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-100 p-6">
          <img src={LOGO_SIDEBAR} alt="Logo" className="h-12 w-auto object-contain" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-full bg-gray-50 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            {user ? (
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
                    href="/supervisor/consultar-cliente"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                  >
                    <Search size={14} /> Consulta de Cliente
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
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

            <button
              onClick={() => {
                setSidebarOpen(false);
                setCatalogOpen(true);
              }}
              className="group flex w-full items-center gap-4 text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors hover:text-[#f2e14c]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-[#f2e14c]">
                <CarFront size={18} />
              </span>
              Catálogo
            </button>

            <Link
              href="/vendedor/seminovos"
              onClick={() => setSidebarOpen(false)}
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors hover:text-[#f2e14c]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-[#f2e14c]">
                <CarFront size={18} />
              </span>
              SemiNovos
            </Link>

            <Link
              href="#"
              className="group flex items-center gap-4 text-sm font-bold uppercase tracking-wide text-gray-900 transition-colors hover:text-[#f2e14c]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-400 transition-colors group-hover:bg-black group-hover:text-[#f2e14c]">
                <Phone size={18} />
              </span>
              Fale Conosco
            </Link>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 text-center">
          <p className="text-[10px] font-medium text-gray-400">© 2026 WBCNAC Digital</p>
        </div>
      </div>

      <MobileCatalogModal open={catalogOpen} onClose={() => setCatalogOpen(false)} />
    </>
  );
}