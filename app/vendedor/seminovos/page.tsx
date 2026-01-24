"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { 
  Search, ArrowRight, User, Wallet, Phone, Car, Loader2, MapPin, Facebook, Instagram
} from "lucide-react";

// --- DADOS E FUNÇÕES ESTÁTICAS ---
const BASE_URL_IMG = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/";
const LOGO_FILE = "seminovos.png"; 

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

const getImageUrl = (file: string) => {
  if (file.startsWith('http')) return file;
  return `${BASE_URL_IMG}${file}`;
};

// MÁSCARAS
const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{4})\d+?$/, "$1");
const maskCpf = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");

// NOVA FUNÇÃO: Máscara de Moeda (R$)
const formatCurrency = (value: string) => {
  if (!value) return "";
  // Remove tudo que não é dígito
  const onlyNums = value.replace(/\D/g, "");
  if (!onlyNums) return "";
  
  // Trata como centavos (divide por 100)
  const numberValue = Number(onlyNums) / 100;
  
  // Formata para BRL
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numberValue);
};

export default function SeminovosPage() {
  const router = useRouter();
  
  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [showModelList, setShowModelList] = useState(false);

  // Cache
  const modelsCache = useRef<Record<number, any[]>>({});

  const [formData, setFormData] = useState({
    modelo: "", ano: "", valor: "", nome: "", cpf: "", telefone: "", renda: "", entrada: ""
  });

  // Filtros Memoizados
  const filteredBrands = useMemo(() => {
    return BRANDS.filter((brand) =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const filteredModels = useMemo(() => {
    return modelos.filter((m) => 
      m.nome.toLowerCase().includes(modelSearch.toLowerCase())
    );
  }, [modelos, modelSearch]);

  const handleBrandSelect = async (brand: any) => {
    setSelectedBrand(brand);
    setFormData(prev => ({ ...prev, modelo: "" }));
    setModelSearch("");
    setShowModelList(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      console.error("Erro ao buscar modelos", error);
    } finally {
      setLoadingModelos(false);
    }
  };

  const handleSelectModel = (nomeModelo: string) => {
    setFormData(prev => ({ ...prev, modelo: nomeModelo }));
    setModelSearch(nomeModelo);
    setShowModelList(false);
  };

  const handleSubmit = () => {
    // Remove formatação de moeda antes de enviar se necessário, ou envia formatado mesmo
    const query = new URLSearchParams({ ...formData, marca: selectedBrand?.name || "" }).toString();
    router.push(`/vendedor/analise?${query}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      
      <style jsx global>{`
        footer:not(.page-exclusive-footer), 
        .main-footer, 
        #main-footer {
          display: none !important;
        }
      `}</style>
      
      {/* HEADER AMARELO */}
      <div className="bg-[#f2e14c] w-full py-6 px-6 shadow-md pt-20 sticky top-0 z-40 transition-all">
         <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                 <Image 
                    src={getImageUrl(LOGO_FILE)} 
                    alt="Logo Seminovos" 
                    width={0} height={0} sizes="100vw"
                    className="h-10 w-auto object-contain"
                    priority 
                 />
            </div>
            {!selectedBrand && (
                <div className="relative w-full max-w-md group animate-in fade-in slide-in-from-right-4">
                    <input 
                        type="text" placeholder="Qual marca você procura?" 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-white border-none text-sm font-bold uppercase rounded-lg shadow-sm focus:ring-2 focus:ring-black outline-none transition-all"
                    />
                    <Search className="absolute right-3 top-2.5 text-black" size={20} />
                </div>
            )}
         </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12 flex-grow">
        
        {!selectedBrand ? (
             <div className="animate-in fade-in duration-700">
                <div className="text-center mb-10">
                    <h2 className="text-xl font-bold text-gray-800 uppercase inline-block border-b-4 border-[#f2e14c] pb-1 tracking-wide">
                        Selecione a Marca para Iniciar
                    </h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {filteredBrands.map((brand) => (
                        <button 
                            key={brand.id} onClick={() => handleBrandSelect(brand)}
                            className="h-44 bg-white border border-gray-100 rounded-3xl relative group flex flex-col items-center justify-center p-6 transition-all hover:border-[#f2e14c] hover:-translate-y-2 shadow-sm hover:shadow-2xl"
                        >
                            <Image 
                                src={getImageUrl(brand.file)} alt={brand.name} 
                                width={0} height={0} sizes="100vw"
                                className="h-20 w-auto object-contain mb-4 transition-transform duration-500 group-hover:scale-110"
                            />
                            <span className="font-black text-gray-300 transition-colors group-hover:text-black uppercase text-xs tracking-widest">{brand.name}</span>
                        </button>
                    ))}
                </div>
             </div>
        ) : (
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-20 duration-500 pb-10">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                    <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-6">
                        <h2 className="text-xl font-black text-black uppercase flex items-center gap-3">
                            <Car className="text-[#f2e14c]"/> Dados do Veículo
                        </h2>
                        <button onClick={() => setSelectedBrand(null)} className="text-xs font-bold bg-gray-100 px-3 py-1.5 rounded-full hover:bg-black hover:text-white transition-all">Alterar Marca</button>
                    </div>

                    <div className="space-y-6">
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-4 border border-gray-100 animate-in fade-in">
                            <Image 
                                src={getImageUrl(selectedBrand.file)} alt={selectedBrand.name} 
                                width={0} height={0} sizes="100vw"
                                className="h-12 w-auto object-contain"
                            />
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Marca Escolhida</p>
                                <p className="font-black text-xl uppercase leading-none">{selectedBrand.name}</p>
                            </div>
                        </div>

                        <div className="relative z-20">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Selecione o Modelo</label>
                            {loadingModelos ? (
                                <div className="flex items-center gap-3 text-sm font-bold text-gray-400 p-4 bg-gray-50 rounded-xl animate-pulse">
                                    <Loader2 className="animate-spin" size={18}/> Consultando Tabela FIPE...
                                </div>
                            ) : (
                                <div className="relative">
                                    <input 
                                        type="text" placeholder="Qual o modelo?"
                                        value={modelSearch}
                                        onChange={(e) => { setModelSearch(e.target.value); setShowModelList(true); setFormData(prev => ({...prev, modelo: ""})); }}
                                        onFocus={() => setShowModelList(true)}
                                        className="w-full p-4 pl-12 border-2 border-gray-100 rounded-2xl font-bold text-black uppercase focus:border-[#f2e14c] outline-none transition-all shadow-sm"
                                    />
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20}/>
                                    {showModelList && filteredModels.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto mt-2 overflow-hidden border-t-0 animate-in fade-in slide-in-from-top-2">
                                            {filteredModels.map((m) => (
                                                <li key={m.codigo} onClick={() => handleSelectModel(m.nome)} className="px-5 py-4 hover:bg-[#f2e14c] cursor-pointer text-sm font-black text-black border-b border-gray-50 last:border-0 uppercase transition-colors">
                                                    {m.nome}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ano</label>
                                <input type="number" placeholder="Ex: 2022" className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl font-bold focus:bg-white focus:border-[#f2e14c] outline-none transition-all" value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Preço (R$)</label>
                                {/* Aqui aplicamos a máscara de moeda também para o preço do carro */}
                                <input 
                                    type="text" 
                                    placeholder="R$ 0,00" 
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-50 rounded-2xl font-bold focus:bg-white focus:border-[#f2e14c] outline-none transition-all" 
                                    value={formData.valor} 
                                    onChange={e => setFormData({...formData, valor: formatCurrency(e.target.value)})} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-black p-8 rounded-3xl shadow-xl text-white h-fit sticky top-28">
                    <h2 className="text-xl font-black text-[#f2e14c] uppercase mb-8 flex items-center gap-3 border-b border-white/10 pb-6">
                        <User /> Dados Pessoais
                    </h2>
                    <div className="space-y-5">
                        <input type="text" placeholder="NOME COMPLETO" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder-gray-500 focus:border-[#f2e14c] outline-none transition-all uppercase" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="CPF" maxLength={14} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-[#f2e14c] outline-none transition-all" value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCpf(e.target.value)})} />
                            <input type="text" placeholder="WHATSAPP" maxLength={15} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-[#f2e14c] outline-none transition-all" value={formData.telefone} onChange={e => setFormData({...formData, telefone: maskPhone(e.target.value)})} />
                        </div>
                        <div className="pt-6 border-t border-white/10 mt-6">
                            <h3 className="text-sm font-bold text-[#f2e14c] uppercase mb-4 flex items-center gap-2"><Wallet size={18}/> Perfil Financeiro</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Renda Mensal</label>
                                    {/* MÁSCARA DE MOEDA APLICADA AQUI */}
                                    <input 
                                        type="text" 
                                        placeholder="R$ 0,00" 
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-[#f2e14c] outline-none" 
                                        value={formData.renda} 
                                        onChange={e => setFormData({...formData, renda: formatCurrency(e.target.value)})} 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Entrada</label>
                                    {/* MÁSCARA DE MOEDA APLICADA AQUI */}
                                    <input 
                                        type="text" 
                                        placeholder="R$ 0,00" 
                                        className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:border-[#f2e14c] outline-none" 
                                        value={formData.entrada} 
                                        onChange={e => setFormData({...formData, entrada: formatCurrency(e.target.value)})} 
                                    />
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleSubmit}
                            disabled={!formData.modelo || !formData.valor || !formData.nome || !formData.renda}
                            className="w-full mt-8 bg-[#f2e14c] hover:bg-white text-black font-black py-5 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-30 shadow-lg shadow-yellow-400/10 active:scale-95"
                        >
                            Verificar Crédito <ArrowRight size={22}/>
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>

      <footer className="page-exclusive-footer bg-white border-t border-gray-100 py-12">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-2">
                  <div className="relative h-8 w-32 mb-6 opacity-40 grayscale">
                    <Image src={getImageUrl(LOGO_FILE)} alt="Logo" fill className="object-contain" />
                  </div>
                  <p className="text-sm text-gray-400 max-w-sm font-medium">
                      Plataforma de simulação de financiamento automotivo. Consultas integradas à Tabela FIPE e instituições financeiras parceiras.
                  </p>
              </div>
              <div>
                  <h4 className="font-bold uppercase text-xs mb-4 text-gray-900 tracking-wider">Suporte</h4>
                  <ul className="text-sm text-gray-500 space-y-2 font-semibold">
                      <li className="flex items-center gap-2 hover:text-black transition-colors"><Phone size={14}/> (91) 98765-4321</li>
                      <li className="flex items-center gap-2 hover:text-black transition-colors"><MapPin size={14}/> Belém, Pará</li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold uppercase text-xs mb-4 text-gray-900 tracking-wider">Siga-nos</h4>
                  <div className="flex gap-4">
                      <Instagram className="text-gray-400 hover:text-pink-500 cursor-pointer transition-all hover:scale-110" size={20}/>
                      <Facebook className="text-gray-400 hover:text-blue-600 cursor-pointer transition-all hover:scale-110" size={20}/>
                  </div>
              </div>
          </div>
          <div className="text-center mt-12 text-[10px] text-gray-300 uppercase tracking-widest font-bold border-t border-gray-50 pt-8">
              © 2026 Seminovos Digital - Todos os direitos reservados.
          </div>
      </footer>
    </div>
  );
}