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
  LayoutDashboard, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import VehiclesMenu from "./VehiclesMenu";

export default function Navbar() {
  // Menu dropdown mega menu
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Login e Estado do Usuário
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // NOVOS ESTADOS PARA PERFIL
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const router = useRouter();

  useEffect(() => {
    const getUserData = async () => {
      // 1. Pega o usuário logado (Auth)
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 2. Se tiver usuário, busca os detalhes na tabela 'profiles'
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setFullName(profile.full_name || "");
          setAvatarUrl(profile.avatar_url || "");
        }
      }

      setLoading(false);
    };

    getUserData();

    // Ouve mudanças de login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
         // Atualiza perfil se logar
         const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', session.user.id)
          .single();
         
         if (profile) {
            setFullName(profile.full_name || "");
            setAvatarUrl(profile.avatar_url || "");
         }
      } else {
         // Limpa se deslogar
         setFullName("");
         setAvatarUrl("");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole'); 
    router.refresh();
    window.location.href = "/login"; // Força recarregamento
  };

  const toggleMenu = (menu: string) => {
    setMenuAberto(menuAberto === menu ? null : menu);
  };

  // --- LÓGICA DE ROTAS INTELIGENTE ---
  const userEmail = user?.email || "";
  const isAdmin = userEmail.toLowerCase().includes("admin");

  const dashboardLink = isAdmin ? "/admin" : "/vendedor/dashboard";
  const dashboardLabel = isAdmin ? "Painel Gerencial" : "Painel do Vendedor";

  // Define o nome de exibição (Nome completo ou parte do email se não tiver nome)
  const displayName = fullName || userEmail.split('@')[0];

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
            <Link href="/#estoque" className="text-xs font-bold text-gray-600 uppercase tracking-wide hover:text-black transition-colors">
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
                
                {/* FOTO OU ÍCONE PADRÃO */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden ${isAdmin ? 'bg-black text-yellow-400' : 'bg-gray-900 text-white'}`}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-gray-900 leading-none">Minha Conta</p>
                  <p className="text-[10px] text-gray-500 font-medium truncate max-w-[100px]">
                    {displayName}
                  </p>
                </div>
                <ChevronDown size={14} className="text-gray-400 group-hover:rotate-180 transition-transform" />
              </button>

              {/* --- DROPDOWN (A CAIXINHA) --- */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 origin-top-right">
                
                {/* Cabeçalho do Dropdown */}
                <div className="p-4 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Logado como</p>
                  {/* Nome em destaque */}
                  <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                  {/* Email menor */}
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  
                  {/* Badge de Cargo */}
                  <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wide ${isAdmin ? 'bg-black text-yellow-400' : 'bg-green-100 text-green-700'}`}>
                    {isAdmin ? 'Administrador' : 'Vendedor'}
                  </span>
                </div>

                {/* Itens do Menu */}
                <div className="p-2 space-y-1">
                  
                  {/* LINK INTELIGENTE DO PAINEL */}
                  <Link 
                    href={dashboardLink} 
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors ${
                        isAdmin 
                        ? 'text-gray-800 hover:bg-black hover:text-yellow-400' // Estilo Admin
                        : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-700' // Estilo Vendedor
                    }`}
                  >
                    {isAdmin ? <ShieldCheck size={18} /> : <LayoutDashboard size={18} />}
                    {dashboardLabel}
                  </Link>

                  <Link 
                    href="/profile" 
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
          <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/Parceirologo.jpg" alt="Chevy" className="h-14 w-auto" />
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
            <Link href="/#estoque" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 text-gray-800 font-bold text-sm uppercase tracking-wide hover:text-[#CD9834] group transition-colors">
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