"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Armchair,
  Camera,
  CarFront,
  CheckCircle2,
  Eye,
  EyeOff,
  ExternalLink,
  Gauge,
  Image as ImageIcon,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  UploadCloud,
} from "lucide-react";

type ViewKey = "front" | "side" | "rear" | "threeQuarter";

type VwViewImages = {
  front: string;
  side: string;
  rear: string;
  threeQuarter: string;
};

type VwVersion = {
  id: string;
  name: string;
  price: number;
  fuel: string;
  transmission: string;
  image: string;
  description: string;
};

type VwMotor = {
  id: string;
  name: string;
  description: string;
  price: number;
  power: string;
  torque: string;
  fuel: string;
  transmission: string;
  traction: string;
  acceleration: string;
  maxSpeed: string;
  consumption: string;
};

type VwColor = {
  id: string;
  name: string;
  type: string;
  price: number;
  hex: string;
  images: VwViewImages;
};

type VwInterior = {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
};

type VwGalleryImage = {
  id: string;
  title: string;
  image: string;
  type: "exterior" | "interior";
};

type VwVehicleRow = {
  id: number;
  brand: string | null;
  model_name: string;
  slug: string;
  full_name?: string | null;
  image_url?: string | null;
  exterior_image_url?: string | null;
  interior_image_url?: string | null;
  catalog_cover_url?: string | null;
  catalog_hover_url?: string | null;
  side_image_url?: string | null;
  is_visible?: boolean | null;
  price_start?: number | null;
  versions?: VwVersion[] | null;
  motors?: VwMotor[] | null;
  colors?: VwColor[] | null;
  interiors?: VwInterior[] | null;
  gallery?: VwGalleryImage[] | null;
};

const BUCKET_NAME = "cars";
const VW_BLUE = "#001e50";

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

function emptyViewImages(): VwViewImages {
  return {
    front: "",
    side: "",
    rear: "",
    threeQuarter: "",
  };
}

function createDefaultVersion(): VwVersion {
  return {
    id: uid("version"),
    name: "T-Cross Extreme 250 TSI",
    price: 179990,
    fuel: "Total Flex",
    transmission: "Automático",
    image: "",
    description:
      "Versão completa com visual esportivo, tecnologia avançada e pacote superior de conforto.",
  };
}

function createDefaultMotor(): VwMotor {
  return {
    id: uid("motor"),
    name: "250 TSI",
    description: "Motor turbo com câmbio automático",
    price: 179990,
    power: "150 cv",
    torque: "25,5 kgfm",
    fuel: "Total Flex",
    transmission: "Automático de 6 velocidades",
    traction: "Tração dianteira",
    acceleration: "0 a 100 km/h em 8,9 s",
    maxSpeed: "205 km/h",
    consumption: "Consumo conforme versão e condução",
  };
}

function createDefaultColor(): VwColor {
  return {
    id: uid("color"),
    name: "Preto Ninja",
    type: "Sólida",
    price: 0,
    hex: "#050505",
    images: emptyViewImages(),
  };
}

function createDefaultInterior(): VwInterior {
  return {
    id: uid("interior"),
    name: "Revestimento em couro sintético",
    price: 0,
    image: "",
    description: "Acabamento interno com visual premium e conforto elevado.",
  };
}

function createDefaultGalleryImage(): VwGalleryImage {
  return {
    id: uid("gallery"),
    title: "Imagem exterior",
    image: "",
    type: "exterior",
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
  variant?: "black" | "gray" | "danger" | "vw";
}) {
  const cls =
    variant === "gray"
      ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "vw"
      ? "bg-[#001e50] text-white hover:bg-[#003b7a]"
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

export default function AdminVolkswagenVehicleCreatePage() {
  const [activeTab, setActiveTab] = useState<
    "basic" | "versions" | "motors" | "colors" | "interiors" | "gallery"
  >("basic");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [modelName, setModelName] = useState("");
  const [slug, setSlug] = useState("");
  const [fullName, setFullName] = useState("");
  const [mainImage, setMainImage] = useState("");
  const [exteriorImage, setExteriorImage] = useState("");
  const [interiorImage, setInteriorImage] = useState("");
  const [sideImage, setSideImage] = useState("");
  const [catalogCover, setCatalogCover] = useState("");
  const [catalogHover, setCatalogHover] = useState("");
  const [priceStart, setPriceStart] = useState(179990);
  const [isVisible, setIsVisible] = useState(true);

  const [versions, setVersions] = useState<VwVersion[]>([
    createDefaultVersion(),
  ]);
  const [motors, setMotors] = useState<VwMotor[]>([createDefaultMotor()]);
  const [colors, setColors] = useState<VwColor[]>([createDefaultColor()]);
  const [interiors, setInteriors] = useState<VwInterior[]>([
    createDefaultInterior(),
  ]);
  const [gallery, setGallery] = useState<VwGalleryImage[]>([
    createDefaultGalleryImage(),
  ]);

  const [existingVehicles, setExistingVehicles] = useState<VwVehicleRow[]>([]);
  const [existingLoading, setExistingLoading] = useState(false);
  const [existingQuery, setExistingQuery] = useState("");

  const computedSlug = useMemo(
    () => slugify(slug || modelName),
    [slug, modelName]
  );

  const uploadBaseFolder = useMemo(
    () => `volkswagen/${computedSlug || "sem-slug"}`,
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
  const previewMotor = motors[0];
  const previewColor = colors[0];
  const previewInterior = interiors[0];

  const previewImage =
    previewColor?.images?.side ||
    sideImage ||
    previewColor?.images?.threeQuarter ||
    previewVersion?.image ||
    exteriorImage ||
    mainImage ||
    catalogCover ||
    "";

  async function fetchExisting() {
    setExistingLoading(true);

    try {
      const { data, error } = await supabase
        .from("vehicles")
        .select(
          "id, brand, model_name, slug, is_visible, price_start, image_url, catalog_cover_url"
        )
        .eq("brand", "volkswagen")
        .order("id", { ascending: false });

      if (error) throw error;

      setExistingVehicles((data as VwVehicleRow[]) || []);
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar veículos Volkswagen.");
    } finally {
      setExistingLoading(false);
    }
  }

  useEffect(() => {
    fetchExisting();
  }, []);

  function resetForm() {
    setEditingId(null);
    setCatalogHover("");
    setModelName("");
    setSlug("");
    setFullName("");
    setMainImage("");
    setExteriorImage("");
    setInteriorImage("");
    setSideImage("");
    setCatalogCover("");
    setPriceStart(179990);
    setIsVisible(true);
    setVersions([createDefaultVersion()]);
    setMotors([createDefaultMotor()]);
    setColors([createDefaultColor()]);
    setInteriors([createDefaultInterior()]);
    setGallery([createDefaultGalleryImage()]);
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

      const row = data as VwVehicleRow;

      setEditingId(row.id);
      setModelName(row.model_name || "");
      setSlug(row.slug || "");
      setFullName(row.full_name || "");
      setMainImage(row.image_url || "");
      setExteriorImage(row.exterior_image_url || "");
      setInteriorImage(row.interior_image_url || "");
      setSideImage(row.side_image_url || "");
      setCatalogCover(row.catalog_cover_url || "");
      setCatalogHover(row.catalog_hover_url || "");
      setPriceStart(Number(row.price_start || 0));
      setIsVisible(Boolean(row.is_visible ?? true));

      setVersions(
        Array.isArray(row.versions) && row.versions.length
          ? row.versions.map((v) => ({
              ...v,
              description: v.description || "",
            }))
          : [createDefaultVersion()]
      );

      setMotors(
        Array.isArray(row.motors) && row.motors.length
          ? row.motors.map((m) => ({
              ...m,
              torque: m.torque || "",
              acceleration: m.acceleration || "",
              maxSpeed: m.maxSpeed || "",
              consumption: m.consumption || "",
            }))
          : [createDefaultMotor()]
      );

      setColors(
        Array.isArray(row.colors) && row.colors.length
          ? row.colors.map((c) => ({
              ...c,
              images: c.images || emptyViewImages(),
            }))
          : [createDefaultColor()]
      );

      setInteriors(
        Array.isArray(row.interiors) && row.interiors.length
          ? row.interiors.map((i) => ({
              ...i,
              description: i.description || "",
            }))
          : [createDefaultInterior()]
      );

      setGallery(
        Array.isArray(row.gallery) && row.gallery.length
          ? row.gallery
          : [createDefaultGalleryImage()]
      );

      setActiveTab("basic");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setErr(e?.message || "Erro ao carregar veículo Volkswagen.");
    } finally {
      setExistingLoading(false);
    }
  }

  async function deleteVehicle(id: number) {
    const ok = window.confirm("Tem certeza que deseja deletar este veículo Volkswagen?");
    if (!ok) return;

    setExistingLoading(true);

    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;

      if (editingId === id) resetForm();
      await fetchExisting();
    } catch (e: any) {
      setErr(e?.message || "Erro ao deletar veículo Volkswagen.");
    } finally {
      setExistingLoading(false);
    }
  }  async function handleSave() {
    setErr(null);

    const finalSlug = computedSlug;

    if (!modelName.trim()) return setErr("Informe o nome do modelo.");
    if (!finalSlug) return setErr("Slug inválido.");
    if (!fullName.trim()) return setErr("Informe o nome completo do veículo.");
    if (!mainImage.trim()) return setErr("Informe ou envie a imagem principal.");
    if (!sideImage.trim()) return setErr("Informe ou envie a imagem lateral padrão.");
    if (versions.length === 0) return setErr("Cadastre ao menos uma versão.");
    if (motors.length === 0) return setErr("Cadastre ao menos um motor.");
    if (colors.length === 0) return setErr("Cadastre ao menos uma cor.");
    if (interiors.length === 0) return setErr("Cadastre ao menos um interior.");

    setSaving(true);

    try {
      const dupQuery = supabase
        .from("vehicles")
        .select("id")
        .eq("brand", "volkswagen")
        .eq("slug", finalSlug);

      const { data: duplicate, error: dupErr } = editingId
        ? await dupQuery.neq("id", editingId).maybeSingle()
        : await dupQuery.maybeSingle();

      if (dupErr) throw dupErr;
      if (duplicate?.id) {
        throw new Error("Já existe um veículo Volkswagen com esse slug.");
      }

      const payload: any = {
        catalog_hover_url: catalogHover.trim() || null,
        brand: "volkswagen",
        model_name: modelName.trim(),
        slug: finalSlug,
        full_name: fullName.trim(),
        image_url: mainImage.trim(),
        exterior_image_url: exteriorImage.trim() || null,
        interior_image_url: interiorImage.trim() || null,
        side_image_url: sideImage.trim(),
        catalog_cover_url: catalogCover.trim() || sideImage.trim(),
        is_visible: isVisible,
        price_start: Number(priceStart || 0),
        versions,
        motors,
        colors,
        interiors,
        gallery,
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
      setErr(e?.message || "Erro ao salvar veículo Volkswagen.");
    } finally {
      setSaving(false);
    }
  }

  function updateVersion(id: string, patch: Partial<VwVersion>) {
    setVersions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateMotor(id: string, patch: Partial<VwMotor>) {
    setMotors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateColor(id: string, patch: Partial<VwColor>) {
    setColors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateColorImage(id: string, view: ViewKey, value: string) {
    setColors((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              images: {
                ...item.images,
                [view]: value,
              },
            }
          : item
      )
    );
  }

  function updateInterior(id: string, patch: Partial<VwInterior>) {
    setInteriors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function updateGallery(id: string, patch: Partial<VwGalleryImage>) {
    setGallery((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
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
              {editingId
                ? "Editar veículo Volkswagen"
                : "Criador avançado Volkswagen"}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Cadastro completo no padrão do configurador Volkswagen: imagem lateral,
              imagens por cor em vários ângulos, versão, motor, interior, galeria e
              valores formatados.
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
              variant="vw"
              onClick={handleSave}
              disabled={saving || uploading}
              icon={<Save size={14} />}
            >
              {saving
                ? "Salvando..."
                : editingId
                ? "Salvar alterações"
                : "Salvar Volkswagen"}
            </Button>
          </div>
        </div>

        <Card
          title="Veículos Volkswagen cadastrados"
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
              Nenhum veículo Volkswagen cadastrado.
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
                      href={`/volkswagen/builder?vehicle=${vehicle.slug}`}
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
            ["motors", "Motor"],
            ["colors", "Cores + ângulos"],
            ["interiors", "Interior"],
            ["gallery", "Galeria"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={[
                "rounded-full px-5 py-2 text-sm font-black transition",
                activeTab === key
                  ? "bg-[#001e50] text-white shadow"
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
                      placeholder="Ex: T-Cross"
                    />
                  </div>

                  <div>
                    <Label>Preço inicial</Label>
                    <Input
                      type="number"
                      value={priceStart}
                      onChange={(e) => setPriceStart(Number(e.target.value || 0))}
                      placeholder="179990"
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
                      placeholder={slugify(modelName) || "t-cross"}
                    />
                    <div className="mt-1 text-[11px] text-slate-500">
                      URL final:{" "}
                      <span className="font-mono font-bold">
                        /volkswagen/builder?vehicle={computedSlug || "—"}
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
                    <Label>Nome completo usado no resumo</Label>
                    <Textarea
                      rows={3}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: T-Cross Extreme 250 TSI Total Flex Automático 2026"
                    />
                  </div>

                  <UploadField
                    label="Imagem principal / hero do builder"
                    value={mainImage}
                    onChange={setMainImage}
                    onUpload={(file) => handleUpload(file, "vehicle/main", setMainImage)}
                    uploading={uploading}
                  />

                  <UploadField
                    label="Imagem lateral padrão do veículo"
                    value={sideImage}
                    onChange={setSideImage}
                    onUpload={(file) =>
                      handleUpload(file, "vehicle/side", setSideImage)
                    }
                    uploading={uploading}
                  />

                  <UploadField
                    label="Imagem exterior padrão"
                    value={exteriorImage}
                    onChange={setExteriorImage}
                    onUpload={(file) =>
                      handleUpload(file, "vehicle/exterior", setExteriorImage)
                    }
                    uploading={uploading}
                  />

                  <UploadField
                    label="Imagem interior padrão"
                    value={interiorImage}
                    onChange={setInteriorImage}
                    onUpload={(file) =>
                      handleUpload(file, "vehicle/interior", setInteriorImage)
                    }
                    uploading={uploading}
                    cover
                  />

<UploadField
  label="Imagem/capa do catálogo"
  value={catalogCover}
  onChange={setCatalogCover}
  onUpload={(file) =>
    handleUpload(file, "vehicle/catalog-cover", setCatalogCover)
  }
  uploading={uploading}
/>

<UploadField
  label="Imagem do catálogo ao passar o mouse"
  value={catalogHover}
  onChange={setCatalogHover}
  onUpload={(file) =>
    handleUpload(file, "vehicle/catalog-hover", setCatalogHover)
  }
  uploading={uploading}
/>
                </div>
              </Card>
            )}

            {activeTab === "versions" && (
              <Card
                title="Versões do Volkswagen"
                icon={<Settings size={16} />}
                right={
                  <Button
                    type="button"
                    variant="vw"
                    icon={<Plus size={14} />}
                    onClick={() =>
                      setVersions((prev) => [...prev, createDefaultVersion()])
                    }
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
                            {money(version.price)} • {version.fuel} •{" "}
                            {version.transmission}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setVersions((prev) =>
                              prev.filter((item) => item.id !== version.id)
                            )
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
                            placeholder="Ex: T-Cross Extreme 250 TSI"
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
                          <Label>Preço formatado</Label>
                          <div className="mt-1 flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-900">
                            {money(version.price)}
                          </div>
                        </div>

                        <div>
                          <Label>Combustível</Label>
                          <Input
                            value={version.fuel}
                            onChange={(e) =>
                              updateVersion(version.id, { fuel: e.target.value })
                            }
                            placeholder="Total Flex"
                          />
                        </div>

                        <div>
                          <Label>Transmissão</Label>
                          <Input
                            value={version.transmission}
                            onChange={(e) =>
                              updateVersion(version.id, {
                                transmission: e.target.value,
                              })
                            }
                            placeholder="Automático"
                          />
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
                          label="Imagem/thumb da versão"
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

            {activeTab === "motors" && (
              <Card
                title="Motor, transmissão e dados técnicos"
                icon={<Gauge size={16} />}
                right={
                  <Button
                    type="button"
                    variant="vw"
                    icon={<Plus size={14} />}
                    onClick={() => setMotors((prev) => [...prev, createDefaultMotor()])}
                  >
                    Adicionar motor
                  </Button>
                }
              >
                <div className="space-y-4">
                  {motors.map((motor, index) => (
                    <div
                      key={motor.id}
                      className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400">
                            Motor {index + 1}
                          </div>
                          <div className="font-black text-slate-900">
                            {motor.name || "Sem nome"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {motor.description} • {motor.power} • {motor.torque}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setMotors((prev) =>
                              prev.filter((item) => item.id !== motor.id)
                            )
                          }
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <Label>Nome do motor</Label>
                          <Input
                            value={motor.name}
                            onChange={(e) =>
                              updateMotor(motor.id, { name: e.target.value })
                            }
                            placeholder="250 TSI"
                          />
                        </div>

                        <div>
                          <Label>Preço base desse motor</Label>
                          <Input
                            type="number"
                            value={motor.price}
                            onChange={(e) =>
                              updateMotor(motor.id, {
                                price: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label>Descrição</Label>
                          <Input
                            value={motor.description}
                            onChange={(e) =>
                              updateMotor(motor.id, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Motor turbo com câmbio automático"
                          />
                        </div>

                        <div>
                          <Label>Potência</Label>
                          <Input
                            value={motor.power}
                            onChange={(e) =>
                              updateMotor(motor.id, { power: e.target.value })
                            }
                            placeholder="150 cv"
                          />
                        </div>

                        <div>
                          <Label>Torque</Label>
                          <Input
                            value={motor.torque}
                            onChange={(e) =>
                              updateMotor(motor.id, { torque: e.target.value })
                            }
                            placeholder="25,5 kgfm"
                          />
                        </div>

                        <div>
                          <Label>Combustível</Label>
                          <Input
                            value={motor.fuel}
                            onChange={(e) =>
                              updateMotor(motor.id, { fuel: e.target.value })
                            }
                            placeholder="Total Flex"
                          />
                        </div>

                        <div>
                          <Label>Transmissão</Label>
                          <Input
                            value={motor.transmission}
                            onChange={(e) =>
                              updateMotor(motor.id, {
                                transmission: e.target.value,
                              })
                            }
                            placeholder="Automático de 6 velocidades"
                          />
                        </div>

                        <div>
                          <Label>Tração</Label>
                          <Input
                            value={motor.traction}
                            onChange={(e) =>
                              updateMotor(motor.id, { traction: e.target.value })
                            }
                            placeholder="Tração dianteira"
                          />
                        </div>

                        <div>
                          <Label>Aceleração</Label>
                          <Input
                            value={motor.acceleration}
                            onChange={(e) =>
                              updateMotor(motor.id, {
                                acceleration: e.target.value,
                              })
                            }
                            placeholder="0 a 100 km/h em 8,9 s"
                          />
                        </div>

                        <div>
                          <Label>Velocidade máxima</Label>
                          <Input
                            value={motor.maxSpeed}
                            onChange={(e) =>
                              updateMotor(motor.id, {
                                maxSpeed: e.target.value,
                              })
                            }
                            placeholder="205 km/h"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <Label>Consumo</Label>
                          <Input
                            value={motor.consumption}
                            onChange={(e) =>
                              updateMotor(motor.id, {
                                consumption: e.target.value,
                              })
                            }
                            placeholder="Cidade/Estrada ou informação comercial"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "colors" && (
              <Card
                title="Cores externas com imagens por ângulo"
                icon={<Palette size={16} />}
                right={
                  <Button
                    type="button"
                    variant="vw"
                    icon={<Plus size={14} />}
                    onClick={() => setColors((prev) => [...prev, createDefaultColor()])}
                  >
                    Adicionar cor
                  </Button>
                }
              >
                <div className="space-y-5">
                  {colors.map((color) => (
                    <div
                      key={color.id}
                      className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                    >
                      <div
                        className="h-16 border-b border-slate-200"
                        style={{ background: color.hex }}
                      />

                      <div className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400">
                            Cor externa
                          </div>
                          <div className="font-black text-slate-900">
                            {color.name || "Sem nome"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {color.type} • {money(color.price)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setColors((prev) =>
                              prev.filter((item) => item.id !== color.id)
                            )
                          }
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                        <div>
                          <Label>Nome da cor</Label>
                          <Input
                            value={color.name}
                            onChange={(e) =>
                              updateColor(color.id, { name: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label>Tipo</Label>
                          <Input
                            value={color.type}
                            onChange={(e) =>
                              updateColor(color.id, { type: e.target.value })
                            }
                            placeholder="Sólida, Metálica..."
                          />
                        </div>

                        <div>
                          <Label>Preço adicional</Label>
                          <Input
                            type="number"
                            value={color.price}
                            onChange={(e) =>
                              updateColor(color.id, {
                                price: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Hex da cor</Label>
                          <Input
                            value={color.hex}
                            onChange={(e) =>
                              updateColor(color.id, { hex: e.target.value })
                            }
                            placeholder="#001e50"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase text-slate-900">
                          <Camera size={16} />
                          Imagens do veículo nessa cor
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <UploadField
                            label="Frente"
                            value={color.images.front}
                            onChange={(value) =>
                              updateColorImage(color.id, "front", value)
                            }
                            onUpload={(file) =>
                              handleUpload(
                                file,
                                `colors/${color.id}/front`,
                                (url) => updateColorImage(color.id, "front", url)
                              )
                            }
                            uploading={uploading}
                          />

                          <UploadField
                            label="Lateral"
                            value={color.images.side}
                            onChange={(value) =>
                              updateColorImage(color.id, "side", value)
                            }
                            onUpload={(file) =>
                              handleUpload(
                                file,
                                `colors/${color.id}/side`,
                                (url) => updateColorImage(color.id, "side", url)
                              )
                            }
                            uploading={uploading}
                          />

                          <UploadField
                            label="Traseira"
                            value={color.images.rear}
                            onChange={(value) =>
                              updateColorImage(color.id, "rear", value)
                            }
                            onUpload={(file) =>
                              handleUpload(
                                file,
                                `colors/${color.id}/rear`,
                                (url) => updateColorImage(color.id, "rear", url)
                              )
                            }
                            uploading={uploading}
                          />

                          <UploadField
                            label="3/4"
                            value={color.images.threeQuarter}
                            onChange={(value) =>
                              updateColorImage(color.id, "threeQuarter", value)
                            }
                            onUpload={(file) =>
                              handleUpload(
                                file,
                                `colors/${color.id}/three-quarter`,
                                (url) =>
                                  updateColorImage(color.id, "threeQuarter", url)
                              )
                            }
                            uploading={uploading}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "interiors" && (
              <Card
                title="Acabamentos internos"
                icon={<Armchair size={16} />}
                right={
                  <Button
                    type="button"
                    variant="vw"
                    icon={<Plus size={14} />}
                    onClick={() =>
                      setInteriors((prev) => [...prev, createDefaultInterior()])
                    }
                  >
                    Adicionar interior
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {interiors.map((interior) => (
                    <div
                      key={interior.id}
                      className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400">
                            Interior
                          </div>
                          <div className="font-black text-slate-900">
                            {interior.name || "Sem nome"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {money(interior.price)}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setInteriors((prev) =>
                              prev.filter((item) => item.id !== interior.id)
                            )
                          }
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {interior.image ? (
                        <div className="border-y border-slate-200 bg-white p-2">
                          <img
                            src={interior.image}
                            alt={interior.name}
                            className="h-36 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center border-y border-slate-200 bg-white text-xs font-black text-slate-300">
                          Sem imagem
                        </div>
                      )}

                      <div className="space-y-3 p-4">
                        <div>
                          <Label>Nome do interior</Label>
                          <Input
                            value={interior.name}
                            onChange={(e) =>
                              updateInterior(interior.id, {
                                name: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Preço adicional</Label>
                          <Input
                            type="number"
                            value={interior.price}
                            onChange={(e) =>
                              updateInterior(interior.id, {
                                price: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Descrição do interior</Label>
                          <Textarea
                            rows={3}
                            value={interior.description}
                            onChange={(e) =>
                              updateInterior(interior.id, {
                                description: e.target.value,
                              })
                            }
                          />
                        </div>

                        <UploadField
                          label="Imagem do interior"
                          value={interior.image}
                          onChange={(value) =>
                            updateInterior(interior.id, { image: value })
                          }
                          onUpload={(file) =>
                            handleUpload(
                              file,
                              `interiors/${interior.id}`,
                              (url) => updateInterior(interior.id, { image: url })
                            )
                          }
                          uploading={uploading}
                          cover
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "gallery" && (
              <Card
                title="Galeria geral do veículo"
                icon={<ImageIcon size={16} />}
                right={
                  <Button
                    type="button"
                    variant="vw"
                    icon={<Plus size={14} />}
                    onClick={() =>
                      setGallery((prev) => [...prev, createDefaultGalleryImage()])
                    }
                  >
                    Adicionar imagem
                  </Button>
                }
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div>
                          <div className="text-[10px] font-black uppercase text-slate-400">
                            {item.type === "exterior" ? "Exterior" : "Interior"}
                          </div>
                          <div className="font-black text-slate-900">
                            {item.title || "Sem título"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setGallery((prev) =>
                              prev.filter((galleryItem) => galleryItem.id !== item.id)
                            )
                          }
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {item.image ? (
                        <div className="border-y border-slate-200 bg-white p-2">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-36 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-28 items-center justify-center border-y border-slate-200 bg-white text-xs font-black text-slate-300">
                          Sem imagem
                        </div>
                      )}

                      <div className="space-y-3 p-4">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={item.title}
                            onChange={(e) =>
                              updateGallery(item.id, { title: e.target.value })
                            }
                          />
                        </div>

                        <div>
                          <Label>Tipo</Label>
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateGallery(item.id, {
                                type: e.target.value as "exterior" | "interior",
                              })
                            }
                            className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-black/5"
                          >
                            <option value="exterior">Exterior</option>
                            <option value="interior">Interior</option>
                          </select>
                        </div>

                        <UploadField
                          label="Imagem da galeria"
                          value={item.image}
                          onChange={(value) => updateGallery(item.id, { image: value })}
                          onUpload={(file) =>
                            handleUpload(file, `gallery/${item.id}`, (url) =>
                              updateGallery(item.id, { image: url })
                            )
                          }
                          uploading={uploading}
                          cover
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                <div className="bg-[#001e50] p-5 text-white">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                    Preview Volkswagen Configurador
                  </div>
                  <h2 className="mt-2 text-2xl font-black">
                    {modelName || "Nome do Volkswagen"}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-sm text-white/70">
                    {fullName || "Nome completo do veículo aparecerá aqui."}
                  </p>
                </div>

                <div className="relative flex h-[320px] items-center justify-center overflow-hidden bg-[#f3f5f8] p-5">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview Volkswagen"
                      className="relative z-10 h-full w-full object-contain"
                    />
                  ) : (
                    <div className="relative z-10 text-sm font-black text-slate-400">
                      Sem imagem lateral
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
                        Versão
                      </div>
                      <div className="mt-1 truncate text-xs font-black text-slate-900">
                        {previewVersion?.name || "—"}
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
                      <strong>{motors.length}</strong>
                      <br />
                      motores
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong>{colors.length}</strong>
                      <br />
                      cores
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <strong>{interiors.length}</strong>
                      <br />
                      interior
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-600">
                    <p>
                      <strong>Motor:</strong> {previewMotor?.name || "—"} •{" "}
                      {previewMotor?.power || "—"} • {previewMotor?.torque || "—"}
                    </p>
                    <p className="mt-1">
                      <strong>Cor:</strong> {previewColor?.name || "—"}
                    </p>
                    <p className="mt-1">
                      <strong>Interior:</strong> {previewInterior?.name || "—"}
                    </p>
                  </div>
                </div>
              </div>

              <Card title="Checklist rápido" icon={<CheckCircle2 size={16} />}>
                <div className="space-y-2 text-sm text-slate-700">
                  <ChecklistLine label="Nome" ok={Boolean(modelName.trim())} />
                  <ChecklistLine label="Slug" ok={Boolean(computedSlug)} />
                  <ChecklistLine label="Nome completo" ok={Boolean(fullName.trim())} />
                  <ChecklistLine label="Imagem principal" ok={Boolean(mainImage.trim())} />
                  <ChecklistLine label="Imagem lateral" ok={Boolean(sideImage.trim())} />
                  <ChecklistLine label="Versões" ok={versions.length > 0} />
                  <ChecklistLine label="Motores" ok={motors.length > 0} />
                  <ChecklistLine label="Cores" ok={colors.length > 0} />
                  <ChecklistLine label="Interior" ok={interiors.length > 0} />
                  <ChecklistLine label="Galeria" ok={gallery.length > 0} />
                </div>
              </Card>

              <Button
                type="button"
                variant="vw"
                className="h-12 w-full"
                onClick={handleSave}
                disabled={saving || uploading}
                icon={<Save size={16} />}
              >
                {saving
                  ? "Salvando..."
                  : editingId
                  ? "Salvar alterações"
                  : "Salvar veículo Volkswagen"}
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