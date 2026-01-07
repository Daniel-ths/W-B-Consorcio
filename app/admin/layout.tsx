import { ReactNode } from 'react'
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  LogOut, 
  BarChart3
} from 'lucide-react'

// Definindo a tipagem de forma mais segura
interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans">
      {/* --- SIDEBAR (Menu Lateral) --- */}
      <aside className="w-72 bg-white border-r border-gray-200 hidden md:flex flex-col shadow-sm z-10">
        
        {/* Logo / Título */}
        <div className="h-16 flex items-center px-8 border-b border-gray-100">
          <span className="text-xl font-bold text-gray-800 tracking-tight">
            Gestão<span className="text-emerald-600">Automotiva</span>
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {/* Item 1: Dashboard */}
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            text="Visão Geral" 
            href="/admin/dashboard" 
          />

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Gerenciamento
          </div>

          {/* Item 2: Link para Carros */}
          <SidebarItem 
            icon={<Car size={20} />} 
            text="Painel de Edição"
            href="/admin/carros" 
          />

          {/* Item 3: Nova área do Dono */}
          <SidebarItem 
            icon={<Users size={20} />} 
            text="Equipe & Vendas" 
            href="/admin/equipe" 
          />

          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Sistema
          </div>

          <SidebarItem 
            icon={<BarChart3 size={20} />} 
            text="Relatórios Financeiros" 
            href="/admin/relatorios" 
          />
        </nav>

        {/* Rodapé do Menu */}
        <div className="p-4 border-t border-gray-100">
          <form action="/auth/signout" method="post">
             <button className="flex items-center gap-3 text-sm font-medium text-red-600 hover:bg-red-50 w-full p-3 rounded-lg transition-colors">
               <LogOut size={18} />
               Sair do Sistema
             </button>
          </form>
        </div>
      </aside>

      {/* --- ÁREA DE CONTEÚDO --- */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

// Componente auxiliar para os itens do menu
interface SidebarItemProps {
  icon: ReactNode
  text: string
  href: string
  active?: boolean
}

function SidebarItem({ icon, text, href, active = false }: SidebarItemProps) {
  return (
    <a 
      href={href} 
      className={`
        flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
        ${active 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
      `}
    >
      {icon}
      {text}
    </a>
  )
}