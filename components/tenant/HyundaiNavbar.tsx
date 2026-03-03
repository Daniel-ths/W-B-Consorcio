"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  User,
  Menu,
  X,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  LogIn,
} from "lucide-react";
import HyundaiVehiclesMenu from "./HyundaiVehiclesMenu";

const HY_BLUE = "#00A3C8";

const HY_LOGO =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/LOGO%20HYUNDAII.png";

export default function HyundaiNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [vehiclesOpen, setVehiclesOpen] = useState(false);

  // Mobile drawer
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth states (igual ao Chevrolet)
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const currentUserIdRef = useRef<string | null>(null);

  // Fecha menus ao navegar
  useEffect(() => {
    setVehiclesOpen(false);
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
      // silencioso
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

        if (u?.id) void fetchProfile(u.id);
        else {
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

      if (newId !== prevId) void fetchProfile(newId);
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

      setVehiclesOpen(false);
      setSidebarOpen(false);

      router.push("/login");
      router.refresh();
    }
  };

  // Role rules (igual Chevy)
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

  const displayName = fullName || user?.email?.split("@")[0] || "";

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[1200] bg-white border-b border-gray-200">
        <div className="h-20 max-w-[1400px] mx-auto px-4 lg:px-8 flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link
            href="/hyundai"
            onClick={() => setVehiclesOpen(false)}
            className="flex items-center gap-3"
          >
            <img src={HY_LOGO} alt="Hyundai" className="h-14 w-auto" />
          </Link>

          {/* Menu (Veículos mais pra esquerda) */}
          <nav className="hidden lg:flex items-center gap-6 ml-2 text-sm font-semibold text-gray-900">
            <button
              onClick={() => setVehiclesOpen((v) => !v)}
              className="relative py-7 cursor-pointer select-none"
              aria-expanded={vehiclesOpen}
            >
              <span className="hover:opacity-80">Veículos</span>
              {vehiclesOpen && (
                <span
                  className="absolute left-0 right-0 -bottom-[1px] h-[3px]"
                  style={{ backgroundColor: HY_BLUE }}
                />
              )}
            </button>
          </nav>

          {/* Right: Auth */}
          <div className="ml-auto hidden lg:block">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${
                      isAdmin
                        ? "bg-black text-[#f2e14c]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>

                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">
                      Olá,
                    </p>
                    <p className="text-xs font-bold text-gray-900 leading-none max-w-[110px] truncate">
                      {displayName}
                    </p>
                  </div>

                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="p-3 mb-2 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {displayName}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {user.email}
                    </p>
                  </div>

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
                className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-black hover:text-white hover:bg-black px-6 py-2.5 rounded-full border border-black transition-all"
              >
                <LogIn size={16} />
                Entrar
              </Link>
            )}
          </div>
        </div>

        {/* MEGA MENU (desktop) */}
        <div
          className={`hidden lg:block absolute left-0 right-0 top-20 bg-white border-t border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-200 ${
            vehiclesOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <HyundaiVehiclesMenu onClose={() => setVehiclesOpen(false)} />
        </div>
      </header>

      {/* overlay quando menu aberto */}
      {vehiclesOpen && (
        <div
          className="hidden lg:block fixed inset-0 top-20 bg-black/30 z-[1100]"
          onClick={() => setVehiclesOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR (simples) */}
      <div
        className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-[2001] h-full w-[85%] max-w-[340px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 h-20">
          <img src={HY_LOGO} alt="Hyundai" className="h-12 w-auto" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
          {user ? (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 truncate max-w-[160px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-gray-500 truncate max-w-[160px]">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <Link
                  href={dashboardLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors"
                >
                  {dashboardIcon} {dashboardLabel}
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-bold uppercase py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <LogIn size={16} /> Entrar / Cadastrar
            </Link>
          )}

          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/hyundai/veiculos");
            }}
            className="w-full text-left text-sm font-bold uppercase tracking-wide text-gray-900 hover:opacity-80"
          >
            Veículos
          </button>
        </div>

        <div className="p-6 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium">
            © 2026 WBCNAC Digital
          </p>
        </div>
      </aside>

      {/* spacer */}
      <div className="h-20" />
    </>
  );
}