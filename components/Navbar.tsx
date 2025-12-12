import Link from "next/link";
import { Car, Lock, User } from "lucide-react"; 

export default function Navbar() {
  return (
    <nav className="fixed w-full z-50 top-0 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo Minimalista */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-white text-black p-1">
            <Car size={20} />
          </div>
          <span className="text-lg font-bold tracking-widest uppercase group-hover:text-gray-300 transition-colors">
            WB<span className="font-light">Auto</span>
          </span>
        </Link>

        {/* Links Centrais (Estilo BMW) */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-gray-300">
          <Link href="/" className="hover:text-white border-b-2 border-transparent hover:border-white pb-1 transition-all">
            Modelos
          </Link>
          <Link href="#estoque" className="hover:text-white border-b-2 border-transparent hover:border-white pb-1 transition-all">
            Seminovos
          </Link>
          <Link href="/carros/1" className="hover:text-white border-b-2 border-transparent hover:border-white pb-1 transition-all">
            Financiamento
          </Link>
        </div>

        {/* Área Restrita */}
        <Link href="/admin" className="text-gray-300 hover:text-white flex items-center gap-2 text-xs uppercase font-bold tracking-widest">
          <Lock size={14} />
          <span className="hidden sm:inline">Portal do Vendedor</span>
        </Link>
      </div>
      
      {/* Linha fina embaixo */}
      <div className="h-[1px] bg-white/10 w-full"></div>
    </nav>
  );
}