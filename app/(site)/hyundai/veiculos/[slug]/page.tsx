// app/hyundai/veiculos/[slug]/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

import {
  Loader2,
  ChevronRight,
  Lock,
  Wallet,
  Banknote,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

/* =========================================================
   ✅ CONFIG MANUAL (VOCÊ EDITA AQUI)
   - Imagem de fundo que fica atrás do veículo (texture / foto / pattern)
   - Cor base quando ainda não escolheu a cor (passo 1)
========================================================= */
const HERO_BG_IMAGE_URL =
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/73610802-natureza-fundo-natureza-papel-de-parede-meandros-rio-ventos-atraves-exuberante-verde-floresta-coberto-montanhas-debaixo-nublado-ceu-gratis-foto.jpg"; // <-- TROQUE
const HERO_BASE_TINT = "#03030300"; // cor de fundo antes de escolher cor

/* =========================================================
   TIPOS
========================================================= */
type SpecGroup = {
  id: string;
  title: string; // ex: "ESTILO EXTERIOR"
  description?: string;
  items?: string[];
};

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  note?: string;
  heroLabel?: string;

  // ✅ NOVO: cada versão tem capa
  cover_image_url?: string | null;

  spec_groups?: SpecGroup[] | null; // itens de série por versão (opcional)
  highlights?: string[] | null; // destaques por versão (opcional)

  // ✅ NOVO: cores por versão (caso já esteja salvando assim)
  colors?: ColorVariant[] | null;
};

type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPrice?: number;
  swatch: string; // cor do carro (hex)
  image_url: string; // imagem do carro nessa cor

  // ✅ NOVO: cor de fundo (hex) para o hero QUANDO ESCOLHER A COR
  // Se você não tiver isso no banco, ele cai no swatch automaticamente.
  bg_swatch?: string | null;
};

type VehicleRow = {
  id: number;
  model_name: string;
  slug: string;
  image_url?: string | null;
  brand?: string | null;
  is_visible?: boolean | null;
  price_start?: number | null;

  versions?: VersionItem[] | null;

  // ✅ legado (se ainda existir no banco)
  colors?: ColorVariant[] | null;

  spec_groups?: SpecGroup[] | null; // itens de série global (fallback)
  highlights?: string[] | null; // destaques global (fallback)
};

const HY_BLUE = "#00A3C8";

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

function normalizeArray<T>(val: any): T[] {
  if (Array.isArray(val)) return val as T[];
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {}
  }
  return [];
}

/* =========================
   OrderSummary (mesclado)
========================= */

// --- MÁSCARAS E HELPERS ---
const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// TELEFONE
const PHONE_PREFIX_DISPLAY = "+55 ";
const DEFAULT_DDD = "91";
const onlyDigits = (v: string) => String(v || "").replace(/\D/g, "");

const toE164Digits = (displayPhone: string) => {
  const digits = onlyDigits(displayPhone);

  if (digits.startsWith("55")) {
    const national = digits.slice(2);
    if (national.length === 10 || national.length === 11) return `55${national}`;
    if ((national.length === 8 || national.length === 9) && DEFAULT_DDD) {
      return `55${DEFAULT_DDD}${national}`;
    }
    return null;
  }

  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if ((digits.length === 8 || digits.length === 9) && DEFAULT_DDD) return `55${DEFAULT_DDD}${digits}`;
  return null;
};

function OrderSummary({
  currentCar,
  selectedVersion,
  selectedColor,
  totalPrice,
  user,
  onEdit,
  queryBaseParams,
  accessoriesContent,
  highlightsContent,
}: {
  currentCar: VehicleRow;
  selectedVersion: VersionItem | null;
  selectedColor: ColorVariant | null;
  totalPrice: number;
  user: any;
  onEdit: () => void;
  queryBaseParams: URLSearchParams;

  // ✅ Acessórios: herdado de spec_groups (titulo + descrição)
  accessoriesContent: { title: string; description?: string }[];

  // ✅ Especificações: herdado de highlights (destaques)
  highlightsContent: string[];
}) {
  const router = useRouter();

  const [paymentMethod] = useState("Análise de Crédito");

  const [clientName, setClientName] = useState("");
  const [clientCpf, setClientCpf] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState(PHONE_PREFIX_DISPLAY);

  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    clientName: "",
    clientCpf: "",
    clientEmail: "",
    clientPhone: "",
  });

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientCpf(maskCPF(e.target.value));
    if (errors.clientCpf) setErrors({ ...errors, clientCpf: "" });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value || "";

    if (typed.trim() === "" || typed === PHONE_PREFIX_DISPLAY) {
      setClientPhone(PHONE_PREFIX_DISPLAY);
      return;
    }

    let digits = typed.replace(/\D/g, "");
    if (digits.startsWith("55")) digits = digits.slice(2);
    digits = digits.slice(0, 11); // DDD + 9

    const ddd = digits.slice(0, 2);
    const num = digits.slice(2);

    let formatted = "";
    if (digits.length <= 2) formatted = `(${ddd}`;
    else if (num.length <= 5) formatted = `(${ddd}) ${num}`;
    else formatted = `(${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;

    setClientPhone(PHONE_PREFIX_DISPLAY + formatted);
  };

  const handleFinishOrder = async () => {
    let newErrors = { clientName: "", clientCpf: "", clientEmail: "", clientPhone: "" };
    let hasError = false;

    if (!user) {
      alert("Você precisa estar logado para realizar esta ação.");
      return;
    }

    if (clientName.trim().length < 3) {
      newErrors.clientName = "Nome completo é obrigatório.";
      hasError = true;
    }

    if (clientCpf.length < 14) {
      newErrors.clientCpf = "CPF inválido ou incompleto.";
      hasError = true;
    }

    if (!clientEmail || !validateEmail(clientEmail)) {
      newErrors.clientEmail = "Insira um e-mail válido.";
      hasError = true;
    }

    const telefoneE164Digits = toE164Digits(clientPhone);
    if (!telefoneE164Digits) {
      newErrors.clientPhone = "Telefone inválido. Digite com DDD (ex: +55 (91) 9XXXX-XXXX).";
      hasError = true;
    } else {
      const national = telefoneE164Digits.slice(2);
      if (national.length !== 10 && national.length !== 11) {
        newErrors.clientPhone = "Telefone incompleto. Informe DDD + número (8 ou 9 dígitos).";
        hasError = true;
      }
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);

    const carNameResolved =
      currentCar.model_name || (currentCar as any).name || (currentCar as any).model || `Veículo ID ${currentCar.id}`;

    try {
      const telefoneE164 = toE164Digits(clientPhone)!;

      const saleData = {
        car_id: currentCar.id,
        car_name: carNameResolved,
        seller_id: user.id,
        client_name: clientName,
        client_cpf: clientCpf,
        client_email: clientEmail,
        client_phone: telefoneE164,
        total_price: totalPrice,
        status: "Enviado para Análise",
        interest_type: "Pendente (Aba Análise)",
        details: {
          version: selectedVersion?.title || "Padrão",
          color: selectedColor?.name || "Padrão",
          accessories_content: accessoriesContent,
          highlights: highlightsContent,
        },
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("sales").insert([saleData]);
      if (error) throw error;

      const params = new URLSearchParams(queryBaseParams.toString());

      const modeloCompleto = [carNameResolved, selectedVersion?.title, selectedColor?.name]
        .filter(Boolean)
        .join(" • ");

      params.set("nome", clientName);
      params.set("cpf", clientCpf);
      params.set("telefone", telefoneE164);
      params.set("modelo", modeloCompleto || carNameResolved);
      params.set("valor", String(totalPrice || 0));
      params.set("entrada", "0");
      params.set("renda", "0");
      params.set("imagem", (selectedColor?.image_url || currentCar.image_url || "") as string);

      router.push(`/vendedor/analise?${params.toString()}`);
    } catch (error: any) {
      console.error("Erro ao processar:", error);
      alert("Erro ao processar pedido: " + (error?.message || "erro"));
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white font-sans text-[#1a1a1a]">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm flex-none">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <h1 className="text-3xl font-light tracking-tight">
            Seu {currentCar.model_name}
            {selectedVersion?.title ? ` • ${selectedVersion.title}` : ""}
          </h1>
          <div className="flex items-center gap-6" />
        </div>
      </div>

      <main className="w-full pb-20">
        <div className="bg-[#f2f2f2] w-full py-12 flex justify-center items-center mb-12">
          <div className="max-w-[1200px] w-full aspect-[21/9] relative">
            <img
              src={(selectedColor?.image_url || currentCar.image_url || "/placeholder-car.png") as string}
              alt={currentCar.model_name}
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-6">
          <section className="mb-16 border-b border-gray-200 pb-12">
            <div className="flex justify-between items-baseline mb-8 border-b border-gray-200 pb-4">
              <h2 className="text-3xl font-normal">Resumo</h2>
              <button onClick={onEdit} className="text-sm font-medium flex items-center gap-1 hover:underline">
                Editar <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-0">
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                <div className="text-lg font-normal mb-4 md:mb-0">Veículo</div>
                <div className="md:col-span-3">
                  <div className="flex items-center gap-6">
                    <div className="w-24 h-16 bg-white border border-gray-200 rounded flex items-center justify-center p-1 overflow-hidden">
                      <img
                        src={(selectedColor?.image_url || currentCar.image_url || "") as string}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-lg font-normal">{currentCar.model_name}</p>
                      {selectedVersion?.title ? (
                        <p className="text-sm text-gray-500 mt-1">Versão: {selectedVersion.title}</p>
                      ) : null}
                      {selectedColor?.name ? (
                        <p className="text-sm text-gray-500 mt-1">Cor: {selectedColor.name}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ ESPECIFICAÇÕES: herdado de DESTAQUES (highlights) */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                <div className="text-lg font-normal mb-4 md:mb-0">Especificações</div>
                <div className="md:col-span-3">
                  {highlightsContent.length ? (
                    <div className="space-y-2">
                      {highlightsContent.map((h, idx) => (
                        <div key={idx} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-gray-400">•</span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">(Sem destaques cadastrados.)</div>
                  )}
                </div>
              </div>

              {/* ✅ ACESSÓRIOS: herdado de Itens de série (spec_groups) com TÍTULO + DESCRIÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                <div className="text-lg font-normal mb-4 md:mb-0">Acessórios</div>
                <div className="md:col-span-3">
                  {accessoriesContent.length ? (
                    <div className="space-y-4">
                      {accessoriesContent.map((a, idx) => (
                        <div key={idx} className="border border-gray-200 rounded p-4 bg-white">
                          <div className="text-sm font-semibold text-gray-900">{a.title}</div>
                          <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {a.description ? a.description : "(Sem descrição)"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">(Sem conteúdo de itens de série para herdar.)</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 py-8 border-b border-gray-200">
                <div className="text-lg font-normal mb-4 md:mb-0">Total</div>
                <div className="md:col-span-3">
                  <span className="text-3xl font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </section>

          {/* DADOS DO CLIENTE */}
          <section className="pt-10 border-t border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <h3 className="text-2xl font-normal text-gray-900 mb-4">Finalização</h3>
                <p className="text-sm text-gray-500">
                  O próximo passo enviará este veículo configurado para o módulo de{" "}
                  <strong>Análise de Crédito</strong>.
                </p>
                <div className="mt-4 text-[11px] text-gray-400">
                  Método: <span className="font-semibold text-gray-600">{paymentMethod}</span>
                </div>
              </div>

              <div className="lg:col-span-3">
                {!user ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                      <Lock className="text-gray-500" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Funcionalidade Restrita</h3>
                    <p className="text-gray-500 mb-6 max-w-md">
                      A finalização de propostas é exclusiva para vendedores logados.
                    </p>
                    <Link
                      href="/login"
                      className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors"
                    >
                      Fazer Login de Vendedor
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-10">
                    {/* FORM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-2">
                      <div className="md:col-span-2">
                        <h4 className="text-lg font-medium mb-4 pb-2 border-b border-gray-100">
                          Informações do Cliente
                        </h4>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Nome Completo <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={clientName}
                          onChange={(e) => {
                            setClientName(e.target.value);
                            if (errors.clientName) setErrors({ ...errors, clientName: "" });
                          }}
                          className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm ${
                            errors.clientName
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 focus:border-black bg-white"
                          }`}
                          placeholder="Digite o nome completo"
                        />
                        {errors.clientName ? (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {errors.clientName}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          CPF <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={clientCpf}
                          onChange={handleCpfChange}
                          maxLength={14}
                          className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm ${
                            errors.clientCpf
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 focus:border-black bg-white"
                          }`}
                          placeholder="000.000.000-00"
                        />
                        {errors.clientCpf ? (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {errors.clientCpf}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={clientEmail}
                          onChange={(e) => {
                            setClientEmail(e.target.value);
                            if (errors.clientEmail) setErrors({ ...errors, clientEmail: "" });
                          }}
                          className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm ${
                            errors.clientEmail
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 focus:border-black bg-white"
                          }`}
                          placeholder="exemplo@email.com"
                        />
                        {errors.clientEmail ? (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {errors.clientEmail}
                          </p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                          Telefone <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={clientPhone}
                          onChange={handlePhoneChange}
                          maxLength={PHONE_PREFIX_DISPLAY.length + 16}
                          className={`w-full h-12 px-4 border rounded focus:outline-none transition-all text-sm ${
                            errors.clientPhone
                              ? "border-red-500 bg-red-50"
                              : "border-gray-300 focus:border-black bg-white"
                          }`}
                          placeholder="+55 (91) 9XXXX-XXXX"
                        />
                        {errors.clientPhone ? (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {errors.clientPhone}
                          </p>
                        ) : null}
                        <p className="text-[11px] text-gray-400 mt-1">
                          Dica: digite assim: <span className="font-mono">91 9XXXX XXXX</span> (o campo formata sozinho)
                        </p>
                      </div>
                    </div>

                    {/* INFO */}
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 uppercase mb-4 flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-green-600" /> Próxima Etapa: Crédito
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                        <div className="bg-white p-4 rounded border border-gray-200 flex items-center gap-3">
                          <Banknote className="text-blue-600" size={24} />
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">Financiamento</p>
                            <p className="text-[11px] text-gray-500 mt-1 uppercase">Aprovação em minutos</p>
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded border border-gray-200 flex items-center gap-3">
                          <Wallet className="text-purple-600" size={24} />
                          <div>
                            <p className="text-sm font-bold text-gray-900 leading-none">Consórcio</p>
                            <p className="text-[11px] text-gray-500 mt-1 uppercase">Cartas de crédito</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-4 italic">
                        * As taxas e coeficientes serão aplicados na próxima aba após a validação dos dados acima.
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleFinishOrder}
                        disabled={loading}
                        className="bg-[#1c1c1c] text-white font-bold py-5 px-16 rounded hover:bg-black transition-all flex items-center gap-3 shadow-lg disabled:opacity-70 text-sm uppercase tracking-widest group"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>
                            Avançar para Análise{" "}
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

/* =========================
   Página principal (mesclada)
========================= */

export default function HyundaiVehicleSlugPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const slug = useMemo(() => {
    const raw = (params as any)?.slug;

    if (Array.isArray(raw)) return raw[0] ? String(raw[0]) : "";
    if (raw) return String(raw);

    const q = searchParams?.get("slug");
    if (q) return String(q);

    const parts = String(pathname || "").split("/").filter(Boolean);
    const last = parts[parts.length - 1] || "";
    if (last && last !== "veiculos" && last !== "monte-o-seu" && last !== "hyundai") return last;

    return "";
  }, [params, pathname, searchParams]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRow | null>(null);

  // ✅ 1: versão | 2: cor | 3: acessórios (conteúdo herdado) | 4: OrderSummary
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [openSpecId, setOpenSpecId] = useState<string | null>(null);

  // animações (conserto)
  const [imgKey, setImgKey] = useState(0);
  const [bgKey, setBgKey] = useState(0);
  const [colorChangedOnce, setColorChangedOnce] = useState(false);

  // user (vendedor)
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user || null);
      } catch {
        if (!mounted) return;
        setUser(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!slug) {
      setErr("Veículo não encontrado (slug ausente na URL).");
      setVehicle(null);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    const timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      setErr("Demorou demais para carregar. Tente novamente.");
      setLoading(false);
    }, 12000);

    (async () => {
      setLoading(true);
      setErr(null);
      setVehicle(null);

      try {
        const { data, error } = await supabase
          .from("vehicles")
          .select("id, model_name, slug, image_url, brand, is_visible, price_start, versions, colors, spec_groups, highlights")
          .eq("brand", "hyundai")
          .eq("slug", slug)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;

        if (!data) {
          setErr("Veículo não encontrado.");
          return;
        }
        if ((data as any).is_visible === false) {
          setErr("Este veículo está oculto.");
          return;
        }

        const v = data as VehicleRow;

        const safeVersions = normalizeArray<VersionItem>(v.versions);

        setVehicle(v);

        // default
        const firstV = safeVersions[0];
        setSelectedVersionId(firstV?.id || "");

        // ✅ cores: tenta pegar da versão (novo), senão usa vehicle.colors (legado)
        const firstVColors = normalizeArray<ColorVariant>((firstV as any)?.colors);
        const legacyColors = normalizeArray<ColorVariant>(v.colors);

        const firstColor = firstVColors[0] || legacyColors[0] || null;
        setSelectedColorId(firstColor?.id || "");

        setImgKey((k) => k + 1);
        setBgKey((k) => k + 1);
        setColorChangedOnce(false);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Erro ao carregar veículo.");
      } finally {
        if (!mounted) return;
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [slug]);

  const versions = useMemo<VersionItem[]>(() => normalizeArray<VersionItem>(vehicle?.versions), [vehicle]);

  const selectedVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0] || null;
  }, [versions, selectedVersionId]);

  // ✅ Cores agora são POR VERSÃO; fallback para vehicle.colors se versão não tiver
  const colorVariants = useMemo<ColorVariant[]>(() => {
    const fromVersion = normalizeArray<ColorVariant>((selectedVersion as any)?.colors);
    if (fromVersion.length) return fromVersion;
    return normalizeArray<ColorVariant>(vehicle?.colors);
  }, [selectedVersion, vehicle]);

  const selectedColor = useMemo(() => {
    return colorVariants.find((c) => c.id === selectedColorId) || colorVariants[0] || null;
  }, [colorVariants, selectedColorId]);

  // quando troca versão: reseta cor para primeira cor da versão (ou fallback)
  useEffect(() => {
    const first = colorVariants[0] || null;
    setSelectedColorId(first?.id || "");
    setImgKey((k) => k + 1);
    setBgKey((k) => k + 1);
    setOpenSpecId(null);
  }, [selectedVersionId]); // intencional

  // ✅ Itens de série: por versão, fallback no veículo
  const specGroups = useMemo<SpecGroup[]>(() => {
    const fromVersion = normalizeArray<SpecGroup>((selectedVersion as any)?.spec_groups);
    if (fromVersion.length) return fromVersion;
    return normalizeArray<SpecGroup>(vehicle?.spec_groups);
  }, [selectedVersion, vehicle]);

  // ✅ Destaques (Especificações): por versão, fallback no veículo
  const highlights = useMemo<string[]>(() => {
    const fromVersion = normalizeArray<string>((selectedVersion as any)?.highlights);
    if (fromVersion.length) return fromVersion;
    return normalizeArray<string>(vehicle?.highlights);
  }, [selectedVersion, vehicle]);

  // ✅ ACESSÓRIOS: herdado do Itens de série (title + description)
  const accessoriesContent = useMemo(() => {
    return (specGroups || [])
      .map((g) => ({
        title: String(g?.title || "").trim(),
        description: String(g?.description || "").trim() || undefined,
      }))
      .filter((x) => !!x.title);
  }, [specGroups]);

  // ✅ ESPECIFICAÇÕES (DESTAQUES): já vem pronto
  const highlightsContent = useMemo(
    () => (highlights || []).map((h) => String(h || "").trim()).filter(Boolean),
    [highlights]
  );

  // ✅ IMAGEM PRINCIPAL:
  // - Se estiver no passo 2+ e tiver imagem da cor -> usa
  // - Senão usa capa da versão -> senão usa veículo.image_url
  const currentImageUrl = useMemo(() => {
    if (step >= 2 && selectedColor?.image_url) return selectedColor.image_url;
    const cover = (selectedVersion as any)?.cover_image_url;
    return cover || vehicle?.image_url || null;
  }, [step, selectedColor?.image_url, selectedVersion, vehicle?.image_url]);

  // ✅ FUNDO DO HERO:
  // - Só troca cor do fundo quando escolhe cor (passo 2) ou depois
  // - bg_swatch (se existir) -> swatch -> base
  const heroTint = useMemo(() => {
    if (step >= 2) {
      const c = selectedColor?.bg_swatch || selectedColor?.swatch;
      return c || HERO_BASE_TINT;
    }
    return HERO_BASE_TINT;
  }, [step, selectedColor?.bg_swatch, selectedColor?.swatch]);

  // animação quando troca cor: faz key e liga flag "colorChangedOnce"
  useEffect(() => {
    setImgKey((k) => k + 1);
    if (step >= 2) {
      setBgKey((k) => k + 1);
      setColorChangedOnce(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColorId]);

  const totalPrice = useMemo(() => {
    const base = selectedVersion?.price ?? vehicle?.price_start ?? 0;
    const extra = selectedColor?.extraPrice || 0;
    return base + extra;
  }, [selectedVersion?.price, vehicle?.price_start, selectedColor?.extraPrice]);

  const Title = vehicle?.model_name || "Hyundai";

  const queryBaseParams = useMemo(() => {
    return new URLSearchParams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6 text-sm font-bold text-gray-500 flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen bg-white pt-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-sm font-bold text-red-600">{err}</div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold hover:bg-gray-50"
            >
              Voltar
            </button>
            <Link
              href="/hyundai/veiculos"
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) return null;

  const basePriceDisplay = selectedVersion?.price ?? vehicle.price_start ?? 0;

  // ✅ quando estiver no OrderSummary, renderiza ele inteiro
  if (step === 4) {
    return (
      <OrderSummary
        currentCar={vehicle}
        selectedVersion={selectedVersion}
        selectedColor={selectedColor}
        totalPrice={totalPrice}
        user={user}
        onEdit={() => setStep(1)}
        queryBaseParams={queryBaseParams}
        accessoriesContent={accessoriesContent}
        highlightsContent={highlightsContent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f2ef]">
      <style>{`
        @keyframes hyVeh_fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ✅ imagem: crossfade + leve pop (sempre que imgKey muda) */
        @keyframes hyVeh_imgIn {
          from { opacity: 0; transform: translateY(8px) scale(0.99); filter: blur(0.3px); }
          to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0px); }
        }

        /* ✅ fundo: muda tint suavemente e dá um fade no overlay quando bgKey muda */
        @keyframes hyVeh_bgPulse {
          from { opacity: 0.55; transform: scale(1.01); }
          to   { opacity: 1; transform: scale(1); }
        }

        .hyVeh_animFadeUp { animation: hyVeh_fadeUp 260ms ease-out both; }

        /* ✅ these classes now are stable */
        .hyVeh_animImg { animation: hyVeh_imgIn 320ms cubic-bezier(.2,.8,.2,1) both; }
        .hyVeh_bgPulse { animation: hyVeh_bgPulse 420ms cubic-bezier(.2,.8,.2,1) both; }

        .hyVeh_heroBg {
          position: relative;
          overflow: hidden;
          background: var(--tint);
          transition: background-color 420ms cubic-bezier(.2,.8,.2,1);
        }

        /* ✅ textura/foto atrás do veículo (manual no código) */
        .hyVeh_heroBg::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: var(--bg-url);
          background-size: cover;
          background-position: center;
          opacity: 0.26;
          filter: saturate(1.05) contrast(1.02);
          pointer-events: none;
          transform: translateZ(0);
        }

        /* ✅ overlay de luz/sombra + textura leve */
        .hyVeh_heroBg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(120% 90% at 15% 25%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.07) 55%, rgba(0,0,0,0.10) 100%),
            radial-gradient(90% 70% at 80% 35%, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.03) 55%, rgba(255,255,255,0.00) 100%),
            repeating-linear-gradient(
              45deg,
              rgba(255,255,255,0.08) 0px,
              rgba(255,255,255,0.08) 2px,
              rgba(255,255,255,0.00) 2px,
              rgba(255,255,255,0.00) 7px
            );
          opacity: 0.7;
          mix-blend-mode: overlay;
          pointer-events: none;
          transform: translateZ(0);
        }
      `}</style>

      {/* topo */}
      <div className="bg-white border-b border-black/5">
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-3">
          <div className="text-[12px] text-gray-500">
            <span className="mr-1">🏠</span>
            <span className="hover:underline cursor-pointer" onClick={() => router.push("/hyundai")}>
              Início
            </span>{" "}
            · <span className="font-medium text-gray-700">Monte o seu</span>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-3 gap-8 items-end">
              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 1</div>
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setStep(1)} className="text-[12px] font-semibold text-gray-700 hover:underline">
                    Selecione a versão
                  </button>
                  <button className="text-[12px] text-gray-500 hover:underline" onClick={() => setStep(1)}>
                    Alterar
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div className="h-[3px] w-[25%]" style={{ background: HY_BLUE }} />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 2</div>
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setStep(2)} className="text-[12px] font-semibold text-gray-700 hover:underline">
                    Selecione a cor
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div
                    className="h-[3px] transition-all duration-300"
                    style={{ width: step === 1 ? "0%" : "100%", background: HY_BLUE }}
                  />
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-gray-500">Passo 3</div>
                <div className="mt-1 flex items-center gap-3">
                  <button onClick={() => setStep(3)} className="text-[12px] font-semibold text-gray-700 hover:underline">
                    Acessórios & Especificações
                  </button>
                </div>
                <div className="mt-2 h-[3px] w-full bg-black/10">
                  <div
                    className="h-[3px] transition-all duration-300"
                    style={{ width: step === 3 ? "100%" : "0%", background: HY_BLUE }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* conteúdo */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* esquerda */}
          <div className="col-span-12 lg:col-span-4 hyVeh_animFadeUp">
            {step === 1 ? (
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">
                  {versions.length} versão(ões) cadastrada(s)
                </div>

                {versions.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-white border border-black/10 rounded-md p-4">
                    Nenhuma versão cadastrada no builder.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {versions.map((v) => {
                      const active = v.id === selectedVersionId;
                      const cover = (v as any)?.cover_image_url || "";

                      return (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVersionId(v.id)}
                          className={`w-full text-left border rounded-md bg-white px-4 py-3 transition-all duration-200 ${
                            active ? "border-black/30" : "border-black/10 hover:border-black/20"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 h-3 w-3 rounded-full border border-black/30 flex items-center justify-center">
                              {active ? <div className="h-2 w-2 rounded-full bg-black" /> : null}
                            </div>

                            {/* ✅ mini capa da versão */}
                            <div className="w-14 h-10 bg-gray-50 border border-black/10 rounded overflow-hidden flex items-center justify-center">
                              {cover ? (
                                <img src={cover} alt={v.title} />
                              ) : (
                                <div className="text-[10px] text-gray-400">SEM CAPA</div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-[13px] font-semibold text-gray-900">{v.title}</div>
                                <div className="text-[12px] font-semibold text-gray-900">{money(v.price)}</div>
                              </div>

                              {v.subtitle ? <div className="mt-1 text-[11px] text-gray-600">{v.subtitle}</div> : null}
                              {v.note ? (
                                <div className="mt-2 text-[11px] text-gray-600 leading-snug">{v.note}</div>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : step === 2 ? (
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">{colorVariants.length} cores disponíveis</div>

                {colorVariants.length === 0 ? (
                  <div className="text-sm text-gray-600 bg-white border border-black/10 rounded-md p-4">
                    Nenhuma cor cadastrada no builder.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {colorVariants.map((c) => {
                      const active = c.id === selectedColorId;
                      return (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedColorId(c.id);
                          }}
                          className={`text-left bg-white border transition-all duration-200 ${
                            active ? "border-[#0F3C66] ring-2 ring-[#0F3C66]/10" : "border-black/10 hover:border-black/20"
                          }`}
                          style={{ borderRadius: 0 }}
                          title={c.image_url ? "Trocar cor (troca imagem e fundo)" : "Cor sem imagem"}
                        >
                          <div className="p-3">
                            <div className="text-[11px] font-semibold text-gray-900">{c.name}</div>
                            <div className="text-[10px] text-gray-600">
                              {c.internal ? `Cor interna: ${c.internal}` : "\u00A0"}
                            </div>
                            <div className="mt-2 text-[11px] font-semibold text-gray-900">
                              {c.extraPrice ? `+ ${money(c.extraPrice)}` : "+ R$ 0,00"}
                            </div>
                          </div>

                          <div className="h-[86px] border-t border-black/10" style={{ background: c.swatch || "#ddd" }} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              // ✅ PASSO 3
              <>
                <div className="text-[12px] text-gray-700 font-semibold mb-4">
                  Conteúdo herdado para <span className="font-bold">Acessórios</span> e{" "}
                  <span className="font-bold">Especificações</span>
                </div>

                <div className="bg-white border border-black/10 rounded-md p-4">
                  <div className="text-[12px] font-semibold text-gray-900">Especificações (Destaques)</div>
                  <div className="mt-3">
                    {highlightsContent.length ? (
                      <div className="space-y-2 text-[12px] text-gray-700">
                        {highlightsContent.map((h, idx) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[12px] text-gray-500">(Sem destaques cadastrados.)</div>
                    )}
                  </div>

                  <div className="mt-6 border-t border-black/10 pt-4">
                    <div className="text-[12px] font-semibold text-gray-900">Acessórios</div>
                    <div className="mt-3 space-y-3">
                      {accessoriesContent.length ? (
                        accessoriesContent.map((a, idx) => (
                          <div key={idx} className="border border-black/10 rounded p-3">
                            <div className="text-[12px] font-semibold text-gray-900">{a.title}</div>
                            <div className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                              {a.description ? a.description : "(Sem descrição)"}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[12px] text-gray-500">(Sem itens de série para herdar.)</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* direita */}
          <div className="col-span-12 lg:col-span-8 hyVeh_animFadeUp">
            <div className="text-[14px] text-gray-700">
              <span className="font-semibold">{Title}</span>
              {selectedVersion?.title ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedVersion.title}</span>
                </>
              ) : null}
              {step >= 2 && selectedColor?.name ? (
                <>
                  <span className="mx-2">•</span>
                  <span className="font-semibold">{selectedColor.name}</span>
                  <span className="mx-4 font-bold text-gray-900">{money(totalPrice)}</span>
                </>
              ) : (
                <span className="mx-4 font-bold text-gray-900">{money(basePriceDisplay)}</span>
              )}
            </div>

            <div className="mt-3 bg-white border border-black/10 rounded-md overflow-hidden">
              {/* ✅ HERO: fundo com imagem manual + troca de cor (só quando escolhe cor) */}
              <div
                className={[
                  "h-[280px] hyVeh_heroBg relative",
                  // anima o overlay quando trocar cor (bgKey muda)
                  step >= 2 && colorChangedOnce ? "hyVeh_bgPulse" : "",
                ].join(" ")}
                key={bgKey}
                style={{
                  ["--tint" as any]: heroTint,
                  ["--bg-url" as any]: `url("${HERO_BG_IMAGE_URL}")`,
                }}
              >
                <div className="absolute top-3 left-3 z-[2]">
                  <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold bg-white/85 border border-black/10 rounded">
                    {selectedVersion?.heroLabel || "Exterior"}
                  </span>
                </div>

                <div className="h-full flex items-center justify-center relative z-[2]">
                  {currentImageUrl ? (
                    <img
                      key={imgKey}
                      src={currentImageUrl}
                      alt={vehicle.model_name}
                      className="w-[86%] h-[86%] object-contain hyVeh_animImg drop-shadow-[0_18px_26px_rgba(0,0,0,0.18)]"
                      draggable={false}
                    />
                  ) : (
                    <div className="text-xs font-bold text-gray-500">Sem imagem</div>
                  )}
                </div>
              </div>

              <div className="p-6">
                <h2 className="text-[22px] font-semibold text-gray-900">Especificações do seu Hyundai</h2>

                {highlights.length > 0 ? (
                  <div className="mt-4 space-y-3 text-[12px] text-gray-700">
                    {highlights.map((txt, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span>•</span>
                        <span>{txt}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-[12px] text-gray-500">(Sem destaques cadastrados no builder.)</div>
                )}

                <h3 className="mt-8 text-[18px] font-semibold text-gray-900">Itens de série</h3>

                <div className="mt-3 border border-black/10 rounded-md overflow-hidden bg-white">
                  {specGroups.length === 0 ? (
                    <div className="px-4 py-4 text-sm text-gray-500">
                      Nenhuma seção cadastrada no builder.
                      <div className="mt-1 text-[11px] text-gray-400">
                        Dica: salve em <span className="font-mono">versions[].spec_groups</span> (por versão) ou em{" "}
                        <span className="font-mono">vehicle.spec_groups</span> (global).
                      </div>
                    </div>
                  ) : (
                    specGroups.map((g) => {
                      const opened = openSpecId === g.id;
                      const items = Array.isArray(g.items) ? g.items : [];
                      return (
                        <div key={g.id} className="border-b border-black/10 last:border-b-0">
                          <button
                            type="button"
                            onClick={() => setOpenSpecId((prev) => (prev === g.id ? null : g.id))}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition"
                          >
                            <span className="text-[11px] font-semibold text-gray-800">{g.title}</span>
                            <span
                              className={`text-[16px] font-semibold text-gray-600 transition-transform duration-200 ${
                                opened ? "rotate-45" : "rotate-0"
                              }`}
                            >
                              +
                            </span>
                          </button>

                          <div className={`grid transition-all duration-300 ease-out ${opened ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                            <div className="overflow-hidden">
                              <div className="px-4 pb-4 text-[12px] text-gray-700">
                                {g.description ? (
                                  <div className="text-gray-600 mb-3 leading-relaxed">{g.description}</div>
                                ) : null}

                                {items.length > 0 ? (
                                  <div className="space-y-2">
                                    {items.map((it, idx) => (
                                      <div key={idx} className="flex gap-2">
                                        <span className="text-gray-400">•</span>
                                        <span>{it}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-500">(Sem itens nesta seção.)</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* barra inferior */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-black/10">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) router.push("/hyundai/veiculos");
              else if (step === 2) setStep(1);
              else if (step === 3) setStep(2);
            }}
            className="text-[12px] font-semibold text-gray-700 hover:underline"
          >
            ‹ {step === 1 ? "Alterar modelo" : step === 2 ? "Alterar versão" : "Alterar cor"}
          </button>

          <button
            onClick={() => {
              if (step === 1) setStep(2);
              else if (step === 2) setStep(3);
              else if (step === 3) setStep(4);
            }}
            className="px-4 py-2 text-[12px] font-semibold text-white rounded transition-transform active:scale-[0.99] disabled:opacity-60"
            style={{ background: "#0F3C66" }}
            disabled={(step === 1 && versions.length === 0) || (step === 2 && colorVariants.length === 0)}
            title={
              step === 1 && versions.length === 0
                ? "Cadastre versões no builder"
                : step === 2 && colorVariants.length === 0
                ? "Cadastre cores no builder"
                : ""
            }
          >
            {step === 1 ? "Escolha a cor" : step === 2 ? "Concluir" : step === 3 ? "Continuar" : "Avançar"}
          </button>
        </div>
      </div>
    </div>
  );
}