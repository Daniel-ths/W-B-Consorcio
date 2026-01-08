"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Search, 
  User, 
  MapPin, 
  Menu, 
  X, 
  Phone, 
  ShoppingBag, 
  Briefcase, 
  ChevronDown,
  LayoutDashboard, // Importei o ícone do painel
  LogOut // Importei o ícone de sair
} from "lucide-react";
import VehiclesMenu from "./VehiclesMenu";

export default function Navbar() {
  // Menu dropdown mega menu
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login e Estado do Usuário
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null); // Estado para o cargo (vendedor/admin)
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Tenta recuperar o cargo salvo no localStorage durante o Login
      if (typeof window !== 'undefined') {
        const savedRole = localStorage.getItem('userRole');
        setRole(savedRole);
      }
      
      setLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole'); // Limpa o cargo ao sair
    router.refresh();
    router.push('/login'); // Manda de volta pro login
  };

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  return (
    <>
      <nav className="fixed w-full z-[1001] top-0 bg-[#f8f8f8] border-b border-gray-200 h-16 flex items-center justify-between px-6 lg:px-12 shadow-sm font-sans">
        {/* ESQUERDA - MENU E LINKS */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-1 text-gray-600 hover:text-black transition-colors rounded-md"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:flex gap-6 items-center">
            <button 
              onClick={() => toggleMenu('veiculos')}
              className={`text-xs font-bold uppercase tracking-wide flex items-center gap-1 transition-colors ${menuAberto === 'veiculos' ? 'text-black' : 'text-gray-600 hover:text-black'}`}
            >
              {menuAberto === 'veiculos' ? <X size={16}/> : null} Veículos
            </button>
            <Link href="#estoque" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
              Comprar
            </Link>
          </div>
        </div>

        {/* CENTRO - LOGO */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" onClick={() => setMenuAberto(null)}>
            <img 
              src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" 
              alt="Chevrolet" 
              className="h-8 w-auto object-contain"
            />
          </Link>
        </div>

        {/* DIREITA - USUÁRIO E AÇÕES */}
        <div className="flex items-center gap-6 text-gray-600">
          <button className="hover:text-black transition-colors"><Search size={20} /></button>

          {loading ? null : user ? (
            // --- USUÁRIO LOGADO ---
            <div className="relative group py-2">
              <button className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200">
                {/* Ícone de Pessoa ou Inicial */}
                <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                  <User size={16} />
                </div>
                
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none">Minha Conta</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate max-w-[80px]">
                    {user.email?.split('@')[0]}
                  </p>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:rotate-180 transition-transform" />
              </button>

              {/* --- DROPDOWN (A CAIXINHA) --- */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 origin-top-right">
                
                {/* Cabeçalho do Dropdown */}
                <div className="p-4 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Logado como</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{user.email}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                    {role ? role : 'Cliente'}
                  </span>
                </div>

                {/* Itens do Menu */}
                <div className="p-2 space-y-1">
                  
                  {/* LINK DO PAINEL DO VENDEDOR (Só aparece se tiver logado) */}
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 rounded-lg hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                  >
                    <LayoutDashboard size={18} />
                    Painel do Vendedor
                  </Link>

                  <Link 
                    href="/perfil" 
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    <User size={18} />
                    Meus Dados
                  </Link>
                </div>

                {/* Botão de Logout */}
                <div className="p-2 border-t border-gray-100 mt-1">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Sair da Conta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // --- USUÁRIO DESLOGADO ---
            <Link href="/login" className="text-sm font-bold text-gray-700 hover:text-black hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
              <User size={18} />
              Entrar
            </Link>
          )}

          <button className="hover:text-black transition-colors hidden sm:block"><MapPin size={20} /></button>
        </div>
      </nav>

      {/* MEGA MENU */}
      <div className={`fixed top-[0px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] menu-dropdown ${menuAberto === 'veiculos' ? 'menu-dropdown-ativo' : ''}`}>
        <VehiclesMenu onClose={() => setMenuAberto(null)} />
      </div>

      {/* OVERLAY */}
      {menuAberto && (
        <div 
          onClick={() => setMenuAberto(null)}
          className="fixed inset-0 top-16 bg-black/40 z-[999] backdrop-blur-[2px] transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR HAMBÚRGUER */}
      <div 
        className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-500 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <div className={`fixed top-0 left-0 h-full w-[300px] bg-white z-[2001] shadow-2xl transform transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 h-16">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Chevrolet_Logo.png/800px-Chevrolet_Logo.png" alt="Chevy" className="h-6 w-auto" />
          <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={20} className="text-gray-600"/>
          </button>
        </div>
        <div className="p-8 space-y-8 overflow-y-auto h-full pb-24">
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
            <Link href="#" className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
              <Briefcase size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Vendas Diretas
            </Link>
            <Link href="#estoque" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
              <ShoppingBag size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Comprar
            </Link>
            <Link href="#" className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
              <Phone size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Fale Conosco
            </Link>
            <Link href="#" className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
              <MapPin size={18} className="text-gray-400 group-hover:text-[#CD9834]"/> Localizar Concessionária
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}