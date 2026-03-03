"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  ArrowRight,
  User,
  Wallet,
  Phone,
  Car,
  Loader2,
  MapPin,
  Facebook,
  Instagram,
  Plus,
  Minus,
  CheckCircle2,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

// --- DADOS E FUNÇÕES ESTÁTICAS ---
const BASE_URL_IMG = "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/";
const LOGO_FILE = "seminovos.png";

// FAQ Data
const FAQ_ITEMS = [
  {
    question: "O que é a Chevrolet Seminovos?",
    answer:
      "A Chevrolet Seminovos é o programa oficial da rede de concessionárias para garantir a procedência, qualidade e segurança na compra e venda de veículos usados de todas as marcas.",
  },
  {
    question: "Por que a Chevrolet está lançando esta nova marca?",
    answer:
      "Para oferecer ao mercado um padrão elevado de confiança, com carros inspecionados rigorosamente e atendimento padronizado em todo o território nacional.",
  },
  {
    question: "Qual a garantia disponível?",
    answer:
      "Todos os veículos contam com garantia de procedência e garantia mecânica legal de 90 dias. Consulte condições para garantia estendida de até 1 ano.",
  },
  {
    question: "Os carros são inspecionados pela Chevrolet Seminovos?",
    answer:
      "Sim. Todos os veículos passam por uma inspeção rigorosa de mais de 100 itens (mecânica, elétrica, funilaria e documentação) antes de serem colocados à venda.",
  },
  {
    question: "Posso usar meu carro atual como parte do pagamento?",
    answer:
      "Sim! Aceitamos seu usado na troca com uma das melhores avaliações do mercado. O valor pode ser utilizado como entrada ou para abater o financiamento.",
  },
];

const BRANDS = [
  { name: "CHEVROLET", id: 23, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-logo.svg" },
  { name: "VOLKSWAGEN", id: 59, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/39-396793_cars-logo-brands-png-images-simbolo-volkswagen-sem-fundo.png" },
  { name: "RENAULT", id: 44, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/pngimg.com%20-%20renault_PNG40.png" },
  { name: "FORD", id: 22, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/images.png" },
  { name: "HYUNDAI", id: 26, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Hyundai-Logo.png" },
  { name: "TOYOTA", id: 56, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Toyota-logo.png" },
  { name: "NISSAN", id: 43, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/nissan-6-logo-png-transparent.png" },
  { name: "HONDA", id: 25, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/images%20(1)%20(1).jfif" },
  { name: "FIAT", id: 21, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/fiat-logo-21.png" },
  { name: "JEEP", id: 29, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Jeep-Logo.png" },
  { name: "CITROËN", id: 11, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/Citroen-Logo-PNG-Clipart.png" },
  { name: "PEUGEOT", id: 41, file: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/logo/images%20(2).jfif" },
];

const getImageUrl = (file: string) => {
  if (file.startsWith("http")) return file;
  return `${BASE_URL_IMG}${file}`;
};

// MÁSCARAS (visual)
const maskPhone = (v: string) =>
  v
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");

const maskCpf = (v: string) =>
  v
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");

const formatCurrency = (value: string) => {
  if (!value) return "";
  const onlyNums = value.replace(/\D/g, "");
  if (!onlyNums) return "";
  const numberValue = Number(onlyNums) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numberValue);
};

// Limpa moeda (R$ 1.000,00 -> 1000.00)
const cleanCurrency = (value: string) => {
  if (!value) return "0";
  return value.replace(/\D/g, "").replace(/(\d{2})$/, ".$1");
};

// ✅ CRÍTICO: normaliza WhatsApp para o formato que a página do contrato espera:
// contrato sanitiza e exige começar com "55" e ter 12~13 dígitos.
// Aqui sempre vamos mandar como "+55DDDNÚMERO" (ex: +5591999999999).
const normalizePhoneToQuery = (raw: string) => {
  const digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return "";

  // Já com 55
  if (digits.startsWith("55")) return `+${digits}`;

  // DDD + número (11 dígitos: 91999999999)
  if (digits.length === 11) return `+55${digits}`;

  // DDD + número (10 dígitos: 9133334444) — mantém do mesmo jeito
  if (digits.length === 10) return `+55${digits}`;

  // fallback: tenta mesmo assim (não apaga)
  return `+${digits}`;
};

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
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    modelo: "",
    ano: "",
    valor: "",
    nome: "",
    cpf: "",
    telefone: "",
    renda: "",
    entrada: "",
  });

  // ✅ Fecha dropdown ao clicar fora / ESC (evita "sumir" / resetar em mobile)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setShowModelList(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModelList(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const filteredBrands = useMemo(() => {
    return BRANDS.filter((brand) => brand.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  const filteredModels = useMemo(() => {
    const s = modelSearch.toLowerCase();
    return modelos.filter((m) => m.nome.toLowerCase().includes(s));
  }, [modelos, modelSearch]);

  const handleBrandSelect = async (brand: any) => {
    setSelectedBrand(brand);
    setFormData((prev) => ({ ...prev, modelo: "" }));
    setModelSearch("");
    setShowModelList(false);

    window.scrollTo({ top: 300, behavior: "smooth" });

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
    setFormData((prev) => ({ ...prev, modelo: nomeModelo }));
    setModelSearch(nomeModelo);
    setShowModelList(false);
  };

  const handleSubmit = () => {
    // ✅ CORREÇÃO DO TELEFONE: envia sempre como +55...
    const telefoneQuery = normalizePhoneToQuery(formData.telefone);

    const payload: Record<string, string> = {
      ...formData,
      telefone: telefoneQuery, // ✅ aqui está o fix (não some no contrato)
      marca: selectedBrand?.name || "",
      valor: cleanCurrency(formData.valor),
      renda: cleanCurrency(formData.renda),
      entrada: cleanCurrency(formData.entrada),
      imagem: selectedBrand?.file || "",
    };

    const query = new URLSearchParams(payload).toString();
    router.push(`/vendedor/analise?${query}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // ✅ Regras de envio (mantive sua intenção, mas sem exigir renda pra não travar)
  const canSubmit = useMemo(() => {
    return Boolean(formData.modelo && formData.valor && formData.nome && formData.cpf && formData.telefone);
  }, [formData]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col selection:bg-[#f2e14c] selection:text-black">
      <style jsx global>{`
        footer:not(.page-exclusive-footer),
        .main-footer,
        #main-footer {
          display: none !important;
        }
      `}</style>

      {/* HEADER AMARELO */}
      <div className="bg-[#f2e14c] w-full py-4 px-6 shadow-lg shadow-yellow-400/20 pt-20 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
            <Image
              src={getImageUrl(LOGO_FILE)}
              alt="Logo Seminovos"
              width={0}
              height={0}
              sizes="100vw"
              className="h-12 w-auto object-contain"
              priority
            />
            <div className="h-8 w-px bg-black/10 hidden md:block"></div>
            <span className="text-xs font-bold uppercase tracking-widest text-black/60 hidden md:block">
              Portal de Avaliação
            </span>
          </div>
          {!selectedBrand && (
            <div className="relative w-full max-w-lg group animate-in fade-in slide-in-from-right-4">
              <input
                type="text"
                placeholder="BUSCAR MARCA..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-5 pr-12 py-3 bg-white border-2 border-transparent text-sm font-bold uppercase rounded-full shadow-sm focus:border-black focus:ring-0 outline-none transition-all placeholder:text-gray-400"
              />
              <div className="absolute right-2 top-2 p-1.5 bg-black rounded-full text-white">
                <Search size={16} />
              </div>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-16 flex-grow w-full">
        {/* --- [FIXO] TEXTO INTRODUTÓRIO --- */}
        <div className="text-center max-w-4xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <span className="text-[#dcb512] font-black text-xs uppercase tracking-[0.2em] mb-4 block">
            Segurança e Procedência
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 uppercase tracking-tighter leading-tight">
            Chevrolet{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f2e14c] to-[#dcb512]">
              Seminovos
            </span>
          </h1>
          <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
            Compre e venda seu carro usado de forma segura e transparente de todas as marcas com a confiança da Rede
            Chevrolet. Aqui você encontra qualidade certificada.
          </p>
        </div>

        {/* --- ÁREA DINÂMICA --- */}
        {!selectedBrand ? (
          <div className="animate-in fade-in duration-700">
            <div className="flex items-center justify-center mb-12">
              <div className="h-px w-12 bg-gray-200"></div>
              <span className="mx-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                Selecione a Marca
              </span>
              <div className="h-px w-12 bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredBrands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleBrandSelect(brand)}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 flex flex-col items-center justify-center gap-6 transition-all duration-300 hover:border-[#f2e14c] hover:shadow-xl hover:shadow-yellow-400/10 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative z-10 h-16 w-full flex items-center justify-center">
                    <Image
                      src={getImageUrl(brand.file)}
                      alt={brand.name}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="h-full w-auto object-contain transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <span className="relative z-10 font-bold text-gray-400 transition-colors group-hover:text-black uppercase text-[10px] tracking-widest">
                    {brand.name}
                  </span>
                </button>
              ))}
            </div>

            {/* --- FAQ --- */}
            <div className="mt-32 max-w-7xl mx-auto">
              <div className="bg-[#111] rounded-[2.5rem] p-8 md:p-20 shadow-2xl relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#f2e14c] blur-[200px] opacity-5 rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600 blur-[150px] opacity-5 rounded-full pointer-events-none"></div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div>
                    <span className="text-[#f2e14c] font-bold text-xs uppercase tracking-widest mb-2 block">
                      Tira-Dúvidas
                    </span>
                    <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tighter leading-none">
                      Perguntas
                      <br />
                      Frequentes
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                      Não encontrou o que procurava? Entre em contato com nosso suporte especializado.
                    </p>
                    <button className="text-[#f2e14c] text-xs font-bold uppercase tracking-widest border-b border-[#f2e14c] pb-1 hover:text-white hover:border-white transition-all">
                      Fale Conosco
                    </button>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    {FAQ_ITEMS.map((item, i) => (
                      <div key={i} className="group border-b border-white/10 pb-4">
                        <button
                          onClick={() => toggleFaq(i)}
                          className="w-full flex justify-between items-center text-left py-4 focus:outline-none"
                        >
                          <span
                            className={`text-base md:text-lg font-bold transition-all duration-300 ${
                              openFaqIndex === i
                                ? "text-[#f2e14c] translate-x-2"
                                : "text-gray-300 group-hover:text-white"
                            }`}
                          >
                            {item.question}
                          </span>
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                              openFaqIndex === i
                                ? "bg-[#f2e14c] text-black rotate-180"
                                : "bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-white"
                            }`}
                          >
                            {openFaqIndex === i ? (
                              <Minus size={14} strokeWidth={4} />
                            ) : (
                              <Plus size={14} strokeWidth={4} />
                            )}
                          </div>
                        </button>
                        <div
                          className={`grid transition-all duration-500 ease-in-out ${
                            openFaqIndex === i ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="text-gray-400 leading-relaxed text-sm md:text-base pl-2 border-l-2 border-[#f2e14c]/30">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-8 duration-700 items-start">
            {/* COLUNA ESQUERDA: CARRO */}
            <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100">
              <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Passo 1 de 2</p>
                  <h2 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-3">
                    Dados do Veículo
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedBrand(null)}
                  className="text-[10px] font-bold bg-gray-50 text-gray-500 px-4 py-2 rounded-full hover:bg-black hover:text-white transition-all uppercase tracking-wide"
                >
                  Trocar Marca
                </button>
              </div>

              <div className="space-y-8">
                {/* Card da Marca Selecionada */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white rounded-2xl flex items-center gap-6 border border-gray-100">
                  <div className="w-20 h-20 bg-white rounded-xl shadow-sm flex items-center justify-center p-2">
                    <Image
                      src={getImageUrl(selectedBrand.file)}
                      alt={selectedBrand.name}
                      width={0}
                      height={0}
                      sizes="100vw"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                      Marca Selecionada
                    </p>
                    <p className="font-black text-3xl uppercase leading-none text-gray-900">{selectedBrand.name}</p>
                  </div>
                  <CheckCircle2 className="ml-auto text-green-500 hidden sm:block" size={24} />
                </div>

                {/* Input Modelo */}
                <div className="relative group" ref={dropdownRef}>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wide ml-1">
                    Modelo do Veículo
                  </label>

                  {loadingModelos ? (
                    <div className="flex items-center gap-3 text-sm font-bold text-gray-400 p-5 bg-gray-50 rounded-2xl animate-pulse border border-transparent">
                      <Loader2 className="animate-spin" size={18} /> Buscando na Tabela FIPE...
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: Onix 1.0 Turbo..."
                        value={modelSearch}
                        onChange={(e) => {
                          setModelSearch(e.target.value);
                          setShowModelList(true);
                          setFormData((prev) => ({ ...prev, modelo: "" }));
                        }}
                        onFocus={() => setShowModelList(true)}
                        className="w-full p-5 pl-14 bg-gray-50 border-2 border-transparent rounded-2xl font-bold text-gray-900 uppercase focus:bg-white focus:border-[#f2e14c] outline-none transition-all shadow-sm placeholder:text-gray-300"
                      />
                      <Car
                        className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#f2e14c] transition-colors"
                        size={20}
                      />

                      {showModelList && filteredModels.length > 0 && (
                        <ul className="absolute z-50 w-full bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-80 overflow-y-auto mt-2 custom-scrollbar animate-in fade-in slide-in-from-top-2">
                          {filteredModels.map((m) => (
                            <li
                              key={m.codigo}
                              onClick={() => handleSelectModel(m.nome)}
                              className="px-6 py-4 hover:bg-[#f2e14c] cursor-pointer text-xs font-bold text-gray-600 hover:text-black border-b border-gray-50 last:border-0 uppercase transition-colors"
                            >
                              {m.nome}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wide ml-1">
                      Ano Fab.
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="2022"
                        className="w-full p-5 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-[#f2e14c] outline-none transition-all"
                        value={formData.ano}
                        onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-wide ml-1">
                      Valor (R$)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0,00"
                        className="w-full p-5 pl-12 bg-gray-50 border-2 border-transparent rounded-2xl font-bold focus:bg-white focus:border-[#f2e14c] outline-none transition-all text-gray-900"
                        value={formData.valor}
                        onChange={(e) => setFormData({ ...formData, valor: formatCurrency(e.target.value) })}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ COLUNA DIREITA: AGORA EM TEMA CLARO (pedido do cliente) */}
            <div className="lg:col-span-5 bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-gray-100 h-fit sticky top-28">
              <div className="mb-8 border-b border-gray-100 pb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Passo 2 de 2</p>
                <h2 className="text-2xl font-black text-gray-900 uppercase flex items-center gap-3">
                  <User size={24} className="text-[#f2e14c]" /> Seus Dados
                </h2>
              </div>

              <div className="space-y-5">
                {/* Nome */}
                <div className="relative group">
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-wider pl-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    placeholder="DIGITE SEU NOME"
                    className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 font-bold placeholder-gray-400 focus:border-[#f2e14c] focus:bg-white outline-none transition-all uppercase text-sm"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  />
                  <User
                    className="absolute left-4 top-[34px] text-gray-400 group-focus-within:text-[#f2e14c] transition-colors"
                    size={18}
                  />
                </div>

                {/* CPF e Telefone */}
                <div className="grid grid-cols-1 gap-5">
                  <div className="relative group">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-wider pl-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 font-bold focus:border-[#f2e14c] focus:bg-white outline-none transition-all text-sm font-mono"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: maskCpf(e.target.value) })}
                    />
                    <FileText
                      className="absolute left-4 top-[34px] text-gray-400 group-focus-within:text-[#f2e14c] transition-colors"
                      size={18}
                    />
                  </div>

                  <div className="relative group">
                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block tracking-wider pl-1">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full p-4 pl-12 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 font-bold focus:border-[#f2e14c] focus:bg-white outline-none transition-all text-sm font-mono"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: maskPhone(e.target.value) })}
                    />
                    <Phone
                      className="absolute left-4 top-[34px] text-gray-400 group-focus-within:text-[#f2e14c] transition-colors"
                      size={18}
                    />

                    {/* ✅ feedback visual do formato que vai para o contrato */}
                    <p className="mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-widest pl-1">
                      Enviado para o contrato como{" "}
                      <span className="font-mono text-gray-600">
                        {normalizePhoneToQuery(formData.telefone) || "+55..."}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Financeiro */}
                <div className="pt-6 border-t border-gray-100 mt-6">
                  <h3 className="text-xs font-bold text-gray-700 uppercase mb-4 flex items-center gap-2 tracking-wide">
                    <Wallet size={14} className="text-[#f2e14c]" /> Perfil Financeiro
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-400 font-normal">
                      Opcional
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block pl-1">
                        Renda Mensal
                      </label>
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        className="w-full p-3.5 pl-10 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 font-bold focus:border-[#f2e14c] focus:bg-white outline-none text-sm"
                        value={formData.renda}
                        onChange={(e) => setFormData({ ...formData, renda: formatCurrency(e.target.value) })}
                      />
                      <span className="absolute left-4 top-[34px] text-gray-400 font-bold text-xs">R$</span>
                    </div>

                    <div className="relative group">
                      <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block pl-1">
                        Entrada (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="R$ 0,00"
                        className="w-full p-3.5 pl-10 bg-gray-50 border-2 border-transparent rounded-xl text-gray-900 font-bold focus:border-[#f2e14c] focus:bg-white outline-none text-sm"
                        value={formData.entrada}
                        onChange={(e) => setFormData({ ...formData, entrada: formatCurrency(e.target.value) })}
                      />
                      <span className="absolute left-4 top-[34px] text-gray-400 font-bold text-xs">R$</span>
                    </div>
                  </div>
                </div>

                {/* ✅ Botão claro (sem dark) */}
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="w-full mt-4 bg-white hover:bg-gray-50 text-gray-900 font-black py-5 rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg active:scale-95 text-sm border border-gray-200"
                >
                  Solicitar Análise <ArrowRight size={20} className="text-[#f2e14c]" />
                </button>

                {!canSubmit ? (
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    
                  </p>
                ) : (
                  <p className="text-center text-[10px] text-gray-400 font-medium">
                    Seus dados estão seguros e protegidos.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="page-exclusive-footer bg-white border-t border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="relative h-10 w-40 mb-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <Image src={getImageUrl(LOGO_FILE)} alt="Logo" fill className="object-contain" />
            </div>
            <p className="text-xs leading-relaxed text-gray-400 max-w-sm font-medium">
              Plataforma de simulação de financiamento automotivo. Consultas integradas à Tabela FIPE e instituições
              financeiras parceiras.
            </p>
          </div>
          <div>
            <h4 className="font-black uppercase text-xs mb-6 text-gray-900 tracking-widest">Atendimento</h4>
            <ul className="text-xs text-gray-500 space-y-3 font-semibold">
              <li className="flex items-center gap-3 hover:text-[#CD9834] transition-colors cursor-pointer">
                <Phone size={16} /> (91) 98765-4321
              </li>
              <li className="flex items-center gap-3 hover:text-[#CD9834] transition-colors cursor-pointer">
                <MapPin size={16} /> Belém, Pará
              </li>
            </ul>
          </div>
          <div>


          </div>
        </div>
        <div className="text-center mt-16 text-[10px] text-gray-300 uppercase tracking-widest font-bold border-t border-gray-100 pt-8">
         © 2026 nacional Consórcio LTDA: Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}