"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  Search,
  Menu,
  X,
  Phone,
  ShoppingBag,
  Briefcase,
  ChevronDown,
  LogOut,
  Lock,
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  MapPin
} from "lucide-react";

import VehiclesMenu from "./VehiclesMenu";

export default function Navbar() {
  // --- MENU ---
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- LOGIN & ROLE ---
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  // --- BUSCAR CARGO DO USUÁRIO ---
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (data) setRole(data.role);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };

  // --- AUTH ---
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) await fetchUserProfile(data.user.id);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
             await fetchUserProfile(session.user.id);
        } else {
             setRole(null);
        }
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.refresh();
    router.push("/login");
  };

  return (
    <>
      {/* ================= NAVBAR ================= */}
      <nav className="fixed w-full z-[1001] top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12 shadow-sm font-sans">
        {/* ESQUERDA */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-gray-600 hover:text-black transition-colors"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex gap-6 items-center">
            <button
              onClick={() => toggleMenu("veiculos")}
              className={`text-xs font-bold uppercase flex items-center gap-1 transition-colors ${
                menuAberto === "veiculos"
                  ? "text-black"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              {menuAberto === "veiculos" && <X size={16} />} Veículos
            </button>

            <Link
              href="#estoque"
              className="text-xs font-bold text-gray-600 uppercase hover:text-black transition-colors"
            >
              Comprar
            </Link>
          </div>
        </div>

        {/* LOGO */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <Link href="/" onClick={() => setMenuAberto(null)}>
            <img
              src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg"
              alt="Chevrolet"
              className="h-6"
            />
          </Link>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-6 text-gray-600">
          <button className="hover:text-black transition-colors">
            <Search size={20} />
          </button>

          {/* LOGIN / USUÁRIO (LÓGICA SIMPLIFICADA) */}
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
          ) : user ? (
            <div className="relative group">
              <button className="flex items-center gap-2">
                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform"
                />
              </button>

              {/* DROPDOWN USUÁRIO */}
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                
                {/* Cabeçalho do Dropdown */}
                <div className="border-b border-gray-100 pb-3 mb-3">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Logado como</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                    
                    {/* Badge de Cargo - Agora assumimos que SEMPRE tem cargo relevante */}
                    <div className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                        {role === 'admin' ? <ShieldCheck size={10} /> : <Briefcase size={10} />}
                        {role === 'admin' ? 'Administrador' : 'Vendedor'}
                    </div>
                </div>

                {/* --- BOTÃO PAINEL (Sem opção de 'Meus Pedidos') --- */}
                <Link 
                    // Se for Admin vai pro Admin, qualquer outro cai no Dashboard de Vendas
                    href={role === 'admin' ? "/admin/dashboard" : "/dashboard"} 
                    className="w-full flex items-center gap-3 px-3 py-2.5 mb-2 bg-gray-50 hover:bg-black hover:text-white rounded-lg text-sm font-bold text-gray-700 transition-all group/btn"
                >
                    <LayoutDashboard size={16} className="text-gray-400 group-hover/btn:text-white"/>
                    {role === 'admin' ? 'Painel ADM' : 'Painel do Vendedor'}
                </Link>

                <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2 text-gray-400 mb-4">
                  <Lock size={14} />
                  <span className="tracking-widest text-xs">Senha Oculta ••••••••</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <Link
              href="/login" 
              className="text-xs font-bold uppercase hover:text-black transition-colors"
            >
              Área do Vendedor {/* Texto alterado para deixar claro */}
            </Link>
          )}

          <button className="hidden sm:block hover:text-black transition-colors">
            <MapPin size={20} />
          </button>
        </div>
      </nav>

      {/* ================= MEGA MENU ================= */}
      <div
        className={`fixed top-0 left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] ${
          menuAberto === "veiculos" ? "block" : "hidden"
        }`}
      >
        <VehiclesMenu onClose={() => setMenuAberto(null)} />
      </div>

      {/* OVERLAY MEGA MENU */}
      {menuAberto && (
        <div
          onClick={() => setMenuAberto(null)}
          className="fixed inset-0 top-16 bg-black/40 z-[999]"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-500 ${
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Gaveta */}
      <div
        className={`fixed top-0 left-0 h-full w-[300px] bg-white z-[2001] shadow-2xl transform transition-transform duration-500 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-100 h-16">
          <img
            src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg"
            alt="Chevy"
            className="h-4"
          />
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto h-full pb-24">
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Menu
            </p>

            <Link
              href="#"
              className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group"
            >
              <Briefcase
                size={18}
                className="text-gray-400 group-hover:text-[#CD9834]"
              />
              Vendas Diretas
            </Link>

            <Link
              href="#estoque"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group"
            >
              <ShoppingBag
                size={18}
                className="text-gray-400 group-hover:text-[#CD9834]"
              />
              Comprar
            </Link>

            <Link
              href="#"
              className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group"
            >
              <Phone
                size={18}
                className="text-gray-400 group-hover:text-[#CD9834]"
              />
              Fale Conosco
            </Link>

            <Link
              href="#"
              className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group"
            >
              <MapPin
                size={18}
                className="text-gray-400 group-hover:text-[#CD9834]"
              />
              Localizar Concessionária
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}