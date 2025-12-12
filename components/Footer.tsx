import Link from "next/link";
import { Car, Instagram, Facebook, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-white/10 text-gray-400 text-sm">
      <div className="max-w-[1400px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Coluna 1: Marca e Sobre */}
        <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 text-white group">
                <div className="bg-white text-black p-1">
                    <Car size={20} />
                </div>
                <span className="text-lg font-bold tracking-widest uppercase">
                    WB<span className="font-light">Auto</span>
                </span>
            </Link>
            <p className="leading-relaxed text-xs uppercase tracking-wide">
                Referência em veículos premium e seminovos selecionados no Pará. 
                Qualidade, procedência e as melhores taxas do mercado.
            </p>
            <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors"><Instagram size={20}/></a>
                <a href="#" className="hover:text-white transition-colors"><Facebook size={20}/></a>
            </div>
        </div>

        {/* Coluna 2: Navegação */}
        <div>
            <h3 className="text-white font-bold uppercase tracking-widest mb-6 text-xs">Navegação</h3>
            <ul className="space-y-4 text-xs uppercase tracking-wide">
                <li><Link href="/" className="hover:text-white transition-colors">Estoque Atualizado</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blindados</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Financiamento</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors flex items-center gap-2 text-red-500 font-bold"><span className="w-1 h-1 bg-red-500 rounded-full"></span> Área Restrita</Link></li>
            </ul>
        </div>

        {/* Coluna 3: Contato */}
        <div>
            <h3 className="text-white font-bold uppercase tracking-widest mb-6 text-xs">Fale Conosco</h3>
            <ul className="space-y-4 text-xs uppercase tracking-wide">
                <li className="flex items-start gap-3">
                    <Phone size={16} className="mt-1 text-white"/>
                    <span>(91) 99999-9999 <br/> <span className="text-gray-600">Seg à Sex - 08h às 18h</span></span>
                </li>
                <li className="flex items-center gap-3">
                    <Mail size={16} className="text-white"/>
                    <span>contato@wbauto.com.br</span>
                </li>
            </ul>
        </div>

        {/* Coluna 4: Endereço */}
        <div>
            <h3 className="text-white font-bold uppercase tracking-widest mb-6 text-xs">Visite-nos</h3>
            <ul className="space-y-4 text-xs uppercase tracking-wide">
                <li className="flex items-start gap-3">
                    <MapPin size={24} className="text-white shrink-0"/>
                    <span>
                        Residencial Arbre, Nº 340<br/>
                        Casa 195<br/>
                        Ananindeua - PA<br/>
                        CEP 67120-370
                    </span>
                </li>
            </ul>
        </div>
      </div>

      {/* Faixa Final */}
      <div className="border-t border-white/5 bg-black py-8">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-wider uppercase text-gray-600">
            <p>© {new Date().getFullYear()} WB Auto. Todos os direitos reservados.</p>
            <p>CNPJ: 01.020.253/0001-07</p>
        </div>
      </div>
    </footer>
  )
}