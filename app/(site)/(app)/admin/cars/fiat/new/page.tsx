"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
  Trash2,
  UploadCloud,
  Wrench,
  Pencil,
  ExternalLink,
} from "lucide-react";

type FiatVersion = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

type FiatOptionItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category?: string;
  versionId?: string;
  hex?: string;
};

type FiatVehicleRow = {
  id: number;
  brand: string | null;
  model_name: string;
  slug: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  catalog_cover_url?: string | null;
  is_visible?: boolean | null;
  price_start?: number | null;
  versions?: FiatVersion[] | null;
  colors?: FiatOptionItem[] | null;
  kits?: FiatOptionItem[] | null;
  accessories?: FiatOptionItem[] | null;
};

const BUCKET_NAME = "cars";

const uid = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const money = (value: number) =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const slugify = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const imageNameToColorName = (fileName: string) => {
  const clean = String(fileName || "")
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return "Nova cor";

  return clean
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const guessColorHex = (name: string) => {
  const n = String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (n.includes("branco")) return "#f8fafc";
  if (n.includes("preto")) return "#111827";
  if (n.includes("vermelho")) return "#dc2626";
  if (n.includes("azul")) return "#2563eb";
  if (n.includes("cinza") || n.includes("prata") || n.includes("silver")) return "#9ca3af";
  if (n.includes("verde")) return "#16a34a";
  if (n.includes("amarelo")) return "#facc15";
  if (n.includes("marrom")) return "#92400e";
  if (n.includes("bege")) return "#d6b98c";
  return "#111827";
};

function fileExt(name: string) {
  const parts = String(name || "").split(".");
  return (parts[parts.length - 1] || "png").toLowerCase();
}

async function uploadImageToSupabase(file: File, folder: string) {
  const ext = fileExt(file.name);
  const safeFolder = String(folder || "uploads").replace(/[^a-z0-9/_-]/gi, "");

  const path = `${safeFolder}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/*",
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  const url = data?.publicUrl || "";

  if (!url) throw new Error("Não foi possível gerar URL pública da imagem.");

  return url;
}

function createDefaultVersion(): FiatVersion {
  return {
    id: uid("version"),
    name: "Fastback Turbo 200 Flex AT 2026",
    description:
      "Versão de entrada com motor Turbo 200, câmbio automático e ótimo equilíbrio entre desempenho e custo.",
    price: 119990,
    image: "",
  };
}

function createDefaultColor(versionId?: string): FiatOptionItem {
  return {
    id: uid("color"),
    name: "Preto Vulcano",
    description: "Cor sólida clássica, elegante e esportiva.",
    category: "Sólidas",
    price: 0,
    image: "",
    versionId,
    hex: "#111827",
  };
}

function createDefaultKit(): FiatOptionItem {
  return {
    id: uid("kit"),
    name: "Bancos em couro",
    description: "Acabamento interno mais sofisticado e confortável.",
    price: 1340,
    image: "",
  };
}

function createDefaultAccessory(): FiatOptionItem {
  return {
    id: uid("accessory"),
    name: "Tapetes de borracha",
    description: "Proteção extra para o interior do veículo.",
    price: 390,
    image: "",
  };
}


type OfficialAccessoryTemplate = {
  name: string;
  description: string;
  price: number;
  category: string;
  partNumber?: string;
};

const OFFICIAL_FIAT_ACCESSORIES: OfficialAccessoryTemplate[] = [
  {
    name: "Adesivo de capô preto",
    price: 180.18,
    category: "Personalização",
    partNumber: "100258263",
    description:
      "Adesivo preto para o capô, trazendo mais personalidade, visual diferenciado e esportividade ao veículo.",
  },
  {
    name: "Adesivo de capô",
    price: 310.13,
    category: "Personalização",
    description:
      "Acessório de personalização para reforçar esportividade, presença e estilo no visual do veículo.",
  },
  {
    name: "Adesivo plotado de teto preto",
    price: 913.01,
    category: "Personalização",
    partNumber: "50928103",
    description:
      "Envelopamento de teto com material durável e resistente, preservando a pintura e deixando o visual mais esportivo.",
  },
  {
    name: "Alarme volumétrico",
    price: 566.6,
    category: "Segurança",
    partNumber: "50290094",
    description:
      "Alarme com sensores ultrassônicos que detectam tentativa de abertura e movimentação interna no veículo.",
  },
  {
    name: "Alto-falante 6x9 dianteiro, par",
    price: 655.27,
    category: "Som e Tecnologia",
    partNumber: "50928230",
    description:
      "Conjunto de alto-falantes para mais entretenimento e qualidade sonora, mantendo originalidade Mopar.",
  },
  {
    name: "Alto-falante 6x9 traseiro, par",
    price: 678.44,
    category: "Som e Tecnologia",
    partNumber: "50928457",
    description:
      "Alto-falantes traseiros para áudio com potência, clareza de som e melhor resposta entre graves e agudos.",
  },
  {
    name: "Barra transversal de teto, par",
    price: 1428.07,
    category: "Transporte",
    partNumber: "50290146",
    description:
      "Barras em alumínio e plástico industrial, com suporte de carga de até 50kg para transporte com segurança.",
  },
  {
    name: "Porta-objetos flexível",
    price: 324.51,
    category: "Organização",
    partNumber: "7092704",
    description:
      "Porta-objetos flexível para manter itens organizados e evitar que se espalhem pelo interior ou caçamba.",
  },
  {
    name: "Carregador por indução wireless",
    price: 803.23,
    category: "Som e Tecnologia",
    partNumber: "7096568",
    description:
      "Base de carregamento sem fio para dispositivos compatíveis, dispensando o uso de cabos.",
  },
  {
    name: "Chicote elétrico para reboque nacional",
    price: 774.13,
    category: "Transporte",
    partNumber: "7095870",
    description:
      "Conjunto elétrico complementar para engate de reboque, incluindo módulo de interface.",
  },
  {
    name: "Friso lateral pintado branco Banchisa",
    price: 591.46,
    category: "Proteção e Estilo",
    partNumber: "7095163",
    description:
      "Friso lateral pintado que personaliza o veículo e protege as portas contra pequenas batidas e arranhões.",
  },
  {
    name: "Friso lateral pintado cinza Silverstone",
    price: 591.46,
    category: "Proteção e Estilo",
    partNumber: "7095162",
    description:
      "Friso lateral pintado que personaliza o veículo e protege as portas contra pequenas batidas e arranhões.",
  },
  {
    name: "Friso lateral pintado cinza Strato",
    price: 591.46,
    category: "Proteção e Estilo",
    partNumber: "7095164",
    description:
      "Friso lateral pintado que personaliza o veículo e protege as portas contra pequenas batidas e arranhões.",
  },
  {
    name: "Friso lateral pintado Monte Carlo",
    price: 591.46,
    category: "Proteção e Estilo",
    partNumber: "7095166",
    description:
      "Friso lateral pintado que personaliza o veículo e protege as portas contra pequenas batidas e arranhões.",
  },
  {
    name: "Friso lateral pintado prata Bari",
    price: 591.46,
    category: "Proteção e Estilo",
    partNumber: "7095161",
    description:
      "Friso lateral pintado que personaliza o veículo e protege as portas contra pequenas batidas e arranhões.",
  },
  {
    name: "Friso lateral pintado preto Vulcano",
    price: 591.46,
    category: "Proteção e Estilo",
    partNumber: "7095165",
    description:
      "Friso lateral pintado que personaliza o veículo e protege as portas contra pequenas batidas e arranhões.",
  },
  {
    name: "Para-barro dianteiro e traseiro, jogo",
    price: 287.49,
    category: "Proteção e Estilo",
    partNumber: "50290576",
    description:
      "Para-barros em plástico de alta resistência para proteger a carroceria contra pedras e detritos.",
  },
  {
    name: "Parafuso antifurto para rodas",
    price: 461.72,
    category: "Segurança",
    partNumber: "50902050",
    description:
      "Sistema de trava com chave codificada exclusiva para proteger as rodas contra furtos.",
  },
  {
    name: "Projetor de logo",
    price: 507.59,
    category: "Personalização",
    partNumber: "7096267",
    description:
      "Luz de cortesia com logo Fiat colorido, acionada ao abrir a porta, iluminando o chão com estilo.",
  },
  {
    name: "Protetor de cárter",
    price: 758.81,
    category: "Proteção e Estilo",
    partNumber: "50290245",
    description:
      "Protege o cárter contra pedras, lama, água, lombadas e impactos em buracos.",
  },
  {
    name: "Protetor de soleira portas vinil preto Mopar",
    price: 255.5,
    category: "Proteção e Estilo",
    partNumber: "50928105",
    description:
      "Protetor de soleira que personaliza e protege a pintura na entrada e saída do veículo.",
  },
  {
    name: "Rede elástico para banco",
    price: 101.72,
    category: "Organização",
    partNumber: "50927606",
    description:
      "Rede de nylon para reter e organizar objetos no banco, evitando deslocamentos durante o uso.",
  },
  {
    name: "Rede para retenção de cargas no porta-malas",
    price: 160.45,
    category: "Organização",
    partNumber: "100228111",
    description:
      "Rede de nylon para organizar objetos no porta-malas e evitar que se desloquem.",
  },
  {
    name: "Sensor de estacionamento",
    price: 420.65,
    category: "Segurança",
    partNumber: "7095016",
    description:
      "Sensor com alertas sonoros durante a marcha à ré para mais segurança e conforto nas manobras.",
  },
  {
    name: "Subwoofer",
    price: 2281.19,
    category: "Som e Tecnologia",
    partNumber: "7095221",
    description:
      "Subwoofer Mopar para ampliar potência e graves do som original sem ocupar espaço relevante no porta-malas.",
  },
  {
    name: "Suporte de bicicleta para teto nacional",
    price: 1605.25,
    category: "Transporte",
    partNumber: "50928310",
    description:
      "Suporte de bicicleta para teto Mopar, ideal para passeios, trilhas e transporte seguro da bicicleta.",
  },
  {
    name: "Tapete bordas elevadas",
    price: 651.59,
    category: "Tapetes",
    partNumber: "7095102",
    description:
      "Tapete resistente com bordas elevadas, protegendo contra líquidos, terra e sujeira com fácil limpeza.",
  },
  {
    name: "Tapete de borracha, jogo",
    price: 406.25,
    category: "Tapetes",
    partNumber: "50290239",
    description:
      "Tapetes de borracha com fixação nos ganchos originais, material durável, antiderrapante e fácil de limpar.",
  },
  {
    name: "Tapete de carpete com borracha, jogo",
    price: 536.83,
    category: "Tapetes",
    partNumber: "50290240",
    description:
      "Tapetes com detalhe em carpete e borracha, resistentes e desenvolvidos para o assoalho do veículo.",
  },
  {
    name: "Tapete de carpete com PVC, jogo",
    price: 432.61,
    category: "Tapetes",
    partNumber: "50290241",
    description:
      "Tapete com design específico para o veículo, oferecendo conforto e proteção ao assoalho.",
  },
  {
    name: "Tapete de PVC, jogo",
    price: 346.13,
    category: "Tapetes",
    partNumber: "50290242",
    description:
      "Tapete de PVC com design específico, pensado para conforto, proteção e praticidade na limpeza.",
  },
  {
    name: "Tapete porta-malas bordas elevadas",
    price: 354.18,
    category: "Tapetes",
    partNumber: "7093527",
    description:
      "Tapete de porta-malas resistente, com relevo e bordas elevadas para proteger contra sujeira e líquidos.",
  },
  {
    name: "Trava antifurto para estepe",
    price: 538.92,
    category: "Segurança",
    partNumber: "50928093",
    description:
      "Trava com chave codificada exclusiva para aumentar a proteção do estepe contra furtos.",
  },
  {
    name: "Cadeirinha Infantil Ispin",
    price: 14145,
    category: "Família",
    partNumber: "7099616",
    description:
      "Cadeirinha infantil com ação giratória 360º, indicada de 0 a 4 anos, até 1,05m e 19kg, com ISOFIX.",
  },
  {
    name: "Cadeirinha Infantil Spin360",
    price: 14145,
    category: "Família",
    partNumber: "7099617",
    description:
      "Cadeira para auto com rotação 360º, instalação contra ou a favor do movimento e sistema ISOFIX.",
  },
];

const OFFICIAL_ACCESSORY_BY_MODEL: Record<string, string[]> = {
  fastback: [
    "Carregador por indução wireless",
    "Sensor de estacionamento",
    "Projetor de logo",
    "Tapete bordas elevadas",
    "Tapete porta-malas bordas elevadas",
    "Protetor de cárter",
    "Friso lateral pintado preto Vulcano",
    "Parafuso antifurto para rodas",
    "Subwoofer",
    "Cadeirinha Infantil Spin360",
  ],
  pulse: [
    "Carregador por indução wireless",
    "Sensor de estacionamento",
    "Tapete bordas elevadas",
    "Tapete porta-malas bordas elevadas",
    "Protetor de cárter",
    "Projetor de logo",
    "Parafuso antifurto para rodas",
    "Rede para retenção de cargas no porta-malas",
    "Cadeirinha Infantil Ispin",
  ],
  argo: [
    "Adesivo plotado de teto preto",
    "Alarme volumétrico",
    "Carregador por indução wireless",
    "Sensor de estacionamento",
    "Tapete de borracha, jogo",
    "Tapete de PVC, jogo",
    "Protetor de soleira portas vinil preto Mopar",
    "Alto-falante 6x9 traseiro, par",
  ],
  strada: [
    "Capota marítima",
    "Chicote elétrico para reboque nacional",
    "Protetor de cárter",
    "Para-barro dianteiro e traseiro, jogo",
    "Trava antifurto para estepe",
    "Tapete de borracha, jogo",
    "Porta-objetos flexível",
    "Barra transversal de teto, par",
  ],
  toro: [
    "Chicote elétrico para reboque nacional",
    "Protetor de cárter",
    "Para-barro dianteiro e traseiro, jogo",
    "Trava antifurto para estepe",
    "Barra transversal de teto, par",
    "Suporte de bicicleta para teto nacional",
    "Tapete de borracha, jogo",
    "Porta-objetos flexível",
  ],
  titano: [
    "Chicote elétrico para reboque nacional",
    "Protetor de cárter",
    "Para-barro dianteiro e traseiro, jogo",
    "Trava antifurto para estepe",
    "Barra transversal de teto, par",
    "Tapete de borracha, jogo",
    "Porta-objetos flexível",
  ],
  scudo: [
    "Chicote elétrico para reboque nacional",
    "Protetor de cárter",
    "Tapete de borracha, jogo",
    "Alarme volumétrico",
    "Sensor de estacionamento",
    "Para-barro dianteiro e traseiro, jogo",
  ],
  fiorino: [
    "Chicote elétrico para reboque nacional",
    "Protetor de cárter",
    "Tapete de borracha, jogo",
    "Alarme volumétrico",
    "Sensor de estacionamento",
  ],
};

function findOfficialAccessory(name: string) {
  return OFFICIAL_FIAT_ACCESSORIES.find((item) => item.name === name);
}

function getOfficialAccessoriesForVehicle(slug: string, modelName: string) {
  const search = `${slug || ""} ${modelName || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const key = Object.keys(OFFICIAL_ACCESSORY_BY_MODEL).find((item) =>
    search.includes(item)
  );

  if (!key) return OFFICIAL_FIAT_ACCESSORIES.slice(0, 12);

  const selected = OFFICIAL_ACCESSORY_BY_MODEL[key]
    .map(findOfficialAccessory)
    .filter(Boolean) as OfficialAccessoryTemplate[];

  return selected.length ? selected : OFFICIAL_FIAT_ACCESSORIES.slice(0, 12);
}

function officialAccessoryToOption(item: OfficialAccessoryTemplate): FiatOptionItem {
  return {
    id: uid("accessory"),
    name: item.name,
    description: item.partNumber
      ? `${item.description}\n\nPN ${item.partNumber}`
      : item.description,
    category: item.category,
    price: item.price,
    image: "",
  };
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none",
        "focus:border-slate-400 focus:ring-2 focus:ring-black/5",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none",
        "focus:border-slate-400 focus:ring-2 focus:ring-black/5",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Button({
  children,
  icon,
  variant = "black",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  variant?: "black" | "gray" | "danger" | "fiat";
}) {
  const cls =
    variant === "gray"
      ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "fiat"
      ? "bg-[#ff1435] text-white hover:bg-[#e80f30]"
      : "bg-black text-white hover:bg-slate-800";

  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wide transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        cls,
        props.className || "",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function Card({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase text-slate-900">
          {icon}
          {title}
        </h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function UploadField({
  label,
  value,
  onChange,
  onUpload,
  uploading,
  cover,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (file: File | null) => void;
  uploading: boolean;
  cover?: boolean;
}) {
  return (
    <div className="md:col-span-2">
      <Label>{label}</Label>

      <div className="mt-1 grid grid-cols-1 gap-3 md:grid-cols-[1fr_160px]">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Cole a URL ou faça upload"
        />

        <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-100 text-xs font-black uppercase text-slate-900 transition hover:bg-slate-200">
          <UploadCloud size={14} />
          {uploading ? "Enviando..." : "Upload"}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0] || null;
              e.currentTarget.value = "";
              onUpload(file);
            }}
          />
        </label>
      </div>

      {value ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
          <div className="mb-2 text-[10px] font-black uppercase text-slate-400">
            Preview
          </div>
          <img
            src={value}
            alt={label}
            className={`w-full rounded-xl bg-white ${
              cover ? "h-48 object-cover" : "h-48 object-contain"
            }`}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function AdminFiatVehicleCreatePage() {
  const [activeTab, setActiveTab] = useState<
    "basic" | "versions" | "colors" | "kits" | "accessories"
  >("basic");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modelName, setModelName] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [catalogCover, setCatalogCover] = useState("");
  const [priceStart, setPriceStart] = useState(119990);
  const [isVisible, setIsVisible] = useState(true);

  const [versions, setVersions] = useState<FiatVersion[]>([
    createDefaultVersion(),
  ]);
  const [selectedColorVersionId, setSelectedColorVersionId] = useState("");
  const [colors, setColors] = useState<FiatOptionItem[]>([createDefaultColor()]);
  const [kits, setKits] = useState<FiatOptionItem[]>([createDefaultKit()]);
  const [accessories, setAccessories] = useState<FiatOptionItem[]>([
    createDefaultAccessory(),
  ]);

  const [existingVehicles, setExistingVehicles] = useState<FiatVehicleRow[]>([]);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingQuery, setExistingQuery] = useState("");

  const computedSlug = useMemo(
    () => slugify(slug || modelName),
    [slug, modelName]
  );

  const uploadBaseFolder = useMemo(
    () => `fiat/${computedSlug || "sem-slug"}`,
    [computedSlug]
  );

  const filteredExisting = useMemo(() => {
    const q = existingQuery.trim().toLowerCase();

    if (!q) return existingVehicles;

    return existingVehicles.filter(
      (v) =>
        String(v.model_name || "").toLowerCase().includes(q) ||
        String(v.slug || "").toLowerCase().includes(q)
    );
  }, [existingVehicles, existingQuery]);

  const previewVersion =
    versions.find((version) => version.id === selectedColorVersionId) || versions[0];

  const previewColor =
    colors.find((color) => color.versionId === previewVersion?.id) || colors[0];

  const previewImage =
    previewColor?.image || previewVersion?.image || mainImage || catalogCover || "";

  const colorsByVersion = useMemo(() => {
    return versions.map((version) => ({
      version,
      colors: colors.filter((color) => color.versionId === version.id),
    }));
  }, [versions, colors]);

  async function fetchExisting() {
    setExistingLoading(true);

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "id, brand, model_name, slug, is_visible, price_start, image_url, catalog_cover_url"
        )
        .eq("brand", "fiat")
        .order("id", { ascending: false });

      if (error) throw error;

      setExistingVehicles((data as FiatVehicleRow[]) || []);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar veículos Fiat.");
    } finally {
      setExistingLoading(false);
    }
  }

  useEffect(() => {
    fetchExisting();
  }, []);

  useEffect(() => {
    if (!versions.length) {
      setSelectedColorVersionId("");
      return;
    }

    const exists = versions.some((version) => version.id === selectedColorVersionId);

    if (!selectedColorVersionId || !exists) {
      setSelectedColorVersionId(versions[0].id);
    }
  }, [versions, selectedColorVersionId]);

  function resetForm() {
    const v = createDefaultVersion();

    setEditingId(null);
    setModelName("");
    setSlug("");
    setTitle("");
    setDescription("");
    setMainImage("");
    setCatalogCover("");
    setPriceStart(119990);
    setIsVisible(true);
    setVersions([v]);
    setSelectedColorVersionId(v.id);
    setColors([createDefaultColor(v.id)]);
    setKits([createDefaultKit()]);
    setAccessories([createDefaultAccessory()]);
    setActiveTab("basic");
    setErr(null);
  }

  async function handleUpload(
    file: File | null,
    target: string,
    setter: (v: string) => void
  ) {
    if (!file) return;

    setUploading(true);
    setErr(null);

    try {
      const url = await uploadImageToSupabase(
        file,
        `${uploadBaseFolder}/${target}`
      );

      setter(url);
    } catch (e: any) {
      setErr(e?.message || "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function loadVehicleToEdit(id: number) {
    setExistingLoading(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const row = data as FiatVehicleRow;

      const loadedVersions =
        Array.isArray(row.versions) && row.versions.length
          ? row.versions
          : [createDefaultVersion()];

      const loadedColors =
        Array.isArray(row.colors) && row.colors.length
          ? row.colors
          : [createDefaultColor()];

      setEditingId(row.id);
      setModelName(row.model_name || "");
      setSlug(row.slug || "");
      setTitle(row.title || "");
      setDescription(row.description || "");
      setMainImage(row.image_url || "");
      setCatalogCover(row.catalog_cover_url || "");
      setPriceStart(Number(row.price_start || 0));
      setIsVisible(Boolean(row.is_visible ?? true));
      setVersions(loadedVersions);
      setSelectedColorVersionId(loadedVersions[0]?.id || "");
      setColors(
        loadedColors.map((color, index) => ({
          ...color,
          versionId: color.versionId || loadedVersions[index]?.id || loadedVersions[0]?.id || "",
        }))
      );
      setKits(
        Array.isArray(row.kits) && row.kits.length ? row.kits : [createDefaultKit()]
      );
      setAccessories(
        Array.isArray(row.accessories) && row.accessories.length
          ? row.accessories
          : [createDefaultAccessory()]
      );
      setActiveTab("basic");

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar veículo Fiat.");
    } finally {
      setExistingLoading(false);
    }
  }

  async function deleteVehicle(id: number) {
    const ok = window.confirm("Tem certeza que deseja deletar este veículo Fiat?");
    if (!ok) return;

    setExistingLoading(true);

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);

      if (error) throw error;

      if (editingId === id) resetForm();

      await fetchExisting();
    } catch (e: any) {
      setErr(e?.message || "Erro ao deletar veículo Fiat.");
    } finally {
      setExistingLoading(false);
    }
  }

  function addVersion() {
    const newVersion = createDefaultVersion();
    setVersions((prev) => [...prev, newVersion]);
    setSelectedColorVersionId(newVersion.id);
  }

  function removeVersion(versionId: string) {
    setVersions((prev) => prev.filter((item) => item.id !== versionId));
    setColors((prev) => prev.filter((item) => item.versionId !== versionId));
  }

  async function handleBulkColorUpload(files: File[], versionId: string) {
    if (!files.length) return;

    const targetVersion = versions.find((version) => version.id === versionId);

    if (!targetVersion) {
      setErr("Selecione primeiro a versão/modelo que receberá essas cores.");
      return;
    }

    setUploading(true);
    setErr(null);

    try {
      const uploadedColors: FiatOptionItem[] = [];

      for (const file of files) {
        const colorName = imageNameToColorName(file.name);
        const url = await uploadImageToSupabase(
          file,
          `${uploadBaseFolder}/colors/${targetVersion.id}/bulk`
        );

        uploadedColors.push({
          id: uid("color"),
          name: colorName,
          description: `Cor ${colorName} disponível para este veículo.`,
          category: "Cores",
          price: 0,
          image: url,
          versionId: targetVersion.id,
          hex: guessColorHex(colorName),
        });
      }

      setColors((prev) => [...prev, ...uploadedColors]);
    } catch (e: any) {
      setErr(e?.message || "Erro ao enviar imagens em massa.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setErr(null);

    const finalSlug = computedSlug;

    if (!modelName.trim()) return setErr("Informe o nome do modelo.");
    if (!finalSlug) return setErr("Slug inválido.");
    if (!title.trim()) return setErr("Informe o título do builder.");
    if (!description.trim()) return setErr("Informe a descrição do veículo.");
    if (!mainImage.trim()) return setErr("Informe ou envie a imagem principal.");
    if (versions.length === 0) return setErr("Cadastre ao menos uma versão.");
    if (colors.length === 0) return setErr("Cadastre ao menos uma cor.");

    for (const v of versions) {
      if (!v.name.trim()) return setErr("Existe uma versão sem nome.");

      if (!v.description.trim()) {
        return setErr(`A versão "${v.name}" está sem descrição.`);
      }

      if (!v.image.trim()) {
        return setErr(`A versão "${v.name}" está sem imagem.`);
      }
    }

    for (const c of colors) {
      if (!c.versionId) return setErr(`A cor "${c.name || "sem nome"}" precisa estar ligada a uma versão/modelo.`);
      if (!versions.some((v) => v.id === c.versionId)) {
        return setErr(`A cor "${c.name || "sem nome"}" está ligada a uma versão/modelo inexistente.`);
      }
      if (!c.name.trim()) return setErr("Existe uma cor sem nome.");
      if (!c.image.trim()) return setErr(`A cor "${c.name}" está sem imagem.`);
    }

    setSaving(true);

    try {
      const dupQuery = supabase
        .from("vehicles")
        .select("id")
        .eq("brand", "fiat")
        .eq("slug", finalSlug);

      const { data: duplicate, error: dupErr } = editingId
        ? await dupQuery.neq("id", editingId).maybeSingle()
        : await dupQuery.maybeSingle();

      if (dupErr) throw dupErr;

      if (duplicate?.id) {
        throw new Error("Já existe um veículo Fiat com esse slug.");
      }

      const payload: any = {
        brand: "fiat",
        model_name: modelName.trim(),
        slug: finalSlug,
        title: title.trim(),
        description: description.trim(),
        image_url: mainImage.trim(),
        catalog_cover_url: catalogCover.trim() || null,
        is_visible: isVisible,
        price_start: Number(priceStart || 0),
        versions,
        colors,
        kits,
        accessories,
        spec_groups: [],
      };

      if (editingId) {
        const { error } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);

        if (error) throw error;
      }

      await fetchExisting();
      resetForm();
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar veículo Fiat.");
    } finally {
      setSaving(false);
    }
  }

  function updateVersion(id: string, patch: Partial<FiatVersion>) {
    setVersions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateColor(id: string, patch: Partial<FiatOptionItem>) {
    setColors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateKit(id: string, patch: Partial<FiatOptionItem>) {
    setKits((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateAccessory(id: string, patch: Partial<FiatOptionItem>) {
    setAccessories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }


  function importOfficialAccessories(mode: "append" | "replace" = "append") {
    const officialItems = getOfficialAccessoriesForVehicle(computedSlug, modelName).map(
      officialAccessoryToOption
    );

    if (!officialItems.length) {
      setErr("Não encontrei acessórios oficiais para este modelo.");
      return;
    }

    if (mode === "replace") {
      setAccessories(officialItems);
      return;
    }

    setAccessories((prev) => {
      const existingNames = new Set(
        prev.map((item) => item.name.trim().toLowerCase()).filter(Boolean)
      );

      const withoutDuplicates = officialItems.filter(
        (item) => !existingNames.has(item.name.trim().toLowerCase())
      );

      return [...prev, ...withoutDuplicates];
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-28 pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Link
              href="/admin/cars"
              className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-500 hover:text-black"
            >
              <ArrowLeft size={16} />
              Voltar
            </Link>

            <h1 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
              {editingId ? "Editar veículo Fiat" : "Criador de veículo Fiat"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Cadastre o veículo completo. Na aba de cores, você pode enviar
              várias imagens de uma vez e criar várias cores para o mesmo carro.
            </p>

            {err ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {err}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="gray"
              onClick={resetForm}
              icon={<RefreshCw size={14} />}
            >
              Novo
            </Button>

            <Button
              type="button"
              variant="fiat"
              onClick={handleSave}
              disabled={saving || uploading}
              icon={<Save size={14} />}
            >
              {saving
                ? "Salvando..."
                : editingId
                ? "Salvar alterações"
                : "Salvar Fiat"}
            </Button>
          </div>
        </div>

        <Card
          title="Veículos Fiat cadastrados"
          icon={<CarFront size={16} />}
          right={
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                value={existingQuery}
                onChange={(e) => setExistingQuery(e.target.value)}
                placeholder="Buscar modelo ou slug..."
                className="mt-0 md:w-[260px]"
              />

              <Button
                type="button"
                variant="gray"
                onClick={fetchExisting}
                disabled={existingLoading}
                icon={<RefreshCw size={14} />}
              >
                Atualizar
              </Button>
            </div>
          }
        >
          {existingLoading ? (
            <div className="text-sm text-slate-500">Carregando...</div>
          ) : filteredExisting.length === 0 ? (
            <div className="text-sm text-slate-500">
              Nenhum veículo Fiat cadastrado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="hidden grid-cols-12 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase text-slate-400 md:grid">
                <div className="col-span-5">Modelo</div>
                <div className="col-span-4">Slug</div>
                <div className="col-span-1 text-center">Vis.</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>

              {filteredExisting.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="grid grid-cols-1 gap-3 border-t border-slate-200 px-4 py-4 md:grid-cols-12 md:items-center"
                >
                  <div className="md:col-span-5">
                    <div className="truncate text-sm font-black text-slate-900">
                      {vehicle.model_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {vehicle.price_start
                        ? money(Number(vehicle.price_start))
                        : "—"}
                    </div>
                  </div>

                  <div className="truncate font-mono text-xs text-slate-600 md:col-span-4">
                    {vehicle.slug}
                  </div>

                  <div className="text-xs font-black md:col-span-1 md:text-center">
                    <span
                      className={
                        vehicle.is_visible ? "text-green-700" : "text-red-700"
                      }
                    >
                      {vehicle.is_visible ? "ON" : "OFF"}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 md:col-span-2 md:justify-end">
                    <Button
                      type="button"
                      variant="gray"
                      onClick={() => loadVehicleToEdit(vehicle.id)}
                      icon={<Pencil size={14} />}
                    >
                      Editar
                    </Button>

                    <a
                      href={`/fiat/builder?vehicle=${vehicle.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-black uppercase text-slate-900 hover:bg-slate-200"
                    >
                      <ExternalLink size={14} />
                      Abrir
                    </a>

                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deleteVehicle(vehicle.id)}
                      icon={<Trash2 size={14} />}
                    >
                      Del
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="my-8 flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          {[
            ["basic", "Básico"],
            ["versions", "Versões"],
            ["colors", "Cores"],
            ["kits", "Kits opcionais"],
            ["accessories", "Acessórios"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={[
                "rounded-full px-5 py-2 text-sm font-black transition",
                activeTab === key
                  ? "bg-[#ff1435] text-white shadow"
                  : "text-slate-500 hover:text-black",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className={activeTab === "colors" || activeTab === "accessories" ? "space-y-6 lg:col-span-12" : "space-y-6 lg:col-span-7"}>
            {activeTab === "basic" && (
              <Card
                title="Dados principais do veículo"
                icon={<CarFront size={16} />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Nome do modelo</Label>
                    <Input
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="Ex: Fastback Hybrid"
                    />
                  </div>

                  <div>
                    <Label>Preço inicial</Label>
                    <Input
                      type="number"
                      value={priceStart}
                      onChange={(e) =>
                        setPriceStart(Number(e.target.value || 0))
                      }
                      placeholder="119990"
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      Preview:{" "}
                      <span className="font-bold">{money(priceStart)}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      placeholder={slugify(modelName) || "fastback-hybrid"}
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      URL final:{" "}
                      <span className="font-mono font-bold">
                        /fiat/builder?vehicle={computedSlug || "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Visibilidade</Label>
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className={[
                        "mt-1 flex h-10 w-full items-center justify-between rounded-xl border px-3 text-xs font-black uppercase transition",
                        isVisible
                          ? "border-green-200 bg-green-50 text-green-800"
                          : "border-red-200 bg-red-50 text-red-800",
                      ].join(" ")}
                    >
                      <span className="inline-flex items-center gap-2">
                        {isVisible ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <EyeOff size={16} />
                        )}
                        {isVisible ? "Visível no site" : "Oculto"}
                      </span>
                      {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Título do builder</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Monte o seu Fastback"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Descrição do veículo</Label>
                    <Textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descrição que aparece no builder do veículo."
                    />
                  </div>

                  <UploadField
                    label="Imagem principal do builder"
                    value={mainImage}
                    onChange={setMainImage}
                    onUpload={(file) =>
                      handleUpload(file, "vehicle/main", setMainImage)
                    }
                    uploading={uploading}
                  />

                  <UploadField
                    label="Imagem/capa do catálogo"
                    value={catalogCover}
                    onChange={setCatalogCover}
                    onUpload={(file) =>
                      handleUpload(
                        file,
                        "vehicle/catalog-cover",
                        setCatalogCover
                      )
                    }
                    uploading={uploading}
                    cover
                  />
                </div>
              </Card>
            )}

            {activeTab === "versions" && (
              <Card
                title="Versões do veículo"
                icon={<Settings size={16} />}
                right={
                  <Button
                    type="button"
                    variant="fiat"
                    icon={<Plus size={14} />}
                    onClick={addVersion}
                  >
                    Adicionar versão
                  </Button>
                }
              >
                <div className="space-y-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400">
                            Versão {index + 1}
                          </div>
                          <div className="font-black text-slate-900">
                            {version.name || "Sem nome"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {money(version.price)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeVersion(version.id)}
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label>Nome da versão/modelo</Label>
                          <Input
                            value={version.name}
                            onChange={(e) =>
                              updateVersion(version.id, {
                                name: e.target.value,
                              })
                            }
                            placeholder="Ex: Fastback Turbo 200 Flex AT 2026"
                          />
                        </div>

                        <div>
                          <Label>Preço da versão</Label>
                          <Input
                            type="number"
                            value={version.price}
                            onChange={(e) =>
                              updateVersion(version.id, {
                                price: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Preview preço</Label>
                          <div className="mt-1 flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-900">
                            {money(version.price)}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <Label>Descrição da versão</Label>
                          <Textarea
                            rows={3}
                            value={version.description}
                            onChange={(e) =>
                              updateVersion(version.id, {
                                description: e.target.value,
                              })
                            }
                          />
                        </div>

                        <UploadField
                          label="Imagem da versão"
                          value={version.image}
                          onChange={(value) =>
                            updateVersion(version.id, { image: value })
                          }
                          onUpload={(file) =>
                            handleUpload(file, `versions/${version.id}`, (url) =>
                              updateVersion(version.id, { image: url })
                            )
                          }
                          uploading={uploading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "colors" && (
              <Card
                title="Cores por versão/modelo"
                icon={<Palette size={16} />}
                right={
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#ff1435] px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition hover:bg-[#e80f30] disabled:cursor-not-allowed disabled:opacity-60">
                      <UploadCloud size={14} />
                      {uploading ? "Enviando..." : "Upload em massa"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={uploading || !selectedColorVersionId}
                        className="hidden"
                        onChange={async (e) => {
                          const files = Array.from(e.currentTarget.files || []);
                          e.currentTarget.value = "";
                          await handleBulkColorUpload(files, selectedColorVersionId);
                        }}
                      />
                    </label>

                    <Button
                      type="button"
                      variant="gray"
                      icon={<Plus size={14} />}
                      onClick={() =>
                        setColors((prev) => [
                          ...prev,
                          createDefaultColor(selectedColorVersionId || versions[0]?.id),
                        ])
                      }
                      disabled={!versions.length}
                    >
                      Cor manual
                    </Button>
                  </div>
                }
              >
                <div className="mb-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <Label>Escolha a versão/modelo que receberá as imagens</Label>
                  <select
                    value={selectedColorVersionId}
                    onChange={(e) => setSelectedColorVersionId(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-black/5"
                  >
                    <option value="">Selecione uma versão/modelo</option>
                    {versions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.name || "Versão sem nome"}
                      </option>
                    ))}
                  </select>

                  <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
                    <strong>Como funciona:</strong> selecione uma versão/modelo acima e envie várias imagens.
                    Cada imagem vira uma cor ligada somente a essa versão. Exemplo: Fastback Audace preto,
                    Fastback Audace branco, Fastback Impetus preto, Fastback Impetus branco.
                  </div>
                </div>

                <div className="mb-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center p-6 text-center transition hover:bg-white">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <UploadCloud size={26} className="text-slate-500" />
                    </div>

                    <h3 className="mt-4 text-lg font-black text-slate-950">
                      Envie várias cores para o modelo selecionado
                    </h3>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                      O nome da cor será puxado do nome do arquivo. Antes de enviar,
                      renomeie como preto-vulcano.png, branco-banchisa.png ou vermelho-montecarlo.png.
                    </p>

                    <div className="mt-4 rounded-full bg-black px-5 py-2 text-xs font-black uppercase tracking-wide text-white">
                      {uploading ? "Enviando imagens..." : "Selecionar imagens"}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading || !selectedColorVersionId}
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.currentTarget.files || []);
                        e.currentTarget.value = "";
                        await handleBulkColorUpload(files, selectedColorVersionId);
                      }}
                    />
                  </label>
                </div>

                {colors.length === 0 ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <Palette size={34} className="text-slate-300" />
                    <h3 className="mt-3 text-lg font-black text-slate-900">
                      Nenhuma cor cadastrada
                    </h3>
                    <p className="mt-1 max-w-md text-sm text-slate-500">
                      Selecione uma versão/modelo e use o upload em massa para cadastrar várias cores.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {colorsByVersion.map(({ version, colors: versionColors }) => (
                      <div
                        key={version.id}
                        className="rounded-[24px] border border-slate-200 bg-white p-4"
                      >
                        <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                              Versão/modelo
                            </div>
                            <h3 className="text-base font-black text-slate-950">
                              {version.name || "Versão sem nome"}
                            </h3>
                            <p className="text-xs font-bold text-slate-500">
                              {versionColors.length} cor(es) cadastrada(s) para este modelo
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="gray"
                            icon={<Plus size={14} />}
                            onClick={() => {
                              setSelectedColorVersionId(version.id);
                              setColors((prev) => [...prev, createDefaultColor(version.id)]);
                            }}
                          >
                            Cor neste modelo
                          </Button>
                        </div>

                        {versionColors.length === 0 ? (
                          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-500">
                            Nenhuma cor para esta versão ainda. Selecione esta versão acima e envie as imagens.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                            {versionColors.map((color) => (
                              <OptionEditor
                                key={color.id}
                                label="Cor"
                                item={color}
                                uploading={uploading}
                                showCategory
                                showVersionSelector
                                versions={versions}
                                onChange={(patch) => updateColor(color.id, patch)}
                                onRemove={() =>
                                  setColors((prev) =>
                                    prev.filter((item) => item.id !== color.id)
                                  )
                                }
                                onUpload={(file) =>
                                  handleUpload(file, `colors/${color.versionId || "sem-versao"}/${color.id}`, (url) =>
                                    updateColor(color.id, { image: url })
                                  )
                                }
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {colors.filter((color) => !color.versionId).length > 0 ? (
                      <div className="rounded-[24px] border border-red-200 bg-red-50 p-4">
                        <h3 className="text-sm font-black uppercase text-red-700">
                          Cores sem versão/modelo
                        </h3>
                        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                          {colors
                            .filter((color) => !color.versionId)
                            .map((color) => (
                              <OptionEditor
                                key={color.id}
                                label="Cor"
                                item={color}
                                uploading={uploading}
                                showCategory
                                showVersionSelector
                                versions={versions}
                                onChange={(patch) => updateColor(color.id, patch)}
                                onRemove={() =>
                                  setColors((prev) =>
                                    prev.filter((item) => item.id !== color.id)
                                  )
                                }
                                onUpload={(file) =>
                                  handleUpload(file, `colors/sem-versao/${color.id}`, (url) =>
                                    updateColor(color.id, { image: url })
                                  )
                                }
                              />
                            ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "kits" && (
              <Card
                title="Kits opcionais"
                icon={<Wrench size={16} />}
                right={
                  <Button
                    type="button"
                    variant="fiat"
                    icon={<Plus size={14} />}
                    onClick={() => setKits((prev) => [...prev, createDefaultKit()])}
                  >
                    Adicionar kit
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {kits.map((kit) => (
                    <OptionEditor
                      key={kit.id}
                      label="Kit"
                      item={kit}
                      uploading={uploading}
                      onChange={(patch) => updateKit(kit.id, patch)}
                      onRemove={() =>
                        setKits((prev) =>
                          prev.filter((item) => item.id !== kit.id)
                        )
                      }
                      onUpload={(file) =>
                        handleUpload(file, `kits/${kit.id}`, (url) =>
                          updateKit(kit.id, { image: url })
                        )
                      }
                    />
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "accessories" && (
              <Card
                title="Acessórios"
                icon={<Sparkles size={16} />}
                right={
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="fiat"
                      icon={<Sparkles size={14} />}
                      onClick={() => importOfficialAccessories("append")}
                    >
                      Importar oficiais
                    </Button>

                    <Button
                      type="button"
                      variant="gray"
                      icon={<RefreshCw size={14} />}
                      onClick={() => importOfficialAccessories("replace")}
                    >
                      Substituir por oficiais
                    </Button>

                    <Button
                      type="button"
                      variant="gray"
                      icon={<Plus size={14} />}
                      onClick={() =>
                        setAccessories((prev) => [
                          ...prev,
                          createDefaultAccessory(),
                        ])
                      }
                    >
                      Manual
                    </Button>
                  </div>
                }
              >
                <div className="mb-5 rounded-[24px] border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  <strong>Importação rápida:</strong> clique em <strong>Importar oficiais</strong> para adicionar acessórios reais Fiat/Mopar indicados para este modelo. Use <strong>Substituir por oficiais</strong> quando quiser limpar a lista atual e deixar só os acessórios oficiais sugeridos.
                </div>

                <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Modelo detectado</div>
                    <div className="mt-1 text-sm font-black text-slate-900">{modelName || computedSlug || "Fiat"}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Acessórios na lista</div>
                    <div className="mt-1 text-sm font-black text-slate-900">{accessories.length}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Fonte</div>
                    <div className="mt-1 text-sm font-black text-slate-900">Fiat/Mopar</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {accessories.map((accessory) => (
                    <OptionEditor
                      key={accessory.id}
                      label="Acessório"
                      item={accessory}
                      uploading={uploading}
                      showCategory
                      onChange={(patch) => updateAccessory(accessory.id, patch)}
                      onRemove={() =>
                        setAccessories((prev) =>
                          prev.filter((item) => item.id !== accessory.id)
                        )
                      }
                      onUpload={(file) =>
                        handleUpload(file, `accessories/${accessory.id}`, (url) =>
                          updateAccessory(accessory.id, { image: url })
                        )
                      }
                    />
                  ))}
                </div>
              </Card>
            )}
          </div>

          {activeTab !== "colors" && activeTab !== "accessories" ? (
          <div className="lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-[#120b1d] p-5 text-white">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    Preview Fiat Builder
                  </div>

                  <h2 className="mt-2 text-2xl font-black">
                    {title || `Monte o seu ${modelName || "Fiat"}`}
                  </h2>

                  <p className="mt-1 line-clamp-2 text-sm text-white/70">
                    {description || "Descrição do veículo aparecerá aqui."}
                  </p>
                </div>

                <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[#f1f0e8] p-5">
                  <div className="absolute bottom-10 left-0 right-0 h-[120px] bg-[#ffbc16]" />

                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview Fiat"
                      className="relative z-10 h-full w-full object-contain"
                    />
                  ) : (
                    <div className="relative z-10 text-sm font-black text-slate-400">
                      Sem imagem
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Veículo
                  </div>

                  <h3 className="mt-1 text-2xl font-black text-slate-950">
                    {modelName || "Nome do veículo"}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-[10px] font-black uppercase text-slate-400">
                        A partir de
                      </div>
                      <div className="mt-1 text-lg font-black text-slate-900">
                        {money(priceStart)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <div className="text-[10px] font-black uppercase text-slate-400">
                        Slug
                      </div>
                      <div className="mt-1 truncate font-mono text-xs font-black text-slate-900">
                        {computedSlug || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong>{versions.length}</strong>
                      <br />
                      versões
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong>{colors.length}</strong>
                      <br />
                      cores
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong>{kits.length}</strong>
                      <br />
                      kits
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong>{accessories.length}</strong>
                      <br />
                      acessórios
                    </div>
                  </div>
                </div>
              </div>

              <Card title="Checklist rápido" icon={<CheckCircle2 size={16} />}>
                <div className="space-y-2 text-sm text-slate-700">
                  <ChecklistLine label="Nome" ok={Boolean(modelName.trim())} />
                  <ChecklistLine label="Slug" ok={Boolean(computedSlug)} />
                  <ChecklistLine label="Título" ok={Boolean(title.trim())} />
                  <ChecklistLine
                    label="Descrição"
                    ok={Boolean(description.trim())}
                  />
                  <ChecklistLine
                    label="Imagem principal"
                    ok={Boolean(mainImage.trim())}
                  />
                  <ChecklistLine label="Versões" ok={versions.length > 0} />
                  <ChecklistLine
                    label="Cores cadastradas"
                    ok={colors.length > 0 && colors.every((c) => Boolean(c.image))}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="gray"
                    icon={<ImageIcon size={14} />}
                    onClick={() => setActiveTab("versions")}
                  >
                    Versões
                  </Button>

                  <Button
                    type="button"
                    variant="gray"
                    icon={<Palette size={14} />}
                    onClick={() => setActiveTab("colors")}
                  >
                    Cores
                  </Button>

                  <Button
                    type="button"
                    variant="gray"
                    icon={<Wrench size={14} />}
                    onClick={() => setActiveTab("kits")}
                  >
                    Kits
                  </Button>
                </div>
              </Card>

              <Button
                type="button"
                variant="fiat"
                className="h-12 w-full"
                onClick={handleSave}
                disabled={saving || uploading}
                icon={<Save size={16} />}
              >
                {saving
                  ? "Salvando..."
                  : editingId
                  ? "Salvar alterações"
                  : "Salvar veículo Fiat"}
              </Button>
            </div>
          </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ChecklistLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
      <span>{label}</span>
      <span
        className={ok ? "font-black text-green-700" : "font-black text-red-700"}
      >
        {ok ? "OK" : "Falta"}
      </span>
    </div>
  );
}

function OptionEditor({
  label,
  item,
  uploading,
  showCategory,
  showVersionSelector,
  versions = [],
  onChange,
  onRemove,
  onUpload,
}: {
  label: string;
  item: FiatOptionItem;
  uploading: boolean;
  showCategory?: boolean;
  showVersionSelector?: boolean;
  versions?: FiatVersion[];
  onChange: (patch: Partial<FiatOptionItem>) => void;
  onRemove: () => void;
  onUpload: (file: File | null) => void;
}) {
  const linkedVersion = versions.find((v) => v.id === item.versionId);

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex items-start justify-between gap-4 p-5 pr-16">
        <div>
          <div className="text-[10px] font-black uppercase text-slate-400">
            {label}
          </div>

          <div className="flex items-center gap-2 font-black text-slate-900">
            <span
              className="inline-block h-5 w-5 shrink-0 rounded-full border border-slate-300 shadow-sm"
              style={{ backgroundColor: item.hex || "#111827" }}
            />
            <span>{item.name || "Sem nome"}</span>
          </div>

          {showVersionSelector ? (
            <div className="mt-1 max-w-[260px] truncate text-xs font-bold text-slate-500">
              Modelo: {linkedVersion?.name || "Nenhum modelo selecionado"}
            </div>
          ) : null}

          <div className="text-xs text-slate-500">{money(item.price)}</div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          title={`Apagar ${label.toLowerCase()}`}
          aria-label={`Apagar ${label.toLowerCase()}`}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-600 shadow-sm transition hover:bg-red-50 hover:text-red-700"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {item.image ? (
        <div className="border-y border-slate-200 bg-white p-2">
          <img
            src={item.image}
            alt={item.name}
            className="h-48 w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center border-y border-slate-200 bg-white text-xs font-black text-slate-300">
          Sem imagem
        </div>
      )}

      <div className="space-y-3 p-5">
        {showVersionSelector ? (
          <div>
            <Label>Versão/modelo desta cor</Label>
            <select
              value={item.versionId || ""}
              onChange={(e) => onChange({ versionId: e.target.value })}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-black/5"
            >
              <option value="">Selecione uma versão</option>
              {versions.map((version) => (
                <option key={version.id} value={version.id}>
                  {version.name || "Versão sem nome"}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <Label>Nome</Label>
          <Input
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>

        <div>
          <Label>Cor da bolha no site</Label>
          <div className="mt-1 grid grid-cols-[56px_1fr] gap-3">
            <input
              type="color"
              value={item.hex || "#111827"}
              onChange={(e) => onChange({ hex: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
              title="Escolher cor da bolha"
            />
            <Input
              value={item.hex || "#111827"}
              onChange={(e) => onChange({ hex: e.target.value })}
              placeholder="#111827"
              className="mt-0 font-mono"
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <span
              className="inline-block h-4 w-4 rounded-full border border-slate-300"
              style={{ backgroundColor: item.hex || "#111827" }}
            />
            Essa é a cor que aparecerá na bolinha de seleção da página.
          </div>
        </div>

        {showCategory ? (
          <div>
            <Label>Categoria da cor</Label>
            <Input
              value={item.category || ""}
              onChange={(e) => onChange({ category: e.target.value })}
              placeholder="Sólidas, Metálicas, Especiais..."
            />
          </div>
        ) : null}

        <div>
          <Label>Preço adicional</Label>
          <Input
            type="number"
            value={item.price}
            onChange={(e) => onChange({ price: Number(e.target.value || 0) })}
          />
        </div>

        <div>
          <Label>Descrição</Label>
          <Textarea
            rows={3}
            value={item.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <UploadField
          label={`Imagem do ${label.toLowerCase()}`}
          value={item.image}
          onChange={(value) => onChange({ image: value })}
          onUpload={onUpload}
          uploading={uploading}
        />
      </div>
    </div>
  );
}