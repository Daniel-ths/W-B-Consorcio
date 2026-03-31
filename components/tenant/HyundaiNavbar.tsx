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
  Search,
} from "lucide-react";
import HyundaiVehiclesMenu from "./HyundaiVehiclesMenu";
import MobileCatalogModalHyundai from "@/components/hyundai/MobileCatalogModalHyundai";

const HY_BLUE = "#00A3C8";

const HY_LOGO =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/avatars/LOGO%20HYUNDAII.png";

const CONSULTA_CLIENTE_LINK = "/supervisor/consultar-cliente";

export default function HyundaiNavbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileCatalogOpen, setMobileCatalogOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    setVehiclesOpen(false);
    setSidebarOpen(false);
    setMobileCatalogOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileCatalogOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileCatalogOpen]);

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

      setVehiclesOpen(false);
      setSidebarOpen(false);
      setMobileCatalogOpen(false);

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

  const dashboardIcon = isAdmin ? (
    <ShieldCheck size={16} />
  ) : (
    <LayoutDashboard size={16} />
  );

  const displayName = fullName || user?.email?.split("@")[0] || "";

  return (
    <>
      <header className="fixed top-0 left-0 z-[1200] w-full border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center gap-3 px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded hover:bg-gray-100 text-gray-700 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>

          <Link
            href="/hyundai"
            onClick={() => setVehiclesOpen(false)}
            className="flex items-center gap-3"
          >
            <img src={HY_LOGO} alt="Hyundai" className="h-14 w-auto" />
          </Link>

          <nav className="ml-2 hidden items-center gap-6 text-sm font-semibold text-gray-900 lg:flex">
            <button
              onClick={() => setVehiclesOpen((v) => !v)}
              className="relative cursor-pointer select-none py-7"
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

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileCatalogOpen(true)}
              className="rounded-xl bg-black px-4 py-2 text-[11px] font-black uppercase tracking-wide text-white transition-colors hover:bg-zinc-800"
              aria-label="Abrir catálogo Hyundai"
            >
              Catálogo
            </button>
          </div>

          <div className="ml-auto hidden lg:block">
            {loading ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />
            ) : user ? (
              <div className="group relative">
                <button className="flex items-center gap-3 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3 transition-all hover:border-gray-300 hover:shadow-sm">
                  <div
                    className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-sm font-bold ${
                      isAdmin
                        ? "bg-black text-[#f2e14c]"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User size={16} />
                    )}
                  </div>

                  <div className="text-left">
                    <p className="mb-0.5 text-[10px] font-bold uppercase leading-none text-gray-400">
                      Olá,
                    </p>
                    <p className="max-w-[110px] truncate text-xs font-bold leading-none text-gray-900">
                      {displayName}
                    </p>
                  </div>

                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                <div className="invisible absolute right-0 top-full mt-3 w-64 translate-y-2 rounded-2xl border border-gray-100 bg-white p-2 opacity-0 shadow-xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="mb-2 rounded-xl bg-gray-50 p-3">
                    <p className="truncate text-xs font-bold text-gray-900">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] text-gray-500">
                      {user.email}
                    </p>
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
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-full border border-black px-6 py-2.5 text-xs font-black uppercase tracking-wide text-black transition-all hover:bg-black hover:text-white"
              >
                <LogIn size={16} />
                Entrar
              </Link>
            )}
          </div>
        </div>

        <div
          className={`absolute left-0 right-0 top-20 hidden border-t border-gray-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-200 lg:block ${
            vehiclesOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0"
          }`}
        >
          <HyundaiVehiclesMenu onClose={() => setVehiclesOpen(false)} />
        </div>
      </header>

      {vehiclesOpen && (
        <div
          className="fixed inset-0 top-20 z-[1100] hidden bg-black/30 lg:block"
          onClick={() => setVehiclesOpen(false)}
        />
      )}

      <MobileCatalogModalHyundai
        open={mobileCatalogOpen}
        onClose={() => setMobileCatalogOpen(false)}
      />

      <div
        className={`fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`fixed top-0 left-0 z-[2001] flex h-full w-[85%] max-w-[340px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-gray-100 p-6">
          <img src={HY_LOGO} alt="Hyundai" className="h-12 w-auto" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-full bg-gray-50 p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          {user ? (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User size={18} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="max-w-[160px] truncate text-xs font-bold text-gray-900">
                    {displayName}
                  </p>
                  <p className="max-w-[160px] truncate text-[10px] text-gray-500">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <Link
                  href={dashboardLink}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                >
                  {dashboardIcon} {dashboardLabel}
                </Link>

                <Link
                  href="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                >
                  <User size={14} /> Meus Dados
                </Link>

                <Link
                  href="supervisor/consultar-cliente"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition-colors hover:border-black"
                >
                  <Search size={14} /> Consulta de Cliente
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setSidebarOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-black py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-gray-800"
            >
              <LogIn size={16} /> Entrar / Cadastrar
            </Link>
          )}
        </div>

        <div className="border-t border-gray-100 p-6 text-center">
          <p className="text-[10px] font-medium text-gray-400">© 2026 WBCNAC Digital</p>
        </div>
      </aside>

      <div className="h-20" />
    </>
  );
}