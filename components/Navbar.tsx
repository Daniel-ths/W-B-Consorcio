"use client";

import { useState, useEffect } from "react";
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
  LogIn
} from "lucide-react";
import VehiclesMenu from "./VehiclesMenu";

// =====================================================================
// 🔧 ÁREA DE CONFIGURAÇÃO DE IMAGENS
// =====================================================================
const LOGO_NAVBAR = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg";
const LOGO_SIDEBAR = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.jpg";
// =====================================================================

export default function Navbar() {
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados de Usuário
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null); 
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  // Fecha sidebar ao navegar
  useEffect(() => {
    setSidebarOpen(false);
    setMenuAberto(null);
  }, [pathname]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, role')
        .eq('id', userId)
        .maybeSingle(); 
      
      if (profile) {
        setFullName(profile.full_name || "");
        setAvatarUrl(profile.avatar_url || "");
        setUserRole(profile.role || "user");
      }
    } catch (error) {
      // Ignorar erros silenciosos
    }
  };

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } catch (error) { console.error(error); } 
      finally { if (mounted) setLoading(false); }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
         if (session.user.id !== user?.id) await fetchProfile(session.user.id);
      } else {
         setFullName(""); setAvatarUrl(""); setUserRole(null);
      }
      setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  const toggleMenu = (menu: string) => setMenuAberto(menuAberto === menu ? null : menu);

  const isAdmin = userRole === 'admin' || user?.email?.toLowerCase().includes("admin");
  const dashboardLink = isAdmin ? "/admin" : "/vendedor/dashboard";
  const dashboardLabel = isAdmin ? "Painel Gerencial" : "Painel do Vendedor";
  const displayName = fullName || user?.email?.split('@')[0];

  return (
    <>
      {/* --- NAVBAR FIXA --- */}
      <nav className="fixed w-full z-[1001] top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 h-16 flex items-center justify-between px-4 lg:px-12 shadow-sm font-sans transition-all">
        
        {/* ESQUERDA: Menu Hambúrguer (Mobile) + Botão Veículos (Desktop) */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
            aria-label="Abrir Menu"
          >
            <Menu size={24} />
          </button>

          {/* Botão Desktop - Abre Mega Menu */}
          <div className="hidden lg:flex items-center">
            <button 
                onClick={() => toggleMenu('veiculos')}
                className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all px-4 py-2 rounded-full ${menuAberto === 'veiculos' ? 'bg-black text-white' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
            >
                {menuAberto === 'veiculos' ? <X size={14}/> : <Menu size={14}/>} Veículos
            </button>
          </div>
        </div>

        {/* CENTRO: Logo */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <Link href="/" onClick={() => setMenuAberto(null)} className="block">
            <img src={LOGO_NAVBAR} alt="Logo" className="h-6 lg:h-8 w-auto object-contain hover:opacity-80 transition-opacity" />
          </Link>
        </div>

        {/* DIREITA: Perfil (Apenas Desktop) - Mobile vai para Sidebar */}
        <div className="flex items-center gap-4">
          {/* Lupa Removida Aqui */}

          {/* Desktop User Menu */}
          <div className="hidden lg:block">
            {loading ? (
               <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"/>
            ) : user ? (
              <div className="relative group">
                <button className="flex items-center gap-3 pl-1 pr-3 py-1 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${isAdmin ? 'bg-black text-[#f2e14c]' : 'bg-gray-100 text-gray-600'}`}>
                    {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={16} />}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-0.5">Olá,</p>
                    <p className="text-xs font-bold text-gray-900 leading-none max-w-[80px] truncate">{displayName}</p>
                  </div>
                  <ChevronDown size={14} className="text-gray-400" />
                </button>

                {/* Dropdown Desktop */}
                <div className="absolute right-0 top-full mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                  <div className="p-3 mb-2 bg-gray-50 rounded-xl">
                     <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                     <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Link href={dashboardLink} className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-black">
                     {isAdmin ? <ShieldCheck size={16}/> : <LayoutDashboard size={16}/>} {dashboardLabel}
                  </Link>
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-50 hover:text-black">
                     <User size={16}/> Meus Dados
                  </Link>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-600 rounded-lg hover:bg-red-50">
                     <LogOut size={16}/> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/login" className="flex text-xs font-black uppercase tracking-wide text-black hover:bg-black hover:text-[#f2e14c] px-6 py-2.5 rounded-full border border-black transition-all">
                Entrar
              </Link>
            )}
          </div>
          
          {/* Mobile User Icon (Opcional, ou deixa tudo no menu hambúrguer) */}
          {/* Se quiser um atalho rápido no mobile, descomente abaixo: */}
          {/* <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-black"><User size={24}/></button> */}
        </div>
      </nav>

      {/* --- MEGA MENU (DESKTOP) --- */}
      <div className={`fixed top-[0px] left-0 w-full bg-white shadow-2xl border-t border-gray-100 z-[1000] menu-dropdown ${menuAberto === 'veiculos' ? 'menu-dropdown-ativo' : ''}`}>
          <VehiclesMenu onClose={() => setMenuAberto(null)} />
      </div>
      {menuAberto && (
        <div onClick={() => setMenuAberto(null)} className="fixed inset-0 top-16 bg-black/40 z-[999] backdrop-blur-[2px] transition-opacity duration-300"/>
      )}

      {/* --- SIDEBAR (MOBILE) --- */}
      {/* Fundo Escuro */}
      <div className={`fixed inset-0 bg-black/60 z-[2000] backdrop-blur-sm transition-opacity duration-500 ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setSidebarOpen(false)}></div>

      {/* Painel Lateral */}
      <div className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-[2001] shadow-2xl transform transition-transform duration-500 ease-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header Sidebar */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 h-20">
          <img src={LOGO_SIDEBAR} alt="Logo" className="h-12 w-auto object-contain" />
          <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Corpo Sidebar */}
        <div className="flex-1 overflow-y-auto py-6 px-6 space-y-8">
          
          {/* SEÇÃO USUÁRIO (Mobile) */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
             {user ? (
                <>
                   <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${isAdmin ? 'bg-black text-[#f2e14c]' : 'bg-white border border-gray-200 text-gray-600'}`}>
                        {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <User size={18} />}
                      </div>
                      <div>
                         <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{displayName}</p>
                         <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{user.email}</p>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <Link href={dashboardLink} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-black transition-colors">
                         {isAdmin ? <ShieldCheck size={14}/> : <LayoutDashboard size={14}/>} {dashboardLabel}
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-600 bg-white border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                         <LogOut size={14}/> Sair da Conta
                      </button>
                   </div>
                </>
             ) : (
                <div className="text-center">
                   <p className="text-xs text-gray-500 mb-3">Acesse sua conta para gerenciar propostas.</p>
                   <Link href="/login" onClick={() => setSidebarOpen(false)} className="flex items-center justify-center gap-2 w-full bg-black text-white text-xs font-bold uppercase py-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <LogIn size={16}/> Entrar / Cadastrar
                   </Link>
                </div>
             )}
          </div>

          {/* SEÇÃO NAVEGAÇÃO */}
          <div className="space-y-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Navegação</p>
            
            <Link href="/vendedor/seminovos" onClick={() => setSidebarOpen(false)} className="flex items-center gap-4 text-gray-900 font-bold text-sm uppercase tracking-wide hover:text-[#f2e14c] group transition-colors">
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-[#f2e14c] transition-colors text-gray-400">
                 <CarFront size={18}/>
              </span>
              Catálogo Completo
            </Link>

            <Link href="#" className="flex items-center gap-4 text-gray-900 font-bold text-sm uppercase tracking-wide hover:text-[#f2e14c] group transition-colors">
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-black group-hover:text-[#f2e14c] transition-colors text-gray-400">
                 <Phone size={18}/>
              </span>
              Fale Conosco
            </Link>
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="p-6 border-t border-gray-100 text-center">
           <p className="text-[10px] text-gray-400 font-medium">© 2026 WBCNAC Digital</p>
        </div>

      </div>
    </>
  );
}