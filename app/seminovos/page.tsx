"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { 
  Search, ArrowRight, User, Wallet, Phone, Car, Loader2, MapPin, Facebook, Instagram, Plus, Minus, CheckCircle2, DollarSign, Calendar, FileText, ChevronRight, Filter
} from "lucide-react";

// --- DADOS E FUNÇÕES (Mantidos) ---
const BASE_URL_IMG = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/";
const LOGO_FILE = "seminovos.png"; 

const FAQ_ITEMS = [
  { question: "Como funciona a avaliação?", answer: "A avaliação é feita com base na tabela FIPE e no estado de conservação do veículo." },
  { question: "O pagamento é à vista?", answer: "Sim, ou usado como entrada na troca por outro veículo." },
  { question: "Aceitam carro financiado?", answer: "Sim, quitamos o financiamento e pagamos a diferença." },
];

const BRANDS = [
  { name: 'CHEVROLET', id: 23, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg' }, 
  { name: 'VOLKSWAGEN', id: 59, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/39-396793_cars-logo-brands-png-images-simbolo-volkswagen-sem-fundo.png' }, 
  { name: 'RENAULT', id: 44, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/pngimg.com%20-%20renault_PNG40.png' },
  { name: 'FORD', id: 22, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/images.png' },
  { name: 'HYUNDAI', id: 26, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Hyundai-Logo.png' },
  { name: 'TOYOTA', id: 56, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Toyota-logo.png' },
  { name: 'NISSAN', id: 43, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/nissan-6-logo-png-transparent.png' },
  { name: 'HONDA', id: 25, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/images%20(1)%20(1).jfif' },
  { name: 'FIAT', id: 21, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/fiat-logo-21.png' },
  { name: 'JEEP', id: 29, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Jeep-Logo.png' },
  { name: 'CITROËN', id: 11, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Citroen-Logo-PNG-Clipart.png' },
  { name: 'PEUGEOT', id: 41, file: 'https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/images%20(2).jfif' },
];

const getImageUrl = (file: string) => file.startsWith('http') ? file : `${BASE_URL_IMG}${file}`;
const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{4})\d+?$/, "$1");
const maskCpf = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");
const formatCurrency = (value: string) => {
  const onlyNums = value.replace(/\D/g, "");
  if (!onlyNums) return "";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(onlyNums) / 100);
};
const cleanCurrency = (value: string) => (!value ? "0" : value.replace(/\D/g, "").replace(/(\d{2})$/, ".$1"));

export default function SeminovosPage() {
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [showModelList, setShowModelList] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const modelsCache = useRef<Record<number, any[]>>({});

  const [formData, setFormData] = useState({
    modelo: "", ano: "", valor: "", nome: "", cpf: "", telefone: "", renda: "", entrada: ""
  });

  const filteredBrands = useMemo(() => BRANDS.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase())), [searchTerm]);
  const filteredModels = useMemo(() => modelos.filter((m) => m.nome.toLowerCase().includes(modelSearch.toLowerCase())), [modelos, modelSearch]);

  const handleBrandSelect = async (brand: any) => {
    setSelectedBrand(brand);
    setFormData(prev => ({ ...prev, modelo: "" }));
    setModelSearch("");
    setShowModelList(false);
    
    // Rolagem suave no mobile
    setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    if (modelsCache.current[brand.id]) {
      setModelos(modelsCache.current[brand.id]);
      return;
    }

    setLoadingModelos(true);
    try {
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brand.id}/modelos`);
      const data = await res.json();
      const listaModelos = data.modelos || [];
      modelsCache.current[brand.id] = listaModelos;
      setModelos(listaModelos);
    } catch (error) {
      console.error("Erro FIPE", error);
    } finally {
      setLoadingModelos(false);
    }
  };

  const handleSubmit = () => {
    const payload = {
        ...formData,
        marca: selectedBrand?.name || "",
        valor: cleanCurrency(formData.valor),
        renda: cleanCurrency(formData.renda),
        entrada: cleanCurrency(formData.entrada),
        imagem: selectedBrand?.file || "" 
    };
    const query = new URLSearchParams(payload).toString();
    router.push(`/vendedor/analise?${query}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col selection:bg-[#f2e14c] selection:text-black">
      
      <style jsx global>{`footer:not(.page-exclusive-footer), .main-footer, #main-footer { display: none !important; }`}</style>
      
      {/* HEADER MOBILE OTIMIZADO */}
      <div className="bg-[#f2e14c] w-full px-6 pt-12 pb-6 shadow-lg shadow-yellow-400/20 sticky top-0 z-50 rounded-b-[2rem] md:rounded-none">
         <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                     {selectedBrand && (
                         <button onClick={() => setSelectedBrand(null)} className="bg-black/10 p-2 rounded-full hover:bg-black hover:text-white transition-colors">
                             <ArrowLeft size={20}/>
                         </button>
                     )}
                     <Image 
                        src={getImageUrl(LOGO_FILE)} 
                        alt="Logo" width={0} height={0} sizes="100vw"
                        className="h-10 w-auto object-contain" priority 
                     />
                 </div>
                 {!selectedBrand && <div className="text-[10px] font-bold uppercase tracking-widest text-black/60">Avaliação 100% Online</div>}
            </div>

            {/* BARRA DE BUSCA (Aparece apenas na home) */}
            {!selectedBrand && (
                <div className="relative w-full group mt-2">
                    <input 
                        type="text" placeholder="Buscar marca do carro..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white/90 backdrop-blur-sm border-0 text-base font-bold uppercase rounded-xl shadow-sm focus:bg-white outline-none transition-all placeholder:text-gray-400 text-black"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={20} />
                    </div>
                </div>
            )}
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 flex-grow w-full">
        
        {/* --- TELA 1: LISTA DE MARCAS (GRID MOBILE) --- */}
        {!selectedBrand ? (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Marcas Disponíveis</h2>
                    <span className="text-xs font-bold text-gray-400">{filteredBrands.length} opções</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {filteredBrands.map((brand) => (
                        <button 
                            key={brand.id} onClick={() => handleBrandSelect(brand)}
                            className="group bg-white rounded-2xl p-4 flex flex-col items-center justify-center gap-4 shadow-sm border border-gray-100 transition-all active:scale-95 hover:border-[#f2e14c] hover:shadow-lg min-h-[120px]"
                        >
                            <div className="relative w-full h-12 flex items-center justify-center">
                                <Image 
                                    src={getImageUrl(brand.file)} alt={brand.name} 
                                    width={0} height={0} sizes="100vw"
                                    className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                                />
                            </div>
                            <span className="font-bold text-gray-900 text-[10px] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md group-hover:bg-[#f2e14c] transition-colors">{brand.name}</span>
                        </button>
                    ))}
                </div>

                {/* FAQ ACCORDION MOBILE */}
                <div className="mt-12 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-black text-lg uppercase mb-4 flex items-center gap-2">
                        <span className="bg-[#f2e14c] w-8 h-8 flex items-center justify-center rounded-full text-black">?</span>
                        Dúvidas Comuns
                    </h3>
                    <div className="space-y-2">
                        {FAQ_ITEMS.map((item, i) => (
                            <div key={i} className="border-b border-gray-100 last:border-0">
                                <button onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)} className="w-full py-4 text-left font-bold text-sm text-gray-700 flex justify-between items-center">
                                    {item.question}
                                    {openFaqIndex === i ? <Minus size={16}/> : <Plus size={16}/>}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ${openFaqIndex === i ? 'max-h-40 pb-4' : 'max-h-0'}`}>
                                    <p className="text-xs text-gray-500 leading-relaxed">{item.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
        ) : (
            
            /* --- TELA 2: FORMULÁRIO (MOBILE FIRST) --- */
            <div className="animate-in slide-in-from-right-8 duration-500">
                
                {/* Cabeçalho Marca Selecionada */}
                <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 mb-6">
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center p-2 shrink-0">
                        <Image src={getImageUrl(selectedBrand.file)} alt={selectedBrand.name} width={0} height={0} sizes="100vw" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Avaliando</p>
                        <p className="font-black text-2xl uppercase text-gray-900">{selectedBrand.name}</p>
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-gray-100">
                    
                    {/* SEÇÃO 1: CARRO */}
                    <div className="mb-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Car size={16} className="text-[#f2e14c]"/> 1. Dados do Veículo
                        </h3>
                        
                        <div className="space-y-4">
                            {/* Input com Dropdown Inteligente */}
                            <div className="relative">
                                {loadingModelos && <div className="absolute right-4 top-4"><Loader2 className="animate-spin text-[#f2e14c]" size={20}/></div>}
                                <input 
                                    type="text" placeholder="Qual o modelo? (Ex: Onix)"
                                    value={modelSearch}
                                    onChange={(e) => { setModelSearch(e.target.value); setShowModelList(true); setFormData(prev => ({...prev, modelo: ""})); }}
                                    onFocus={() => setShowModelList(true)}
                                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm transition-all"
                                />
                                {showModelList && filteredModels.length > 0 && (
                                    <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto mt-2 custom-scrollbar">
                                        {filteredModels.map((m) => (
                                            <li key={m.codigo} onClick={() => { setFormData(prev => ({ ...prev, modelo: m.nome })); setModelSearch(m.nome); setShowModelList(false); }} className="px-4 py-3 border-b border-gray-50 last:border-0 text-xs font-bold uppercase hover:bg-gray-50 cursor-pointer">
                                                {m.nome}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input type="number" placeholder="Ano (Ex: 2022)" className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} />
                                <input type="text" placeholder="Valor (FIPE)" className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm" value={formData.valor} onChange={e => setFormData({...formData, valor: formatCurrency(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 mb-8"></div>

                    {/* SEÇÃO 2: PESSOAL */}
                    <div className="mb-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <User size={16} className="text-[#f2e14c]"/> 2. Seus Dados
                        </h3>
                        
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm uppercase" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                            
                            <div className="grid grid-cols-1 gap-4">
                                <input type="text" placeholder="CPF" maxLength={14} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm font-mono" value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCpf(e.target.value)})} />
                                <input type="text" placeholder="WhatsApp" maxLength={15} className="w-full p-4 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm font-mono" value={formData.telefone} onChange={e => setFormData({...formData, telefone: maskPhone(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 mb-8"></div>

                    {/* SEÇÃO 3: FINANCEIRO (OPCIONAL) */}
                    <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase mb-4 flex items-center gap-2">
                            <Wallet size={16} className="text-[#f2e14c]"/> 3. Financeiro <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-normal">Opcional</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Renda</label>
                                <input type="text" placeholder="R$ 0,00" className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm" value={formData.renda} onChange={e => setFormData({...formData, renda: formatCurrency(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Entrada</label>
                                <input type="text" placeholder="R$ 0,00" className="w-full p-3 bg-gray-50 rounded-xl border-2 border-transparent focus:bg-white focus:border-[#f2e14c] outline-none font-bold text-gray-900 text-sm" value={formData.entrada} onChange={e => setFormData({...formData, entrada: formatCurrency(e.target.value)})} />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSubmit}
                        disabled={!formData.modelo || !formData.valor || !formData.nome || !formData.renda}
                        className="w-full mt-8 bg-black hover:bg-zinc-800 text-[#f2e14c] font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 text-sm"
                    >
                        Solicitar Análise <ArrowRight size={20}/>
                    </button>
                </div>
            </div>
        )}

      </main>

      <footer className="page-exclusive-footer bg-white border-t border-gray-200 py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-6">
              <Image src={getImageUrl(LOGO_FILE)} alt="Logo" width={100} height={30} className="opacity-50 grayscale" />
              <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
                  A WBCNAC garante a segurança dos seus dados. Simulação sujeita a análise de crédito.
              </p>
              <div className="flex gap-4">
                  <Instagram size={20} className="text-gray-300"/>
                  <Facebook size={20} className="text-gray-300"/>
              </div>
              <div className="text-[10px] text-gray-300 uppercase tracking-widest font-bold pt-4 border-t border-gray-100 w-full">
                  © 2026 WBCNAC Digital
              </div>
          </div>
      </footer>
    </div>
  );
}