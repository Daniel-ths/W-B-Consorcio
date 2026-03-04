"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  EyeOff,
  Eye,
  ChevronDown,
  Palette,
  Settings,
  Sparkles,
  CarFront,
  UploadCloud,
  RefreshCw,
  Pencil,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";

/* =========================================================
   TIPOS
========================================================= */
type SpecGroup = {
  id: string;
  title: string;
  description?: string;
  items?: string[];
};

type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPrice?: number;
  swatch: string;
  image_url: string; // imagem da cor (PNG recomendado)
};

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  note?: string;
  heroLabel?: string;

  // ✅ imagem de capa da versão (ex: Comfort, Limited...)
  cover_image_url?: string;

  // ✅ ESPECIFICAÇÕES POR VERSÃO
  spec_groups?: SpecGroup[];

  // ✅ DESTAQUES POR VERSÃO
  highlights?: string[];

  // ✅ CORES POR VERSÃO (agora é aqui)
  colors?: ColorVariant[];
};

type VehicleRow = {
  id: number;
  model_name: string;
  slug: string;

  // fallback geral do modelo
  image_url?: string | null;

  catalog_cover_url?: string | null;

  brand?: string | null;
  is_visible?: boolean | null;
  price_start?: number | null;

  versions?: VersionItem[] | null;

  // ✅ legado (caso existam registros antigos com highlights no veículo)
  highlights?: string[] | null;

  // ✅ legado (caso existam registros antigos com colors no veículo)
  colors?: ColorVariant[] | null;

  // legado (não usamos mais)
  spec_groups?: SpecGroup[] | null;
};

/* =========================================================
   HELPERS
========================================================= */
const HY_BLUE = "#00A3C8";

const money = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(v || 0));

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

const slugify = (s: string) =>
  String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function preventSubmit(e: React.KeyboardEvent) {
  if (e.key === "Enter") e.preventDefault();
}

/* =========================================================
   UPLOAD (Supabase Storage)
========================================================= */
const BUCKET_NAME = "cars"; // troque pro nome real do seu bucket, se necessário

function fileExt(name: string) {
  const parts = String(name || "").split(".");
  return (parts[parts.length - 1] || "png").toLowerCase();
}

async function uploadImageToSupabase(file: File, folder: string) {
  const ext = fileExt(file.name);
  const safeFolder = String(folder || "uploads").replace(/[^a-z0-9/_-]/gi, "");
  const path = `${safeFolder}/${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const { error: upErr } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type || "image/*",
  });

  if (upErr) {
    const msg = String((upErr as any)?.message || "");
    if (msg.toLowerCase().includes("bucket") && msg.toLowerCase().includes("not found")) {
      throw new Error(
        `Bucket "${BUCKET_NAME}" não existe no Supabase Storage. Crie esse bucket (Storage > New bucket) ou troque BUCKET_NAME.`
      );
    }
    throw upErr;
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  const publicUrl = data?.publicUrl || "";
  if (!publicUrl) throw new Error("Não consegui gerar publicUrl do Storage.");
  return publicUrl;
}

/* =========================================================
   UI
========================================================= */
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h2 className="text-sm font-bold uppercase text-gray-800 flex items-center gap-2">
            {icon}
            {title}
          </h2>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] font-bold uppercase text-gray-500">{children}</div>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      onKeyDown={(e) => {
        preventSubmit(e);
        props.onKeyDown?.(e);
      }}
      className={[
        "w-full mt-1 h-10 px-3 border rounded-lg bg-white",
        "text-sm outline-none focus:ring-1 focus:ring-black/20 focus:border-gray-400",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      onKeyDown={(e) => {
        preventSubmit(e);
        props.onKeyDown?.(e);
      }}
      className={[
        "w-full mt-1 px-3 py-2 border rounded-lg bg-white",
        "text-sm outline-none focus:ring-1 focus:ring-black/20 focus:border-gray-400",
        props.className || "",
      ].join(" ")}
    />
  );
}

function Button({
  variant = "black",
  icon,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "black" | "gray" | "blue" | "danger";
  icon?: React.ReactNode;
}) {
  const map =
    variant === "blue"
      ? "bg-blue-600 hover:bg-blue-700 text-white"
      : variant === "gray"
      ? "bg-gray-100 hover:bg-gray-200 text-gray-900"
      : variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-black hover:bg-gray-800 text-white";

  return (
    <button
      {...props}
      className={[
        "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide",
        "transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed",
        "inline-flex items-center justify-center gap-2",
        map,
        props.className || "",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}

function ToggleVisible({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={[
        "w-full h-10 mt-1 rounded-lg border px-3",
        "flex items-center justify-between gap-3 transition",
        value ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800",
      ].join(" ")}
    >
      <span className="text-xs font-bold uppercase flex items-center gap-2">
        <span
          className={[
            "w-6 h-6 rounded-full flex items-center justify-center",
            value ? "bg-green-600 text-white" : "bg-red-600 text-white",
          ].join(" ")}
        >
          {value ? <CheckCircle2 size={14} /> : <EyeOff size={14} />}
        </span>
        {value ? "Visível no site" : "Oculto (rascunho)"}
      </span>
      {value ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );
}

/* =========================================================
   SPEC GROUPS EDITOR (por versão)
========================================================= */
function SpecGroupsEditor({
  specGroups,
  setSpecGroups,
}: {
  specGroups: SpecGroup[];
  setSpecGroups: React.Dispatch<React.SetStateAction<SpecGroup[]>>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const add = () => {
    const id = uid("s");
    setSpecGroups((prev) => [...prev, { id, title: "NOVA SEÇÃO", description: "", items: ["Novo item"] }]);
    setOpenId(id);
  };

  const update = (id: string, patch: Partial<SpecGroup>) =>
    setSpecGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));

  const remove = (id: string) => {
    setSpecGroups((prev) => prev.filter((g) => g.id !== id));
    setOpenId((cur) => (cur === id ? null : cur));
  };

  return (
    <Card
      title="Itens de série (da versão)"
      icon={<Settings size={16} />}
      right={
        <Button type="button" onClick={add} icon={<Plus size={14} />}>
          Adicionar seção
        </Button>
      }
    >
      {specGroups.length === 0 ? (
        <div className="text-sm text-gray-500">Nenhuma seção cadastrada.</div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          {specGroups.map((g) => {
            const opened = openId === g.id;
            const items = Array.isArray(g.items) ? g.items : [];
            return (
              <div key={g.id} className="border-b border-gray-200 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === g.id ? null : g.id))}
                  className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50"
                >
                  <div className="text-left">
                    <div className="text-xs font-bold uppercase text-gray-700">{g.title}</div>
                    <div className="text-[11px] text-gray-500">{items.length} item(ns)</div>
                  </div>
                  <ChevronDown
                    size={18}
                    className={["transition-transform", opened ? "rotate-180" : "rotate-0"].join(" ")}
                  />
                </button>

                {opened ? (
                  <div className="px-4 pb-4 bg-gray-50/40">
                    <div className="flex items-center justify-between gap-3 pt-4">
                      <div className="flex-1">
                        <Label>Título da seção</Label>
                        <Input value={g.title} onChange={(e) => update(g.id, { title: e.target.value })} />
                      </div>
                      <Button type="button" variant="danger" onClick={() => remove(g.id)} icon={<Trash2 size={14} />}>
                        Remover
                      </Button>
                    </div>

                    <div className="mt-3">
                      <Label>Descrição (opcional)</Label>
                      <Textarea
                        rows={2}
                        value={g.description || ""}
                        onChange={(e) => update(g.id, { description: e.target.value })}
                        placeholder="Texto pequeno que aparece ao expandir"
                      />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-[10px] font-bold uppercase text-gray-500">Itens ({items.length})</div>
                      <Button
                        type="button"
                        variant="black"
                        onClick={() => update(g.id, { items: [...items, "Novo item"] })}
                        icon={<Plus size={14} />}
                      >
                        Adicionar item
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {items.map((it, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-gray-300">•</span>
                          <Input
                            value={it}
                            onChange={(e) => {
                              const next = items.slice();
                              next[idx] = e.target.value;
                              update(g.id, { items: next });
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = items.filter((_, i) => i !== idx);
                              update(g.id, { items: next });
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                            title="Remover item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   DESTAQUES POR VERSÃO (editor)
========================================================= */
function VersionHighlightsEditor({
  highlights,
  setHighlights,
  versionTitle,
}: {
  highlights: string[];
  setHighlights: React.Dispatch<React.SetStateAction<string[]>>;
  versionTitle?: string;
}) {
  return (
    <Card
      title={`Destaques da versão${versionTitle ? ` • ${versionTitle}` : ""}`}
      icon={<Sparkles size={16} />}
      right={
        <Button type="button" onClick={() => setHighlights((p) => [...p, "Novo destaque"])} icon={<Plus size={14} />}>
          Adicionar
        </Button>
      }
    >
      {highlights.length === 0 ? (
        <div className="text-sm text-gray-500">Sem destaques nesta versão.</div>
      ) : (
        <div className="space-y-2">
          {highlights.map((h, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-gray-300">•</span>
              <Input
                value={h}
                onChange={(e) => setHighlights((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))}
                placeholder="Ex: 6 airbags"
              />
              <button
                type="button"
                onClick={() => setHighlights((prev) => prev.filter((_, i) => i !== idx))}
                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   EDITOR DE CORES (AGORA POR VERSÃO)
========================================================= */
function ColorsEditor({
  colors,
  setColors,
  uploadFolder,
  onUploadBusyChange,
}: {
  colors: ColorVariant[];
  setColors: React.Dispatch<React.SetStateAction<ColorVariant[]>>;
  uploadFolder: string;
  onUploadBusyChange?: (busy: boolean) => void;
}) {
  const add = () =>
    setColors((prev) => [
      ...prev,
      { id: uid("c"), name: "Nova cor", internal: "", extraPrice: 0, swatch: "#dddddd", image_url: "" },
    ]);

  const update = (id: string, patch: Partial<ColorVariant>) =>
    setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const remove = (id: string) => setColors((prev) => prev.filter((c) => c.id !== id));

  async function handleUploadForColor(colorId: string, file: File | null) {
    if (!file) return;
    onUploadBusyChange?.(true);
    try {
      const url = await uploadImageToSupabase(file, uploadFolder);
      update(colorId, { image_url: url });
    } finally {
      onUploadBusyChange?.(false);
    }
  }

  return (
    <Card
      title="Cores (da versão)"
      icon={<Palette size={16} />}
      right={
        <Button type="button" onClick={add} icon={<Plus size={14} />}>
          Adicionar
        </Button>
      }
    >
      {colors.length === 0 ? (
        <div className="text-sm text-gray-500">Nenhuma cor cadastrada nesta versão.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colors.map((c) => (
            <div key={c.id} className="bg-gray-50/60 border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{c.name || "Sem nome"}</div>
                  <div className="text-xs text-gray-500">{c.internal ? `Interno: ${c.internal}` : "—"}</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    {c.extraPrice ? `+ ${money(c.extraPrice)}` : "+ R$ 0,00"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="h-20 border-y border-gray-200" style={{ background: c.swatch || "#ddd" }} />

              <div className="p-4 space-y-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={c.name} onChange={(e) => update(c.id, { name: e.target.value })} placeholder="Ex: Branco Atlas" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hex / Swatch</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="color"
                        value={c.swatch || "#dddddd"}
                        onChange={(e) => update(c.id, { swatch: e.target.value })}
                        className="h-10 w-12 rounded-lg border border-gray-200 bg-white p-1 cursor-pointer"
                      />
                      <Input value={c.swatch} onChange={(e) => update(c.id, { swatch: e.target.value })} placeholder="#FFFFFF" />
                    </div>
                  </div>
                  <div>
                    <Label>Preço extra</Label>
                    <Input
                      type="number"
                      value={Number(c.extraPrice || 0)}
                      onChange={(e) => update(c.id, { extraPrice: Number(e.target.value || 0) })}
                      placeholder="0"
                    />
                    <div className="text-[11px] text-gray-500 mt-1">
                      Preview: <span className="font-semibold">{money(c.extraPrice || 0)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Cor interna (opcional)</Label>
                  <Input value={c.internal || ""} onChange={(e) => update(c.id, { internal: e.target.value })} placeholder="Ex: Preto" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Imagem desta cor (upload)</Label>

                  <label className="w-full cursor-pointer">
                    <div className="w-full h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold uppercase tracking-wide inline-flex items-center justify-center gap-2">
                      <UploadCloud size={14} />
                      Enviar imagem da cor
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        (e.target as any).value = "";
                        handleUploadForColor(c.id, f).catch(() => {});
                      }}
                    />
                  </label>

                  <div className="text-[11px] text-gray-500">
                    Vai salvar em Storage e preencher <span className="font-semibold">versions[].colors[].image_url</span>.
                  </div>

                  <div>
                    <Label>image_url (manual/opcional)</Label>
                    <Input value={c.image_url} onChange={(e) => update(c.id, { image_url: e.target.value })} placeholder="(preenchido automaticamente ao fazer upload)" />
                  </div>

                  {c.image_url ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2">
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Preview</div>
                      <img src={c.image_url} alt={c.name} className="w-full h-40 object-contain" />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   EDITOR DE VERSÕES (com capa por versão)
========================================================= */
function VersionsEditor({
  versions,
  setVersions,
  uploadBaseFolder,
  onUploadBusyChange,
}: {
  versions: VersionItem[];
  setVersions: React.Dispatch<React.SetStateAction<VersionItem[]>>;
  uploadBaseFolder: string;
  onUploadBusyChange?: (busy: boolean) => void;
}) {
  const add = () =>
    setVersions((prev) => [
      ...prev,
      {
        id: uid("v"),
        title: "Nova versão",
        subtitle: "",
        price: 0,
        note: "",
        heroLabel: "Exterior",
        cover_image_url: "",
        spec_groups: [],
        highlights: [],
        colors: [],
      },
    ]);

  const update = (id: string, patch: Partial<VersionItem>) =>
    setVersions((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const remove = (id: string) => setVersions((prev) => prev.filter((v) => v.id !== id));

  async function handleUploadCover(versionId: string, file: File | null) {
    if (!file) return;
    onUploadBusyChange?.(true);
    try {
      const folder = `${uploadBaseFolder}/versions/${versionId}/cover`;
      const url = await uploadImageToSupabase(file, folder);
      update(versionId, { cover_image_url: url });
    } finally {
      onUploadBusyChange?.(false);
    }
  }

  return (
    <Card
      title="Versões (com capa)"
      icon={<Settings size={16} />}
      right={
        <Button type="button" onClick={add} icon={<Plus size={14} />}>
          Adicionar
        </Button>
      }
    >
      {versions.length === 0 ? (
        <div className="text-sm text-gray-500">Nenhuma versão cadastrada.</div>
      ) : (
        <div className="space-y-4">
          {versions.map((v) => (
            <div key={v.id} className="bg-gray-50/60 border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{v.title || "Sem título"}</div>
                  <div className="text-xs text-gray-500">{v.subtitle || "—"}</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">{money(v.price || 0)}</div>

                  <div className="text-[11px] text-gray-500 mt-1">
                    Cores: <span className="font-semibold">{Array.isArray(v.colors) ? v.colors.length : 0}</span> • Specs:{" "}
                    <span className="font-semibold">{Array.isArray(v.spec_groups) ? v.spec_groups.length : 0}</span> • Destaques:{" "}
                    <span className="font-semibold">{Array.isArray(v.highlights) ? v.highlights.length : 0}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => remove(v.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  title="Remover"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <div>
                  <Label>Título</Label>
                  <Input value={v.title} onChange={(e) => update(v.id, { title: e.target.value })} placeholder="Ex: Comfort" />
                </div>
                <div>
                  <Label>Subtítulo</Label>
                  <Input value={v.subtitle} onChange={(e) => update(v.id, { subtitle: e.target.value })} placeholder="Ex: 1.0 TGDI" />
                </div>
                <div>
                  <Label>Preço</Label>
                  <Input
                    type="number"
                    value={Number(v.price || 0)}
                    onChange={(e) => update(v.id, { price: Number(e.target.value || 0) })}
                    placeholder="129990"
                  />
                  <div className="text-[11px] text-gray-500 mt-1">
                    Preview: <span className="font-semibold">{money(v.price || 0)}</span>
                  </div>
                </div>
                <div>
                  <Label>Hero label</Label>
                  <Input value={v.heroLabel || ""} onChange={(e) => update(v.id, { heroLabel: e.target.value })} placeholder="Exterior" />
                </div>

                <div className="md:col-span-2">
                  <Label>Nota (opcional)</Label>
                  <Textarea rows={2} value={v.note || ""} onChange={(e) => update(v.id, { note: e.target.value })} />
                </div>

                {/* ✅ capa por versão */}
                <div className="md:col-span-2">
                  <Label>Imagem de capa da versão (cover_image_url)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                    <div className="md:col-span-2">
                      <Input
                        value={v.cover_image_url || ""}
                        onChange={(e) => update(v.id, { cover_image_url: e.target.value })}
                        placeholder="(preenchido automaticamente ao fazer upload)"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="w-full cursor-pointer">
                        <div className="w-full h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold uppercase tracking-wide inline-flex items-center justify-center gap-2">
                          <UploadCloud size={14} />
                          Upload capa
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            (e.target as any).value = "";
                            handleUploadCover(v.id, f).catch(() => {});
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {v.cover_image_url ? (
                    <div className="mt-2 rounded-xl border border-gray-200 bg-white p-2">
                      <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Preview capa</div>
                      <img src={v.cover_image_url} alt={`Capa ${v.title}`} className="w-full h-40 object-contain" />
                    </div>
                  ) : null}

                  <div className="text-[11px] text-gray-500 mt-2">
                    Essa imagem é a base da versão. A imagem final no preview será:
                    <span className="font-semibold"> cor.image_url </span> → senão →
                    <span className="font-semibold"> versão.cover_image_url </span> → senão →
                    <span className="font-semibold"> veículo.image_url</span>.
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* =========================================================
   PREVIEW (agora usa cores da versão)
========================================================= */
function Preview({
  modelName,
  vehicleImageUrl,
  priceStart,
  versions,
}: {
  modelName: string;
  vehicleImageUrl: string;
  priceStart: number;
  versions: VersionItem[];
}) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    if (!selectedVersionId && versions[0]?.id) setSelectedVersionId(versions[0].id);
  }, [versions, selectedVersionId]);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) || versions[0] || null,
    [versions, selectedVersionId]
  );

  const versionColors = useMemo(
    () => (Array.isArray(selectedVersion?.colors) ? selectedVersion!.colors! : []),
    [selectedVersion]
  );

  useEffect(() => {
    // quando troca versão, seta primeira cor dessa versão
    if (versionColors[0]?.id) setSelectedColorId(versionColors[0].id);
    else setSelectedColorId("");
  }, [selectedVersionId]); // intencional

  const selectedColor = useMemo(
    () => versionColors.find((c) => c.id === selectedColorId) || versionColors[0] || null,
    [versionColors, selectedColorId]
  );

  const currentImageUrl = useMemo(() => {
    return (
      selectedColor?.image_url ||
      selectedVersion?.cover_image_url ||
      vehicleImageUrl ||
      null
    );
  }, [selectedColor?.image_url, selectedVersion?.cover_image_url, vehicleImageUrl]);

  useEffect(() => {
    setImgKey((k) => k + 1);
  }, [selectedVersionId, selectedColorId]);

  const heroTint = selectedColor?.swatch || "#d8d8d8";

  const totalPrice = useMemo(() => {
    const base = selectedVersion?.price ?? priceStart ?? 0;
    const extra = selectedColor?.extraPrice || 0;
    return base + extra;
  }, [selectedVersion?.price, priceStart, selectedColor?.extraPrice]);

  const vHighlightsCount = Array.isArray(selectedVersion?.highlights) ? selectedVersion!.highlights!.length : 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <CarFront size={18} />
          Preview do Builder
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {modelName?.trim() ? modelName.trim() : "Hyundai"}{" "}
          {selectedVersion?.title ? (
            <>
              • <span className="font-semibold text-gray-700">{selectedVersion.title}</span>
            </>
          ) : null}{" "}
          {selectedColor?.name ? (
            <>
              • <span className="font-semibold text-gray-700">{selectedColor.name}</span>
            </>
          ) : null}{" "}
          • <span className="font-semibold text-gray-700">{vHighlightsCount} destaque(s)</span>
        </div>
      </div>

      <div className="h-[280px] hyVeh_heroBg relative" style={{ ["--tint" as any]: heroTint }}>
        <div className="absolute top-3 left-3 z-[2]">
          <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold bg-white/90 border border-black/10 rounded">
            {selectedVersion?.heroLabel || "Exterior"}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-[2]">
          <span className="inline-flex items-center px-2 py-1 text-[11px] font-bold bg-white/90 border border-black/10 rounded">
            {money(totalPrice)}
          </span>
        </div>

        <div className="h-full flex items-center justify-center relative z-[2]">
          {currentImageUrl ? (
            <img
              key={imgKey}
              src={currentImageUrl}
              alt={modelName || "Hyundai"}
              className="w-[86%] h-[86%] object-contain hyVeh_animImg"
              draggable={false}
            />
          ) : (
            <div className="text-xs font-bold text-gray-500">Sem imagem</div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Versão ativa (preview)</Label>
            <select
              className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm"
              value={selectedVersionId}
              onChange={(e) => setSelectedVersionId(e.target.value)}
            >
              {versions.length === 0 ? <option value="">(sem versões)</option> : null}
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} — {money(v.price || 0)}
                </option>
              ))}
            </select>

            <div className="text-[11px] text-gray-500 mt-2">
              Cores: <span className="font-semibold">{versionColors.length}</span> • Specs:{" "}
              <span className="font-semibold">{Array.isArray(selectedVersion?.spec_groups) ? selectedVersion!.spec_groups!.length : 0}</span>{" "}
              • Destaques: <span className="font-semibold">{vHighlightsCount}</span>
            </div>
          </div>

          <div>
            <Label>Cor ativa (preview)</Label>
            <select
              className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm"
              value={selectedColorId}
              onChange={(e) => setSelectedColorId(e.target.value)}
              disabled={versionColors.length === 0}
            >
              {versionColors.length === 0 ? <option value="">(sem cores nesta versão)</option> : null}
              {versionColors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.extraPrice ? `(+${money(c.extraPrice)})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-gray-500">
            Base: <span className="font-semibold text-gray-700">{money(selectedVersion?.price ?? priceStart ?? 0)}</span>{" "}
            • Extra cor: <span className="font-semibold text-gray-700">{money(selectedColor?.extraPrice ?? 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PÁGINA PRINCIPAL
========================================================= */
export default function AdminHyundaiVehicleCreatePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"basic" | "versions" | "colors" | "specs">("basic");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [modelName, setModelName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");

  const [vehicleImageUrl, setVehicleImageUrl] = useState<string>("");
  const [catalogCoverUrl, setCatalogCoverUrl] = useState<string>("");

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [priceStart, setPriceStart] = useState<number>(0);

  const [versions, setVersions] = useState<VersionItem[]>([
    {
      id: uid("v"),
      title: "Comfort",
      subtitle: "1.0 TGDI",
      price: 129990,
      note: "",
      heroLabel: "Exterior",
      cover_image_url: "",
      spec_groups: [{ id: uid("s"), title: "ESTILO EXTERIOR (Comfort)", description: "", items: ["Faróis em LED"] }],
      highlights: ["Garantia de fábrica"],
      colors: [{ id: uid("c"), name: "Branco", internal: "", extraPrice: 0, swatch: "#F2F2F2", image_url: "" }],
    },
  ]);

  const computedSlug = useMemo(() => slugify(slug || modelName), [slug, modelName]);

  const uploadBaseFolder = useMemo(() => `hyundai/${computedSlug || "sem-slug"}`, [computedSlug]);

  // ✅ versão selecionada para editar Specs e Cores
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");

  useEffect(() => {
    if (!selectedVersionId && versions[0]?.id) setSelectedVersionId(versions[0].id);
  }, [versions, selectedVersionId]);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) || versions[0] || null,
    [versions, selectedVersionId]
  );

  /* ============ HELPERS para setar dentro da versão selecionada ============ */
  function setSelectedSpecGroups(next: SpecGroup[] | ((prev: SpecGroup[]) => SpecGroup[])) {
    const vid = selectedVersion?.id;
    if (!vid) return;
    setVersions((prev) =>
      prev.map((v) => {
        if (v.id !== vid) return v;
        const prevGroups = Array.isArray(v.spec_groups) ? v.spec_groups : [];
        const nextGroups = typeof next === "function" ? next(prevGroups) : next;
        return { ...v, spec_groups: nextGroups };
      })
    );
  }

  function setSelectedHighlights(next: string[] | ((prev: string[]) => string[])) {
    const vid = selectedVersion?.id;
    if (!vid) return;
    setVersions((prev) =>
      prev.map((v) => {
        if (v.id !== vid) return v;
        const prevH = Array.isArray(v.highlights) ? v.highlights : [];
        const nextH = typeof next === "function" ? next(prevH) : next;
        return { ...v, highlights: nextH };
      })
    );
  }

  function setSelectedColors(next: ColorVariant[] | ((prev: ColorVariant[]) => ColorVariant[])) {
    const vid = selectedVersion?.id;
    if (!vid) return;
    setVersions((prev) =>
      prev.map((v) => {
        if (v.id !== vid) return v;
        const prevC = Array.isArray(v.colors) ? v.colors : [];
        const nextC = typeof next === "function" ? next(prevC) : next;
        return { ...v, colors: nextC };
      })
    );
  }

  const selectedSpecGroups = useMemo(
    () => (Array.isArray(selectedVersion?.spec_groups) ? selectedVersion!.spec_groups! : []),
    [selectedVersion]
  );

  const selectedHighlights = useMemo(
    () => (Array.isArray(selectedVersion?.highlights) ? selectedVersion!.highlights! : []),
    [selectedVersion]
  );

  const selectedColors = useMemo(
    () => (Array.isArray(selectedVersion?.colors) ? selectedVersion!.colors! : []),
    [selectedVersion]
  );

  /* =========================================================
     LISTA de veículos existentes (Hyundai)
  ========================================================= */
  const [existingVehicles, setExistingVehicles] = useState<
    Array<Pick<VehicleRow, "id" | "model_name" | "slug" | "is_visible" | "price_start" | "image_url" | "catalog_cover_url">>
  >([]);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingQuery, setExistingQuery] = useState("");

  async function fetchExisting() {
    setExistingLoading(true);
    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, model_name, slug, is_visible, price_start, image_url, catalog_cover_url")
        .eq("brand", "hyundai")
        .order("id", { ascending: false });

      if (error) throw error;
      setExistingVehicles((data as any) || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setExistingLoading(false);
    }
  }

  useEffect(() => {
    fetchExisting();
  }, []);

  const filteredExisting = useMemo(() => {
    const q = existingQuery.trim().toLowerCase();
    if (!q) return existingVehicles;
    return existingVehicles.filter(
      (v) => String(v.model_name || "").toLowerCase().includes(q) || String(v.slug || "").toLowerCase().includes(q)
    );
  }, [existingVehicles, existingQuery]);

  async function loadVehicleToEdit(id: number) {
    setErr(null);
    setExistingLoading(true);
    try {
      const { data, error } = await supabase.from("vehicles").select("*").eq("id", id).single();
      if (error) throw error;

      const row = data as VehicleRow;

      setEditingId(row.id);
      setModelName(row.model_name || "");
      setSlug(row.slug || "");
      setVehicleImageUrl(row.image_url || "");
      setCatalogCoverUrl(row.catalog_cover_url || "");
      setIsVisible(Boolean(row.is_visible ?? true));
      setPriceStart(Number(row.price_start || 0));

      const vrsRaw = Array.isArray(row.versions) ? (row.versions as any as VersionItem[]) : [];
      const normalized: VersionItem[] = vrsRaw.map((v) => ({
        ...v,
        cover_image_url: (v as any).cover_image_url || "",
        spec_groups: Array.isArray(v.spec_groups) ? v.spec_groups : [],
        highlights: Array.isArray((v as any).highlights) ? (v as any).highlights : [],
        colors: Array.isArray((v as any).colors) ? (v as any).colors : [],
      }));

      // ✅ compat: se existirem highlights no veículo e nenhuma versão tiver, joga na primeira
      const oldVehicleHighlights = Array.isArray(row.highlights) ? row.highlights : [];
      const hasAnyVHighlights = normalized.some((x) => Array.isArray(x.highlights) && x.highlights.length > 0);
      if (!hasAnyVHighlights && oldVehicleHighlights.length > 0 && normalized[0]) {
        normalized[0] = { ...normalized[0], highlights: oldVehicleHighlights };
      }

      // ✅ compat: se existirem colors no veículo (legado) e nenhuma versão tiver colors, joga na primeira
      const oldVehicleColors = Array.isArray(row.colors) ? row.colors : [];
      const hasAnyVColors = normalized.some((x) => Array.isArray(x.colors) && x.colors.length > 0);
      if (!hasAnyVColors && oldVehicleColors.length > 0 && normalized[0]) {
        normalized[0] = { ...normalized[0], colors: oldVehicleColors };
      }

      // ✅ se ainda assim ficar sem cor, garante um default na primeira
      if (normalized[0] && (!normalized[0].colors || normalized[0].colors.length === 0)) {
        normalized[0] = {
          ...normalized[0],
          colors: [{ id: uid("c"), name: "Branco", internal: "", extraPrice: 0, swatch: "#F2F2F2", image_url: "" }],
        };
      }

      setVersions(normalized);
      setSelectedVersionId(normalized[0]?.id || "");

      setActiveTab("basic");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar veículo.");
    } finally {
      setExistingLoading(false);
    }
  }

  async function deleteVehicle(id: number) {
    const ok = window.confirm("Tem certeza que deseja deletar este veículo?");
    if (!ok) return;

    setExistingLoading(true);
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      if (editingId === id) resetForm();
      await fetchExisting();
    } catch (e: any) {
      setErr(e?.message || "Erro ao deletar veículo.");
    } finally {
      setExistingLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setModelName("");
    setSlug("");
    setVehicleImageUrl("");
    setCatalogCoverUrl("");
    setIsVisible(true);
    setPriceStart(0);

    const firstVersionId = uid("v");
    const nextVersions: VersionItem[] = [
      {
        id: firstVersionId,
        title: "Comfort",
        subtitle: "1.0 TGDI",
        price: 129990,
        note: "",
        heroLabel: "Exterior",
        cover_image_url: "",
        spec_groups: [{ id: uid("s"), title: "ESTILO EXTERIOR (Comfort)", description: "", items: ["Faróis em LED"] }],
        highlights: ["Garantia de fábrica"],
        colors: [{ id: uid("c"), name: "Branco", internal: "", extraPrice: 0, swatch: "#F2F2F2", image_url: "" }],
      },
    ];
    setVersions(nextVersions);
    setSelectedVersionId(firstVersionId);
    setActiveTab("basic");
  }

  async function handleUploadVehicleImage(file: File | null) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const folder = `${uploadBaseFolder}/vehicle/main`;
      const url = await uploadImageToSupabase(file, folder);
      setVehicleImageUrl(url);
    } catch (e: any) {
      setErr(e?.message || "Erro ao fazer upload da imagem do modelo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleUploadCatalogCover(file: File | null) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const folder = `${uploadBaseFolder}/vehicle/catalog-cover`;
      const url = await uploadImageToSupabase(file, folder);
      setCatalogCoverUrl(url);
    } catch (e: any) {
      setErr(e?.message || "Erro ao fazer upload da capa do catálogo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setErr(null);
    const finalSlug = computedSlug;

    if (!modelName.trim()) return setErr("Informe o nome do modelo.");
    if (!finalSlug) return setErr("Slug inválido.");
    if (versions.length === 0) return setErr("Cadastre ao menos 1 versão.");

    // valida versões e cores por versão
    for (const v of versions) {
      if (!v.title?.trim()) return setErr("Existe uma versão sem título.");
      if (!Number.isFinite(Number(v.price))) return setErr("Existe uma versão com preço inválido.");
      if (!Array.isArray(v.spec_groups)) return setErr("Existe uma versão com spec_groups inválido.");
      if (!Array.isArray(v.highlights)) return setErr("Existe uma versão com highlights inválido.");
      if (!Array.isArray(v.colors)) return setErr("Existe uma versão com colors inválido.");
      if (v.colors.length === 0) return setErr(`A versão "${v.title}" está sem cores. Cadastre ao menos 1 cor nela.`);
      for (const c of v.colors) {
        if (!c.name?.trim()) return setErr(`Na versão "${v.title}" existe uma cor sem nome.`);
        if (!c.swatch?.trim()) return setErr(`Na versão "${v.title}" existe uma cor sem swatch (hex).`);
      }
    }

    setSaving(true);
    try {
      const dupQuery = supabase.from("vehicles").select("id").eq("brand", "hyundai").eq("slug", finalSlug);

      const { data: existing, error: exErr } = editingId
        ? await dupQuery.neq("id", editingId).maybeSingle()
        : await dupQuery.maybeSingle();

      if (exErr) throw exErr;
      if (existing?.id) throw new Error("Já existe um veículo Hyundai com esse slug.");

      const normalizedVersions: VersionItem[] = versions.map((v) => ({
        ...v,
        cover_image_url: v.cover_image_url || "",
        spec_groups: Array.isArray(v.spec_groups) ? v.spec_groups : [],
        highlights: Array.isArray(v.highlights) ? v.highlights : [],
        colors: Array.isArray(v.colors) ? v.colors : [],
      }));

      const payload: any = {
        brand: "hyundai",
        model_name: modelName.trim(),
        slug: finalSlug,

        image_url: vehicleImageUrl?.trim() || null,
        catalog_cover_url: catalogCoverUrl?.trim() || null,

        is_visible: isVisible,
        price_start: Number(priceStart || 0),

        versions: normalizedVersions,

        // ✅ agora NÃO usamos mais "colors" no veículo (zera pra evitar confusão)
        colors: [],

        // legado
        spec_groups: [],
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("vehicles")
          .update(payload)
          .eq("id", editingId)
          .select("slug")
          .single();
        if (error) throw error;

        await fetchExisting();
        router.push(`/hyundai/veiculos/${data.slug}`);
      } else {
        const { data, error } = await supabase.from("vehicles").insert(payload).select("slug").single();
        if (error) throw error;

        await fetchExisting();
        router.push(`/hyundai/veiculos/${data.slug}`);
      }
    } catch (e: any) {
      setErr(e?.message || "Erro ao salvar veículo.");
    } finally {
      setSaving(false);
    }
  }

  // upload folder de cores depende da versão selecionada
  const uploadFolderForSelectedVersionColors = useMemo(() => {
    const vid = selectedVersion?.id || "sem-versao";
    return `${uploadBaseFolder}/versions/${vid}/colors`;
  }, [uploadBaseFolder, selectedVersion?.id]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-32 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* topo */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Link href="/admin/cars/hyundai" className="text-xs font-bold text-gray-600 hover:underline">
              ‹ Voltar (Admin Hyundai)
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mt-2">
              {editingId ? "Editar Veículo • Hyundai" : "Criador de Veículo • Hyundai"}
            </h1>

            {err ? <div className="mt-3 text-sm font-bold text-red-600">{err}</div> : null}

            <div className="mt-2 text-[11px] text-gray-500">
              Bucket atual: <span className="font-semibold">{BUCKET_NAME}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="gray" onClick={() => router.push("/admin/cars/hyundai")}>
              Cancelar
            </Button>

            {editingId ? (
              <Button type="button" variant="gray" onClick={resetForm} icon={<RefreshCw size={14} />}>
                Novo
              </Button>
            ) : null}

            <Button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              icon={saving ? null : <Save size={14} />}
            >
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar veículo"}
            </Button>
          </div>
        </div>

        {/* lista cadastrados */}
        <div className="mb-8">
          <Card
            title="Veículos Hyundai já cadastrados"
            icon={<CarFront size={16} />}
            right={
              <div className="flex items-center gap-2">
                <Input
                  value={existingQuery}
                  onChange={(e) => setExistingQuery(e.target.value)}
                  placeholder="Buscar por modelo ou slug..."
                  className="w-[260px] mt-0"
                />
                <Button type="button" variant="gray" onClick={fetchExisting} icon={<RefreshCw size={14} />} disabled={existingLoading}>
                  Atualizar
                </Button>
              </div>
            }
          >
            <div className="text-[11px] text-gray-500 mb-3">
              Total: <span className="font-semibold">{existingVehicles.length}</span> • Mostrando:{" "}
              <span className="font-semibold">{filteredExisting.length}</span>
            </div>

            {existingLoading ? (
              <div className="text-sm text-gray-500">Carregando...</div>
            ) : filteredExisting.length === 0 ? (
              <div className="text-sm text-gray-500">Nenhum veículo encontrado.</div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-[10px] font-bold uppercase text-gray-500">
                  <div className="col-span-5">Modelo</div>
                  <div className="col-span-4">Slug</div>
                  <div className="col-span-1 text-center">Vis.</div>
                  <div className="col-span-2 text-right">Ações</div>
                </div>

                {filteredExisting.map((v) => (
                  <div key={v.id} className="grid grid-cols-12 px-4 py-3 border-t border-gray-200 items-center">
                    <div className="col-span-5 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{v.model_name}</div>
                      <div className="text-xs text-gray-500">{v.price_start ? money(Number(v.price_start || 0)) : "—"}</div>
                    </div>
                    <div className="col-span-4 min-w-0">
                      <div className="text-xs font-mono text-gray-700 truncate">{v.slug}</div>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className={["text-xs font-bold", v.is_visible ? "text-green-700" : "text-red-700"].join(" ")}>
                        {v.is_visible ? "ON" : "OFF"}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <Button type="button" variant="gray" onClick={() => loadVehicleToEdit(v.id)} icon={<Pencil size={14} />}>
                        Editar
                      </Button>
                      <a
                        href={`/hyundai/veiculos/${v.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide bg-gray-100 hover:bg-gray-200 text-gray-900 inline-flex items-center gap-2"
                        title="Abrir no site"
                      >
                        <ExternalLink size={14} />
                        Abrir
                      </a>
                      <Button type="button" variant="danger" onClick={() => deleteVehicle(v.id)} icon={<Trash2 size={14} />}>
                        Del.
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* tabs */}
        <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex flex-wrap justify-center gap-1 mb-8">
          {(["basic", "versions", "colors", "specs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={[
                "px-6 py-2 rounded-full text-sm font-bold transition-all",
                activeTab === t ? "bg-black text-white shadow" : "text-gray-500 hover:text-black",
              ].join(" ")}
            >
              {t === "basic"
                ? "Básico"
                : t === "versions"
                ? "Versões + Capas"
                : t === "colors"
                ? "Cores (por versão)"
                : "Especificações + Destaques (por versão)"}
            </button>
          ))}
        </div>

        {/* layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* esquerda */}
          <div className="lg:col-span-7 space-y-6">
            {activeTab === "basic" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card title="Dados do veículo" icon={<CarFront size={16} />}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label>Modelo (model_name)</Label>
                      <Input value={modelName} onChange={(e) => setModelName(e.target.value)} placeholder="Ex: Creta 2026" />
                    </div>

                    <div>
                      <Label>Preço inicial (price_start)</Label>
                      <Input
                        type="number"
                        value={Number(priceStart || 0)}
                        onChange={(e) => setPriceStart(Number(e.target.value || 0))}
                        placeholder="129990"
                      />
                      <div className="text-[11px] text-gray-500 mt-1">
                        Preview: <span className="font-semibold">{money(priceStart || 0)}</span>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label>Slug (slug)</Label>
                      <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} placeholder={slugify(modelName) || "ex: creta-2026"} />
                      <div className="text-[11px] text-gray-500 mt-1">
                        Gerado automaticamente: <span className="font-mono font-bold">{computedSlug || "—"}</span>
                      </div>
                    </div>

                    <div>
                      <Label>Visibilidade (is_visible)</Label>
                      <ToggleVisible value={isVisible} onChange={setIsVisible} />
                    </div>

                    {/* imagem fallback do modelo */}
                    <div className="md:col-span-3">
                      <Label>Imagem fallback do modelo (image_url)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <div className="md:col-span-2">
                          <Input value={vehicleImageUrl} onChange={(e) => setVehicleImageUrl(e.target.value)} placeholder="(preenchido automaticamente ao fazer upload)" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="w-full cursor-pointer">
                            <div className="w-full h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold uppercase tracking-wide inline-flex items-center justify-center gap-2">
                              <UploadCloud size={14} />
                              {uploading ? "Enviando..." : "Upload"}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                (e.target as any).value = "";
                                handleUploadVehicleImage(f);
                              }}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      </div>

                      {vehicleImageUrl ? (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-2">
                          <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Preview</div>
                          <img src={vehicleImageUrl} alt="Imagem do modelo" className="w-full h-48 object-contain" />
                        </div>
                      ) : null}

                      <div className="mt-2 text-[11px] text-gray-500">
                        Agora a ordem de imagem é: <span className="font-semibold">cor</span> → <span className="font-semibold">capa da versão</span> → <span className="font-semibold">fallback do modelo</span>.
                      </div>
                    </div>

                    {/* capa catálogo */}
                    <div className="md:col-span-3">
                      <Label>Capa do catálogo (catalog_cover_url)</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <div className="md:col-span-2">
                          <Input value={catalogCoverUrl} onChange={(e) => setCatalogCoverUrl(e.target.value)} placeholder="(preenchido automaticamente ao fazer upload)" />
                        </div>
                        <div className="md:col-span-1">
                          <label className="w-full cursor-pointer">
                            <div className="w-full h-10 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold uppercase tracking-wide inline-flex items-center justify-center gap-2">
                              <UploadCloud size={14} />
                              {uploading ? "Enviando..." : "Upload"}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0] || null;
                                (e.target as any).value = "";
                                handleUploadCatalogCover(f);
                              }}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                      </div>

                      {catalogCoverUrl ? (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-2">
                          <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Preview</div>
                          <img src={catalogCoverUrl} alt="Capa do catálogo" className="w-full h-48 object-cover rounded-lg" />
                        </div>
                      ) : null}
                    </div>

                    <div className="md:col-span-3 text-[11px] text-gray-500">
                      ✅ Agora: <span className="font-semibold">cores são por versão</span> (
                      <span className="font-semibold">versions[].colors</span>) e cada versão tem{" "}
                      <span className="font-semibold">cover_image_url</span>.
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "versions" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <VersionsEditor
                  versions={versions}
                  setVersions={setVersions}
                  uploadBaseFolder={uploadBaseFolder}
                  onUploadBusyChange={setUploading}
                />
              </div>
            )}

            {activeTab === "colors" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card title="Escolha a versão para editar as cores" icon={<Palette size={16} />}>
                  <Label>Versão</Label>
                  <select
                    className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm"
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} — {money(v.price || 0)}
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-gray-500 mt-2">
                    Editando cores da versão: <span className="font-semibold">{selectedVersion?.title || "—"}</span>
                  </div>
                </Card>

                <ColorsEditor
                  colors={selectedColors}
                  setColors={setSelectedColors}
                  uploadFolder={uploadFolderForSelectedVersionColors}
                  onUploadBusyChange={setUploading}
                />
              </div>
            )}

            {activeTab === "specs" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card title="Escolha a versão para editar" icon={<Settings size={16} />}>
                  <Label>Versão</Label>
                  <select
                    className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm"
                    value={selectedVersionId}
                    onChange={(e) => setSelectedVersionId(e.target.value)}
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} — {money(v.price || 0)}
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] text-gray-500 mt-2">
                    Você está editando: <span className="font-semibold">{selectedVersion?.title || "—"}</span>
                  </div>
                </Card>

                <SpecGroupsEditor specGroups={selectedSpecGroups} setSpecGroups={setSelectedSpecGroups} />

                <VersionHighlightsEditor
                  highlights={selectedHighlights}
                  setHighlights={setSelectedHighlights}
                  versionTitle={selectedVersion?.title}
                />
              </div>
            )}
          </div>

          {/* direita */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">
              <Preview modelName={modelName} vehicleImageUrl={vehicleImageUrl} priceStart={priceStart} versions={versions} />

              <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="text-[10px] font-bold uppercase text-gray-500">Checklist rápido</div>
                <div className="mt-2 space-y-1 text-xs text-gray-700">
                  <div>
                    • Modelo: <span className="font-semibold">{modelName?.trim() ? "OK" : "Falta"}</span>
                  </div>
                  <div>
                    • Slug: <span className="font-semibold">{computedSlug ? "OK" : "Falta"}</span>
                  </div>
                  <div>
                    • Versões: <span className="font-semibold">{versions.length}</span>
                  </div>
                  <div>
                    • Versão selecionada: <span className="font-semibold">{selectedVersion?.title || "—"}</span>
                  </div>
                  <div>
                    • Cores da versão: <span className="font-semibold">{selectedColors.length}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="gray" onClick={() => setActiveTab("versions")} icon={<ImageIcon size={14} />}>
                    Capas
                  </Button>
                  <Button type="button" variant="gray" onClick={() => setActiveTab("colors")} icon={<Palette size={14} />}>
                    Cores
                  </Button>
                  <Button type="button" variant="gray" onClick={() => setActiveTab("specs")} icon={<Sparkles size={14} />}>
                    Specs
                  </Button>
                </div>

                <div className="mt-3 text-[11px] text-gray-500">
                  Dica: suba PNG transparente para cada cor em cada versão (fica perfeito no preview).
                </div>

                <div className="mt-3 text-[11px] text-gray-500">
                  Bucket atual: <span className="font-semibold">{BUCKET_NAME}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* footer ações */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Azul Hyundai:{" "}
            <span className="font-semibold" style={{ color: HY_BLUE }}>
              {HY_BLUE}
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="gray" onClick={() => router.push("/admin/cars/hyundai")}>
              Voltar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || uploading} icon={<Save size={14} />}>
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar veículo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}