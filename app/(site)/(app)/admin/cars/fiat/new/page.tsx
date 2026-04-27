"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
const FIAT_RED = "#ff1435";
const FIAT_DARK = "#120b1d";

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

function createDefaultColor(): FiatOptionItem {
  return {
    id: uid("color"),
    name: "Preto Vulcano",
    description: "Cor sólida clássica, elegante e esportiva.",
    category: "Sólidas",
    price: 0,
    image: "",
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
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-slate-900">
            {icon}
            {title}
          </h2>
        </div>
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
  const router = useRouter();

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

  const previewVersion = versions[0];
  const previewColor = colors[0];
  const previewImage =
    previewColor?.image || previewVersion?.image || mainImage || catalogCover || "";

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

  function resetForm() {
    setEditingId(null);
    setModelName("");
    setSlug("");
    setTitle("");
    setDescription("");
    setMainImage("");
    setCatalogCover("");
    setPriceStart(119990);
    setIsVisible(true);
    setVersions([createDefaultVersion()]);
    setColors([createDefaultColor()]);
    setKits([createDefaultKit()]);
    setAccessories([createDefaultAccessory()]);
    setActiveTab("basic");
    setErr(null);
  }

  async function handleUpload(file: File | null, target: string, setter: (v: string) => void) {
    if (!file) return;
    setUploading(true);
    setErr(null);

    try {
      const url = await uploadImageToSupabase(file, `${uploadBaseFolder}/${target}`);
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

      setEditingId(row.id);
      setModelName(row.model_name || "");
      setSlug(row.slug || "");
      setTitle(row.title || "");
      setDescription(row.description || "");
      setMainImage(row.image_url || "");
      setCatalogCover(row.catalog_cover_url || "");
      setPriceStart(Number(row.price_start || 0));
      setIsVisible(Boolean(row.is_visible ?? true));

      setVersions(
        Array.isArray(row.versions) && row.versions.length
          ? row.versions
          : [createDefaultVersion()]
      );

      setColors(
        Array.isArray(row.colors) && row.colors.length
          ? row.colors
          : [createDefaultColor()]
      );

      setKits(
        Array.isArray(row.kits) && row.kits.length
          ? row.kits
          : [createDefaultKit()]
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
      if (!v.description.trim())
        return setErr(`A versão "${v.name}" está sem descrição.`);
      if (!v.image.trim()) return setErr(`A versão "${v.name}" está sem imagem.`);
    }

    for (const c of colors) {
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
      if (duplicate?.id) throw new Error("Já existe um veículo Fiat com esse slug.");

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
    setVersions((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateColor(id: string, patch: Partial<FiatOptionItem>) {
    setColors((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateKit(id: string, patch: Partial<FiatOptionItem>) {
    setKits((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function updateAccessory(id: string, patch: Partial<FiatOptionItem>) {
    setAccessories((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
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
              Cadastre aqui todos os dados que o builder Fiat precisa: nome, slug,
              título, descrição, imagem principal, capa do catálogo, versões, cores,
              kits opcionais e acessórios.
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
              {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar Fiat"}
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
            <div className="text-sm text-slate-500">Nenhum veículo Fiat cadastrado.</div>
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
                      {vehicle.price_start ? money(Number(vehicle.price_start)) : "—"}
                    </div>
                  </div>

                  <div className="truncate font-mono text-xs text-slate-600 md:col-span-4">
                    {vehicle.slug}
                  </div>

                  <div className="text-xs font-black md:col-span-1 md:text-center">
                    <span className={vehicle.is_visible ? "text-green-700" : "text-red-700"}>
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
          <div className="space-y-6 lg:col-span-7">
            {activeTab === "basic" && (
              <Card title="Dados principais do veículo" icon={<CarFront size={16} />}>
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
                      onChange={(e) => setPriceStart(Number(e.target.value || 0))}
                      placeholder="119990"
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      Preview: <span className="font-bold">{money(priceStart)}</span>
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
                        {isVisible ? <CheckCircle2 size={16} /> : <EyeOff size={16} />}
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
                    onUpload={(file) => handleUpload(file, "vehicle/main", setMainImage)}
                    uploading={uploading}
                  />

                  <UploadField
                    label="Imagem/capa do catálogo"
                    value={catalogCover}
                    onChange={setCatalogCover}
                    onUpload={(file) =>
                      handleUpload(file, "vehicle/catalog-cover", setCatalogCover)
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
                    onClick={() => setVersions((prev) => [...prev, createDefaultVersion()])}
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
                          onClick={() =>
                            setVersions((prev) => prev.filter((item) => item.id !== version.id))
                          }
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                          <Label>Nome da versão</Label>
                          <Input
                            value={version.name}
                            onChange={(e) =>
                              updateVersion(version.id, { name: e.target.value })
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
                          onChange={(value) => updateVersion(version.id, { image: value })}
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
                title="Cores do veículo"
                icon={<Palette size={16} />}
                right={
                  <Button
                    type="button"
                    variant="fiat"
                    icon={<Plus size={14} />}
                    onClick={() => setColors((prev) => [...prev, createDefaultColor()])}
                  >
                    Adicionar cor
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {colors.map((color) => (
                    <OptionEditor
                      key={color.id}
                      label="Cor"
                      item={color}
                      uploading={uploading}
                      showCategory
                      onChange={(patch) => updateColor(color.id, patch)}
                      onRemove={() =>
                        setColors((prev) => prev.filter((item) => item.id !== color.id))
                      }
                      onUpload={(file) =>
                        handleUpload(file, `colors/${color.id}`, (url) =>
                          updateColor(color.id, { image: url })
                        )
                      }
                    />
                  ))}
                </div>
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
                        setKits((prev) => prev.filter((item) => item.id !== kit.id))
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
                  <Button
                    type="button"
                    variant="fiat"
                    icon={<Plus size={14} />}
                    onClick={() =>
                      setAccessories((prev) => [...prev, createDefaultAccessory()])
                    }
                  >
                    Adicionar acessório
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {accessories.map((accessory) => (
                    <OptionEditor
                      key={accessory.id}
                      label="Acessório"
                      item={accessory}
                      uploading={uploading}
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
                  <ChecklistLine label="Descrição" ok={Boolean(description.trim())} />
                  <ChecklistLine label="Imagem principal" ok={Boolean(mainImage.trim())} />
                  <ChecklistLine label="Versões" ok={versions.length > 0} />
                  <ChecklistLine label="Cores" ok={colors.length > 0} />
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
                {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Salvar veículo Fiat"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-b-0">
      <span>{label}</span>
      <span className={ok ? "font-black text-green-700" : "font-black text-red-700"}>
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
  onChange,
  onRemove,
  onUpload,
}: {
  label: string;
  item: FiatOptionItem;
  uploading: boolean;
  showCategory?: boolean;
  onChange: (patch: Partial<FiatOptionItem>) => void;
  onRemove: () => void;
  onUpload: (file: File | null) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-[10px] font-black uppercase text-slate-400">{label}</div>
          <div className="font-black text-slate-900">{item.name || "Sem nome"}</div>
          <div className="text-xs text-slate-500">{money(item.price)}</div>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {item.image ? (
        <div className="border-y border-slate-200 bg-white p-2">
          <img src={item.image} alt={item.name} className="h-36 w-full object-contain" />
        </div>
      ) : (
        <div className="flex h-28 items-center justify-center border-y border-slate-200 bg-white text-xs font-black text-slate-300">
          Sem imagem
        </div>
      )}

      <div className="space-y-3 p-4">
        <div>
          <Label>Nome</Label>
          <Input value={item.name} onChange={(e) => onChange({ name: e.target.value })} />
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