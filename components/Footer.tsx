import Link from "next/link";
import { Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    // MUDANÇA: Fundo Cinza Claro (#f2f2f2) e Texto Escuro
    <footer className="bg-[#f2f2f2] border-t border-gray-200 text-gray-600 text-sm font-sans">
      <div className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Coluna 1: Marca */}
        <div className="space-y-6">
            <Link href="/" className="flex items-center gap-4 group">
                {/* LOGO AUMENTADA (h-4 -> h-32) */}
                <img 
                    src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.jpg" 
                    alt="WB Auto" 
                    className="h-32 w-auto object-contain mix-blend-multiply" 
                />
                <span className="text-lg font-bold tracking-widest uppercase text-gray-900">
                    WB<span className="text-gray-500 font-normal">Auto</span>
                </span>
            </Link>
            <p className="leading-relaxed text-xs">
                Concessionária referência em veículos Chevrolet no Pará. 
                Qualidade, garantia e as melhores condições do mercado.
            </p>
            <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Instagram size={20}/></a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors"><Facebook size={20}/></a>
            </div>
        </div>

        {/* Coluna 2: Navegação */}
        <div>
            <h3 className="text-gray-900 font-bold uppercase tracking-widest mb-6 text-xs">Navegação</h3>
            <ul className="space-y-3 text-xs uppercase font-medium tracking-wide">
                <li><Link href="/" className="hover:text-black transition-colors">Veículos</Link></li>
                <li><Link href="/monte-o-seu" className="hover:text-black transition-colors">Monte o Seu</Link></li>
                <li><Link href="#estoque" className="hover:text-black transition-colors">Ofertas</Link></li>
                <li><Link href="/admin" className="hover:text-black transition-colors flex items-center gap-2">Portal Vendedor</Link></li>
            </ul>
        </div>

        {/* Coluna 3: Contato */}
        <div>
            <h3 className="text-gray-900 font-bold uppercase tracking-widest mb-6 text-xs">Atendimento</h3>
            <ul className="space-y-4 text-xs font-medium tracking-wide">
                <li className="flex items-start gap-3">
                    <Phone size={16} className="mt-0.5 text-yellow-500"/>
                    <span>(91) xxxx-xxxx <br/> <span className="text-gray-400 font-normal">Seg à Sex - 08h às 18h</span></span>
                </li>
                <li className="flex items-center gap-3">
                    <Mail size={16} className="text-yellow-500"/>
                    <span>WBCConsórcio@gmail.com.br</span>
                </li>
            </ul>
        </div>

        {/* Coluna 4: Endereço */}
        <div>
            <h3 className="text-gray-900 font-bold uppercase tracking-widest mb-6 text-xs">Endereço</h3>
            <ul className="space-y-4 text-xs font-medium tracking-wide">
                <li className="flex items-start gap-3">
                    <MapPin size={24} className="text-yellow-500 shrink-0"/>
                    <span>
                        Residencial Arbre, Nº 340<br/>
                        Casa 195 - Ananindeua/PA<br/>
                        CEP 67120-370
                    </span>
                </li>
            </ul>
        </div>
      </div>

      {/* Faixa Final */}
      <div className="border-t border-gray-200 bg-[#e5e5e5] py-6">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-wider uppercase text-gray-500 font-bold">
            <p>© {new Date().getFullYear()} W B C Consórcio LTDA: Todos os direitos reservados.</p>
            <div className="flex gap-6">
                <a href="#" className="hover:text-black">Política de Privacidade</a>
                <a href="#" className="hover:text-black">Termos de Uso</a>
                <span>CNPJ: 59.041.030/0001-99</span>
            </div>
        </div>
      </div>
    </footer>
  )
}