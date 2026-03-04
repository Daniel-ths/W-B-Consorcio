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
} from "lucide-react";

/* =========================================================
   TIPOS (versions agora contém spec_groups!)
========================================================= */
type SpecGroup = {
  id: string;
  title: string;
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

  // ✅ ESPECIFICAÇÕES POR VERSÃO
  spec_groups?: SpecGroup[];
};

type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPrice?: number;
  swatch: string;
  image_url: string;
};

type VehicleRow = {
  id: number;
  model_name: string;
  slug: string;

  image_url?: string | null;
  catalog_cover_url?: string | null;

  brand?: string | null;
  is_visible?: boolean | null;
  price_start?: number | null;

  versions?: VersionItem[] | null;
  colors?: ColorVariant[] | null;
  highlights?: string[] | null;

  // (mantido por compatibilidade, mas NÃO vamos mais editar aqui)
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
const BUCKET_NAME = "cars"; // crie esse bucket OU troque pro nome real

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
        `Bucket "${BUCKET_NAME}" não existe no Supabase Storage. Crie esse bucket (Storage > New bucket) ou troque BUCKET_NAME para o nome correto.`
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
   SPEC GROUPS EDITOR (reutilizável) — usado POR VERSÃO
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
                  <ChevronDown size={18} className={["transition-transform", opened ? "rotate-180" : "rotate-0"].join(" ")} />
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
   EDITORES (VERSÕES agora incluem spec_groups)
========================================================= */
function VersionsEditor({
  versions,
  setVersions,
}: {
  versions: VersionItem[];
  setVersions: React.Dispatch<React.SetStateAction<VersionItem[]>>;
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
        spec_groups: [],
      },
    ]);

  const update = (id: string, patch: Partial<VersionItem>) =>
    setVersions((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));

  const remove = (id: string) => setVersions((prev) => prev.filter((v) => v.id !== id));

  return (
    <Card
      title="Versões"
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
                    Specs desta versão:{" "}
                    <span className="font-semibold">{Array.isArray(v.spec_groups) ? v.spec_groups.length : 0}</span>
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
                  <Textarea
                    rows={2}
                    value={v.note || ""}
                    onChange={(e) => update(v.id, { note: e.target.value })}
                    placeholder="Ex: Itens exclusivos desta versão..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

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
      title="Cores"
      icon={<Palette size={16} />}
      right={
        <Button type="button" onClick={add} icon={<Plus size={14} />}>
          Adicionar
        </Button>
      }
    >
      {colors.length === 0 ? (
        <div className="text-sm text-gray-500">Nenhuma cor cadastrada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {colors.map((c) => (
            <div key={c.id} className="bg-gray-50/60 border border-gray-200 rounded-xl overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-gray-900 truncate">{c.name || "Sem nome"}</div>
                  <div className="text-xs text-gray-500">{c.internal ? `Interno: ${c.internal}` : "—"}</div>
                  <div className="text-xs font-bold text-gray-900 mt-1">{c.extraPrice ? `+ ${money(c.extraPrice)}` : "+ R$ 0,00"}</div>
                </div>
                <button type="button" onClick={() => remove(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Remover">
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
                    <Input type="number" value={Number(c.extraPrice || 0)} onChange={(e) => update(c.id, { extraPrice: Number(e.target.value || 0) })} placeholder="0" />
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
                    Vai salvar em Storage e preencher <span className="font-semibold">colors[].image_url</span>.
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

function HighlightsEditor({
  highlights,
  setHighlights,
}: {
  highlights: string[];
  setHighlights: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  return (
    <Card
      title="Destaques"
      icon={<Sparkles size={16} />}
      right={
        <Button type="button" onClick={() => setHighlights((p) => [...p, "Novo destaque"])} icon={<Plus size={14} />}>
          Adicionar
        </Button>
      }
    >
      {highlights.length === 0 ? (
        <div className="text-sm text-gray-500">Sem destaques.</div>
      ) : (
        <div className="space-y-2">
          {highlights.map((h, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <span className="text-gray-300">•</span>
              <Input value={h} onChange={(e) => setHighlights((prev) => prev.map((x, i) => (i === idx ? e.target.value : x)))} placeholder="Ex: Garantia de fábrica" />
              <button type="button" onClick={() => setHighlights((prev) => prev.filter((_, i) => i !== idx))} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Remover">
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
   PREVIEW (sem <style> inline pra não dar hydration)
   Depende do globals.css (hyVeh_heroBg/hyVeh_animImg)
========================================================= */
function Preview({
  modelName,
  imageUrl,
  priceStart,
  versions,
  colors,
}: {
  modelName: string;
  imageUrl: string;
  priceStart: number;
  versions: VersionItem[];
  colors: ColorVariant[];
}) {
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    if (!selectedVersionId && versions[0]?.id) setSelectedVersionId(versions[0].id);
  }, [versions, selectedVersionId]);

  useEffect(() => {
    if (!selectedColorId && colors[0]?.id) setSelectedColorId(colors[0].id);
  }, [colors, selectedColorId]);

  const selectedVersion = useMemo(
    () => versions.find((v) => v.id === selectedVersionId) || versions[0] || null,
    [versions, selectedVersionId]
  );

  const selectedColor = useMemo(
    () => colors.find((c) => c.id === selectedColorId) || colors[0] || null,
    [colors, selectedColorId]
  );

  const currentImageUrl = useMemo(() => selectedColor?.image_url || imageUrl || null, [selectedColor?.image_url, imageUrl]);

  useEffect(() => {
    setImgKey((k) => k + 1);
  }, [selectedColorId]);

  const heroTint = selectedColor?.swatch || "#d8d8d8";

  const totalPrice = useMemo(() => {
    const base = selectedVersion?.price ?? priceStart ?? 0;
    const extra = selectedColor?.extraPrice || 0;
    return base + extra;
  }, [selectedVersion?.price, priceStart, selectedColor?.extraPrice]);

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
          ) : null}
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
            <img key={imgKey} src={currentImageUrl} alt={modelName || "Hyundai"} className="w-[86%] h-[86%] object-contain hyVeh_animImg" draggable={false} />
          ) : (
            <div className="text-xs font-bold text-gray-500">Sem imagem</div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Label>Versão ativa (preview)</Label>
            <select className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm" value={selectedVersionId} onChange={(e) => setSelectedVersionId(e.target.value)}>
              {versions.length === 0 ? <option value="">(sem versões)</option> : null}
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} — {money(v.price || 0)}
                </option>
              ))}
            </select>

            <div className="text-[11px] text-gray-500 mt-2">
              Specs da versão selecionada:{" "}
              <span className="font-semibold">{Array.isArray(selectedVersion?.spec_groups) ? selectedVersion!.spec_groups!.length : 0}</span>
            </div>
          </div>

          <div>
            <Label>Cor ativa (preview)</Label>
            <select className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm" value={selectedColorId} onChange={(e) => setSelectedColorId(e.target.value)}>
              {colors.length === 0 ? <option value="">(sem cores)</option> : null}
              {colors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.extraPrice ? `(+${money(c.extraPrice)})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-gray-500">
            Base: <span className="font-semibold text-gray-700">{money(selectedVersion?.price ?? priceStart ?? 0)}</span> • Extra cor:{" "}
            <span className="font-semibold text-gray-700">{money(selectedColor?.extraPrice ?? 0)}</span>
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

  const [imageUrl, setImageUrl] = useState<string>("");
  const [catalogCoverUrl, setCatalogCoverUrl] = useState<string>("");

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [priceStart, setPriceStart] = useState<number>(0);

  // ✅ versões agora carregam spec_groups individualmente
  const [versions, setVersions] = useState<VersionItem[]>([
    {
      id: uid("v"),
      title: "Comfort",
      subtitle: "1.0 TGDI",
      price: 129990,
      note: "",
      heroLabel: "Exterior",
      spec_groups: [
        { id: uid("s"), title: "ESTILO EXTERIOR (Comfort)", description: "", items: ["Faróis em LED"] },
      ],
    },
  ]);

  const [colors, setColors] = useState<ColorVariant[]>([
    { id: uid("c"), name: "Branco", internal: "", extraPrice: 0, swatch: "#F2F2F2", image_url: "" },
  ]);

  const [highlights, setHighlights] = useState<string[]>(["Garantia de fábrica"]);

  const computedSlug = useMemo(() => slugify(slug || modelName), [slug, modelName]);

  // ✅ aba specs: escolhe qual versão editar
  const [specVersionId, setSpecVersionId] = useState<string>("");

  useEffect(() => {
    if (!specVersionId && versions[0]?.id) setSpecVersionId(versions[0].id);
  }, [versions, specVersionId]);

  const selectedSpecVersion = useMemo(
    () => versions.find((v) => v.id === specVersionId) || versions[0] || null,
    [versions, specVersionId]
  );

  const selectedSpecGroups = useMemo(
    () => (Array.isArray(selectedSpecVersion?.spec_groups) ? selectedSpecVersion!.spec_groups! : []),
    [selectedSpecVersion]
  );

  function setSelectedSpecGroups(nextGroupsOrUpdater: SpecGroup[] | ((prev: SpecGroup[]) => SpecGroup[])) {
    const vid = selectedSpecVersion?.id;
    if (!vid) return;
    setVersions((prev) => {
      const nextGroups = typeof nextGroupsOrUpdater === 'function' 
        ? nextGroupsOrUpdater(selectedSpecVersion?.spec_groups || [])
        : nextGroupsOrUpdater;
      return prev.map((v) => (v.id === vid ? { ...v, spec_groups: nextGroups } : v));
    });
  }

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
      setImageUrl(row.image_url || "");
      setCatalogCoverUrl(row.catalog_cover_url || "");
      setIsVisible(Boolean(row.is_visible ?? true));
      setPriceStart(Number(row.price_start || 0));

      // ✅ carrega versions já com spec_groups dentro
      const vrs = Array.isArray(row.versions) ? (row.versions as any as VersionItem[]) : [];
      setVersions(
        vrs.map((v) => ({
          ...v,
          spec_groups: Array.isArray(v.spec_groups) ? v.spec_groups : [],
        }))
      );

      setColors(Array.isArray(row.colors) ? (row.colors as any) : []);
      setHighlights(Array.isArray(row.highlights) ? (row.highlights as any) : []);

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
    setImageUrl("");
    setCatalogCoverUrl("");
    setIsVisible(true);
    setPriceStart(0);

    const firstVersionId = uid("v");
    setVersions([
      {
        id: firstVersionId,
        title: "Comfort",
        subtitle: "1.0 TGDI",
        price: 129990,
        note: "",
        heroLabel: "Exterior",
        spec_groups: [{ id: uid("s"), title: "ESTILO EXTERIOR (Comfort)", description: "", items: ["Faróis em LED"] }],
      },
    ]);
    setSpecVersionId(firstVersionId);

    setColors([{ id: uid("c"), name: "Branco", internal: "", extraPrice: 0, swatch: "#F2F2F2", image_url: "" }]);
    setHighlights(["Garantia de fábrica"]);

    setActiveTab("basic");
  }

  async function handleUploadMain(file: File | null) {
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const folder = `hyundai/${computedSlug || "sem-slug"}/main`;
      const url = await uploadImageToSupabase(file, folder);
      setImageUrl(url);
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
      const folder = `hyundai/${computedSlug || "sem-slug"}/catalog-cover`;
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
    if (colors.length === 0) return setErr("Cadastre ao menos 1 cor.");

    for (const v of versions) {
      if (!v.title?.trim()) return setErr("Existe uma versão sem título.");
      if (!Number.isFinite(Number(v.price))) return setErr("Existe uma versão com preço inválido.");
      if (!Array.isArray(v.spec_groups)) return setErr("Existe uma versão com spec_groups inválido.");
    }
    for (const c of colors) {
      if (!c.name?.trim()) return setErr("Existe uma cor sem nome.");
      if (!c.swatch?.trim()) return setErr("Existe uma cor sem swatch (hex).");
    }

    setSaving(true);
    try {
      const dupQuery = supabase.from("vehicles").select("id").eq("brand", "hyundai").eq("slug", finalSlug);

      const { data: existing, error: exErr } = editingId
        ? await dupQuery.neq("id", editingId).maybeSingle()
        : await dupQuery.maybeSingle();

      if (exErr) throw exErr;
      if (existing?.id) throw new Error("Já existe um veículo Hyundai com esse slug.");

      // ✅ Normaliza versions com spec_groups sempre array
      const normalizedVersions = versions.map((v) => ({
        ...v,
        spec_groups: Array.isArray(v.spec_groups) ? v.spec_groups : [],
      }));

      const payload = {
        brand: "hyundai",
        model_name: modelName.trim(),
        slug: finalSlug,

        image_url: imageUrl?.trim() || null,
        catalog_cover_url: catalogCoverUrl?.trim() || null,

        is_visible: isVisible,
        price_start: Number(priceStart || 0),

        versions: normalizedVersions, // ✅ specs por versão aqui!
        colors,
        highlights,

        // mantém por compatibilidade (não usamos mais)
        spec_groups: [],
      };

      if (editingId) {
        const { data, error } = await supabase.from("vehicles").update(payload).eq("id", editingId).select("slug").single();
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

  const uploadFolderForColors = useMemo(() => `hyundai/${computedSlug || "sem-slug"}/colors`, [computedSlug]);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-32 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* topo */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Link href="/admin/cars/hyundai" className="text-xs font-bold text-gray-600 hover:underline">
              ‹ Voltar (Admin Hyundai)
            </Link>

            <h1 className="text-2xl font-bold text-gray-900 mt-2">{editingId ? "Editar Veículo • Hyundai" : "Criador de Veículo • Hyundai"}</h1>
            {editingId ? (
              <div className="text-[11px] text-gray-500 mt-1">
                Modo edição: <span className="font-semibold">ID {editingId}</span>
              </div>
            ) : null}

            {err ? <div className="mt-3 text-sm font-bold text-red-600">{err}</div> : null}

            <div className="mt-2 text-[11px] text-gray-500">
               <span className="font-semibold">{BUCKET_NAME}</span>
            </div>

            <div className="mt-2 text-[11px] text-gray-500">
               <span className="font-mono font-semibold"></span>
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

            <Button type="button" onClick={handleSave} disabled={saving || uploading} icon={saving ? null : <Save size={14} />}>
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar veículo"}
            </Button>
          </div>
        </div>

        {/* lista de cadastrados */}
        <div className="mb-8">
          <Card
            title="Veículos Hyundai já cadastrados"
            icon={<CarFront size={16} />}
            right={
              <div className="flex items-center gap-2">
                <Input value={existingQuery} onChange={(e) => setExistingQuery(e.target.value)} placeholder="Buscar por modelo ou slug..." className="w-[260px] mt-0" />
                <Button type="button" variant="gray" onClick={fetchExisting} icon={<RefreshCw size={14} />} disabled={existingLoading}>
                  Atualizar
                </Button>
              </div>
            }
          >
            <div className="text-[11px] text-gray-500 mb-3">
              Total: <span className="font-semibold">{existingVehicles.length}</span> • Mostrando: <span className="font-semibold">{filteredExisting.length}</span>
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
              {t === "basic" ? "Básico" : t === "versions" ? "Versões" : t === "colors" ? "Cores" : "Especificações (por versão)"}
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
                      <Input type="number" value={Number(priceStart || 0)} onChange={(e) => setPriceStart(Number(e.target.value || 0))} placeholder="129990" />
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

                    {/* imagem padrão do modelo */}
                    <div className="md:col-span-3">
                      <Label>Imagem do modelo (image_url)</Label>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <div className="md:col-span-2">
                          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="(preenchido automaticamente ao fazer upload)" />
                        </div>

                        <div className="md:col-span-1">
                          <div className="h-10 flex items-center">
                            <label className="w-full h-10 cursor-pointer">
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
                                  handleUploadMain(f);
                                }}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500 mt-2">
                        Usado quando a cor não tiver <span className="font-semibold">colors[].image_url</span>.
                      </div>

                      {imageUrl ? (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-2">
                          <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Preview</div>
                          <img src={imageUrl} alt="Imagem do modelo" className="w-full h-48 object-contain" />
                        </div>
                      ) : null}
                    </div>

                    {/* capa do catálogo */}
                    <div className="md:col-span-3">
                      <Label>Capa do catálogo (catalog_cover_url)</Label>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                        <div className="md:col-span-2">
                          <Input value={catalogCoverUrl} onChange={(e) => setCatalogCoverUrl(e.target.value)} placeholder="(preenchido automaticamente ao fazer upload)" />
                        </div>

                        <div className="md:col-span-1">
                          <div className="h-10 flex items-center">
                            <label className="w-full h-10 cursor-pointer">
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
                      </div>

                      <div className="text-[11px] text-gray-500 mt-2">
                        Esta imagem é a <span className="font-semibold">capa/thumbnail</span> que aparece no catálogo.
                      </div>

                      {catalogCoverUrl ? (
                        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-2">
                          <div className="text-[10px] font-bold uppercase text-gray-500 mb-2">Preview</div>
                          <img src={catalogCoverUrl} alt="Capa do catálogo" className="w-full h-48 object-cover rounded-lg" />
                        </div>
                      ) : null}
                    </div>

                    <div className="md:col-span-3 text-[11px] text-gray-500">
                      ✅ Ao salvar: <span className="font-semibold">versions[].spec_groups</span> guarda as specs por versão.
                      <br />
                      ✅ Se ainda não existir no banco, crie a coluna: <span className="font-mono font-semibold">catalog_cover_url</span>.
                    </div>
                  </div>
                </Card>

                <HighlightsEditor highlights={highlights} setHighlights={setHighlights} />
              </div>
            )}

            {activeTab === "versions" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <VersionsEditor versions={versions} setVersions={setVersions} />
              </div>
            )}

            {activeTab === "colors" && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <ColorsEditor colors={colors} setColors={setColors} uploadFolder={uploadFolderForColors} onUploadBusyChange={setUploading} />
              </div>
            )}

            {/* ✅ ESPECIFICAÇÕES POR VERSÃO */}
            {activeTab === "specs" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                <Card title="Escolha a versão para editar as especificações" icon={<Settings size={16} />}>
                  <Label>Versão</Label>
                  <select
                    className="w-full mt-1 h-10 px-3 border rounded-lg bg-white text-sm"
                    value={specVersionId}
                    onChange={(e) => setSpecVersionId(e.target.value)}
                  >
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.title} — {money(v.price || 0)}
                      </option>
                    ))}
                  </select>

                  <div className="text-[11px] text-gray-500 mt-2">
                    Você está editando: <span className="font-semibold">{selectedSpecVersion?.title || "—"}</span>
                  </div>
                </Card>

                <SpecGroupsEditor specGroups={selectedSpecGroups} setSpecGroups={setSelectedSpecGroups} />
              </div>
            )}
          </div>

          {/* direita */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-24">
              <Preview modelName={modelName} imageUrl={imageUrl} priceStart={priceStart} versions={versions} colors={colors} />

              <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-4">
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
                    • Cores: <span className="font-semibold">{colors.length}</span>
                  </div>
                  <div>
                    • Capa catálogo: <span className="font-semibold">{catalogCoverUrl ? "OK" : "Opcional"}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button type="button" variant="gray" onClick={() => setActiveTab("versions")} icon={<Settings size={14} />}>
                    Versões
                  </Button>
                  <Button type="button" variant="gray" onClick={() => setActiveTab("colors")} icon={<Palette size={14} />}>
                    Cores
                  </Button>
                  <Button type="button" variant="gray" onClick={() => setActiveTab("specs")} icon={<Settings size={14} />}>
                    Specs
                  </Button>
                </div>

                <div className="mt-3 text-[11px] text-gray-500">
                  Dica: pra ficar perfeito (fundo + troca), suba PNG transparente em cada cor (vai preencher{" "}
                  <span className="font-semibold">colors[].image_url</span>).
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