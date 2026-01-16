"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, ArrowRight, User, Wallet, Phone, Car, Loader2, X, ChevronDown 
} from "lucide-react";

// --- CONFIGURAÇÃO ---
const BASE_URL_IMG = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/";

// IDs reais da Tabela FIPE para consulta na API
const BRANDS = [
  { name: 'CHEVROLET', id: 23, file: 'chevrolet.webp?v=3' }, 
  { name: 'VOLKSWAGEN', id: 59, file: 'volkswagen.webp?v=3' }, 
  { name: 'RENAULT', id: 44, file: 'renault.webp?v=3' },
  { name: 'FORD', id: 22, file: 'ford.webp?v=3' },
  { name: 'HYUNDAI', id: 26, file: 'hyundai.webp?v=3' },
  { name: 'TOYOTA', id: 56, file: 'toyota.webp?v=3' },
  { name: 'NISSAN', id: 43, file: 'nissan.webp?v=3' },
  { name: 'HONDA', id: 25, file: 'honda.webp?v=3' },
  { name: 'FIAT', id: 21, file: 'fiat.webp?v=3' },
  { name: 'JEEP', id: 29, file: 'jeep.webp?v=3' },
  { name: 'CITROËN', id: 11, file: 'citroen.webp?v=3' },
  { name: 'PEUGEOT', id: 41, file: 'peugeot.webp?v=3' },
];

// Máscaras
const maskPhone = (v: string) => v.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").replace(/(-\d{4})\d+?$/, "$1");
const maskCpf = (v: string) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").replace(/(-\d{2})\d+?$/, "$1");

export default function SeminovosPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados do Formulário
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);

  // --- ESTADOS PARA BUSCA DE MODELO (AUTOCOMPLETE) ---
  const [modelSearch, setModelSearch] = useState("");
  const [showModelList, setShowModelList] = useState(false);

  const [formData, setFormData] = useState({
    modelo: "",
    ano: "",
    valor: "",
    nome: "",
    cpf: "",
    telefone: "",
    renda: "",
    entrada: ""
  });

  const filteredBrands = BRANDS.filter((brand) =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtra os modelos da FIPE conforme o usuário digita
  const filteredModels = modelos.filter((m) => 
    m.nome.toLowerCase().includes(modelSearch.toLowerCase())
  );

  // --- API FIPE ---
  const handleBrandSelect = async (brand: any) => {
    setSelectedBrand(brand);
    setLoadingModelos(true);
    setFormData(prev => ({ ...prev, modelo: "" }));
    setModelSearch(""); // Limpa a busca anterior
    setShowModelList(false);
    // Scroll suave para o topo ao trocar de fase
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // Busca modelos na API da FIPE
      const res = await fetch(`https://parallelum.com.br/fipe/api/v1/carros/marcas/${brand.id}/modelos`);
      const data = await res.json();
      setModelos(data.modelos || []);
    } catch (error) {
      console.error("Erro ao buscar modelos", error);
      alert("Erro ao conectar com a FIPE. Tente novamente.");
    } finally {
      setLoadingModelos(false);
    }
  };

  const handleSelectModel = (nomeModelo: string) => {
    setFormData({ ...formData, modelo: nomeModelo });
    setModelSearch(nomeModelo); // Preenche o input com o nome escolhido
    setShowModelList(false); // Fecha a lista
  };

  const handleSubmit = () => {
    const query = new URLSearchParams({
      ...formData,
      marca: selectedBrand?.name || "",
    }).toString();
    
    router.push(`/vendedor/analise?${query}`);
  };

  return (
    <div className="min-h-screen bg-white font-sans pb-20">
      
      {/* HEADER AMARELO */}
      <div className="bg-[#f2e14c] w-full py-6 px-6 shadow-md pt-20 sticky top-0 z-30 transition-all duration-300 ease-in-out">
         <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
                 <img src={`${BASE_URL_IMG}logo semi novos.webp?v=8`} className="h-8 w-auto object-contain" alt="Logo" />
                 <h1 className="text-sm font-black text-black uppercase tracking-widest hidden md:block">
                    Módulo de Seminovos
                 </h1>
            </div>
            {!selectedBrand && (
                <div className="relative w-full max-w-md group animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                    {/* INPUT DE BUSCA COM ANIMAÇÃO DE FOCO */}
                    <input 
                        type="text" placeholder="Buscar marca..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-4 pr-10 py-2 bg-white/90 border-none text-sm font-bold uppercase rounded-sm shadow-sm transition-all duration-300 ease-in-out focus:ring-2 focus:ring-black/20 focus:bg-white focus:shadow-md focus:scale-[1.01] outline-none"
                    />
                    <Search className="absolute right-2 top-2 text-black transition-transform duration-300 group-focus-within:scale-110" size={18} />
                </div>
            )}
         </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        
        {/* FASE 1: ESCOLHER MARCA */}
        {!selectedBrand ? (
             <div className="animate-in fade-in duration-700">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-gray-800 uppercase inline-block border-b-4 border-[#f2e14c] pb-1 tracking-wide">
                        Selecione a Marca
                    </h2>
                </div>
                
                {/* GRID COM ANIMAÇÃO DE FILTRAGEM */}
                <div key={searchTerm} className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {filteredBrands.map((brand, index) => (
                        <button 
                            key={brand.id} 
                            onClick={() => handleBrandSelect(brand)}
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="h-40 bg-gray-50 border border-gray-200 rounded-xl relative group flex flex-col items-center justify-center p-4 transition-all duration-300 ease-out hover:border-[#f2e14c] hover:bg-yellow-50/30 hover:-translate-y-2 hover:shadow-xl animate-in fade-in slide-in-from-bottom-2 backwards"
                        >
                            <img src={`${BASE_URL_IMG}${brand.file}`} alt={brand.name} className="h-20 w-auto object-contain mb-4 transition-transform duration-500 group-hover:scale-110"/>
                            <span className="font-black text-gray-400 transition-colors duration-300 group-hover:text-black uppercase text-sm">{brand.name}</span>
                        </button>
                    ))}
                </div>
                 {filteredBrands.length === 0 && (
                     <p className="text-center text-gray-400 mt-8 animate-in fade-in">Nenhuma marca encontrada para "{searchTerm}"</p>
                 )}
             </div>
        ) : (
            // FASE 2: FORMULÁRIO DE DADOS
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-8 duration-700 ease-out">
                
                {/* Lado Esquerdo: Dados do Veículo */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-black text-gray-900 uppercase flex items-center gap-2">
                            <Car className="text-[#f2e14c]" /> Dados do Veículo
                        </h2>
                        <button 
                            onClick={() => { setSelectedBrand(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                            className="text-xs font-bold text-blue-600 hover:underline transition-all hover:text-blue-800"
                        >
                            Trocar Marca
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Marca Selecionada</label>
                            
                            {/* --- AQUI ESTÁ A MUDANÇA: LOGO + NOME --- */}
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                                <img 
                                    src={`${BASE_URL_IMG}${selectedBrand.file}`} 
                                    alt={selectedBrand.name} 
                                    className="h-10 w-auto object-contain p-1 bg-gray-50 rounded-md border border-gray-100"
                                />
                                <div className="font-black text-xl text-black uppercase">{selectedBrand.name}</div>
                            </div>
                            {/* --------------------------------------- */}

                        </div>

                        {/* --- CAMPO DE BUSCA DE MODELO --- */}
                        <div className="relative z-20 pt-2">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                                Pesquisar Modelo
                            </label>
                            
                            {loadingModelos ? (
                                <div className="flex items-center gap-2 text-sm text-gray-400 py-3 px-3 bg-gray-50 rounded border border-gray-200 animate-pulse">
                                    <Loader2 className="animate-spin" size={16}/> Carregando tabela FIPE...
                                </div>
                            ) : (
                                <div className="relative group">
                                    <input 
                                        type="text"
                                        placeholder="Digite para buscar (Ex: Onix)"
                                        value={modelSearch}
                                        onChange={(e) => {
                                            setModelSearch(e.target.value);
                                            setShowModelList(true);
                                            setFormData({...formData, modelo: ""});
                                        }}
                                        onFocus={() => setShowModelList(true)}
                                        className="w-full p-3 pl-10 bg-white border border-gray-300 rounded font-bold text-gray-700 uppercase transition-all duration-300 ease-in-out focus:border-[#f2e14c] focus:ring-2 focus:ring-[#f2e14c]/50 focus:shadow-sm outline-none"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#f2e14c]" size={18}/>
                                    
                                    {modelSearch && (
                                        <button 
                                            onClick={() => { setModelSearch(""); setFormData({...formData, modelo: ""}); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors hover:scale-110"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}

                                    {/* Lista de Sugestões */}
                                    {showModelList && filteredModels.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl max-h-60 overflow-y-auto mt-1 custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200 ease-out origin-top">
                                            {filteredModels.map((m) => (
                                                <li 
                                                    key={m.codigo} 
                                                    onClick={() => handleSelectModel(m.nome)}
                                                    className="px-4 py-3 hover:bg-[#f2e14c]/20 cursor-pointer text-sm font-bold text-gray-700 border-b border-gray-50 last:border-0 transition-colors duration-200 uppercase"
                                                >
                                                    {m.nome}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    
                                    {showModelList && modelSearch && filteredModels.length === 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-b-lg shadow-xl p-4 text-center text-sm text-gray-500 mt-1 animate-in fade-in">
                                            Nenhum modelo encontrado.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ano</label>
                                <input type="number" placeholder="2024" className="w-full p-3 bg-gray-50 border border-gray-200 rounded font-bold outline-none transition-all focus:border-black focus:bg-white focus:shadow-sm"
                                    value={formData.ano} onChange={e => setFormData({...formData, ano: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Valor (R$)</label>
                                <input type="number" placeholder="0,00" className="w-full p-3 bg-gray-50 border border-gray-200 rounded font-bold outline-none transition-all focus:border-black focus:bg-white focus:shadow-sm"
                                    value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado Direito: Dados do Cliente */}
                <div className="bg-gray-900 p-6 rounded-xl shadow-lg text-white h-fit sticky top-24">
                    <h2 className="text-lg font-black text-[#f2e14c] uppercase mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
                        <User /> Dados do Cliente
                    </h2>

                    <div className="space-y-4">
                        <input type="text" placeholder="NOME COMPLETO" className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white font-bold placeholder-gray-500 transition-all focus:border-[#f2e14c] focus:bg-gray-800/80 focus:shadow-md outline-none uppercase"
                            value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="CPF" maxLength={14} className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white font-bold placeholder-gray-500 transition-all focus:border-[#f2e14c] focus:bg-gray-800/80 focus:shadow-md outline-none"
                                value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCpf(e.target.value)})}
                            />
                            <input type="text" placeholder="TELEFONE" maxLength={15} className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white font-bold placeholder-gray-500 transition-all focus:border-[#f2e14c] focus:bg-gray-800/80 focus:shadow-md outline-none"
                                value={formData.telefone} onChange={e => setFormData({...formData, telefone: maskPhone(e.target.value)})}
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-700 mt-4">
                            <h3 className="text-sm font-bold text-[#f2e14c] uppercase mb-3 flex items-center gap-2"><Wallet size={16}/> Financeiro</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Renda Mensal</label>
                                    <input type="number" placeholder="R$ 0,00" className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white font-bold outline-none transition-all focus:border-[#f2e14c] focus:bg-gray-800/80 focus:shadow-md"
                                        value={formData.renda} onChange={e => setFormData({...formData, renda: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Entrada</label>
                                    <input type="number" placeholder="R$ 0,00" className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white font-bold outline-none transition-all focus:border-[#f2e14c] focus:bg-gray-800/80 focus:shadow-md"
                                        value={formData.entrada} onChange={e => setFormData({...formData, entrada: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleSubmit}
                            disabled={!formData.modelo || !formData.valor || !formData.nome || !formData.renda}
                            className="w-full mt-6 bg-[#f2e14c] hover:bg-[#d4c435] text-black font-black py-4 rounded uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] active:shadow-sm"
                        >
                            Gerar Análise de Crédito <ArrowRight size={20} className="transition-transform group-hover:translate-x-1"/>
                        </button>
                    </div>
                </div>

            </div>
        )}

      </main>
    </div>
  )
}