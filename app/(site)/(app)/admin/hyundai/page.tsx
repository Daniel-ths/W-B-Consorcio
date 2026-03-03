"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Save,
  Trash2,
  Pencil,
  Loader2,
  Eye,
  EyeOff,
  UploadCloud,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

type BrandKey = "hyundai";
const BRAND: BrandKey = "hyundai";

type VersionItem = {
  id: string;
  title: string;
  subtitle: string;
  priceFormatted: string;
  note?: string;
  heroLabel?: string;
};

type ColorVariant = {
  id: string;
  name: string;
  internal?: string;
  extraPriceFormatted: string;
  swatch: string; // hex
  file: File | null; // ✅ upload do carro nessa cor
  preview: string | null; // preview local ou url existente
};

type SpecGroup = {
  id: string;
  title: string;
  description?: string;
  itemsText: string; // 1 por linha
};

type AccessoryItem = {
  id: string;
  name: string;
  type: "exterior" | "interior";
  priceFormatted: string;
  file: File | null;
  preview: string | null;
};

const slugify = (v: string) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const formatMoneyInput = (val: string) => {
  const numbers = String(val || "").replace(/\D/g, "");
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(numbers) / 100);
};

const parseMoney = (val: string) => {
  if (!val) return 0;
  return Number(String(val).replace(/[^0-9,-]+/g, "").replace(",", "."));
};

async function uploadToSupabase(file: File | null, path: string, existingUrl: string | null) {
  if (!file) return existingUrl;

  const cleanPath = path.replace(/[^a-zA-Z0-9\-\/]/g, "_").toLowerCase();
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;
  const finalPath = `${cleanPath}/${fileName}`;

  const { error } = await supabase.storage
    .from("cars")
    .upload(finalPath, file, { cacheControl: "3600", upsert: false });

  if (error) {
    console.error("UPLOAD ERROR:", error);
    return existingUrl;
  }

  const { data } = supabase.storage.from("cars").getPublicUrl(finalPath);
  return data.publicUrl;
}

function ImageUpload({
  label,
  previewUrl,
  setFile,
  accept,
}: {
  label: string;
  previewUrl: string | null;
  setFile: (f: File | null, url: string | null) => void;
  accept?: string;
}) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-extrabold uppercase text-gray-500 mb-1">
        {label}
      </label>

      <div
        className={`relative h-32 rounded-xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden
        ${
          previewUrl
            ? "border-green-500 bg-green-50/30"
            : "border-gray-300 hover:border-sky-400 hover:bg-sky-50/40"
        }`}
      >
        <input
          type="file"
          accept={accept || "image/*"}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setFile(f, URL.createObjectURL(f));
            e.target.value = "";
          }}
        />

        {previewUrl ? (
          <>
            <img src={previewUrl} className="w-full h-full object-contain p-2" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setFile(null, null);
              }}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full shadow active:scale-95 transition-transform"
              title="Remover"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="text-center text-gray-400">
            <UploadCloud className="mx-auto mb-2" size={26} />
            <div className="text-xs font-bold">Clique para enviar</div>
            <div className="text-[10px] mt-1">PNG recomendado</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HyundaiAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [modelName, setModelName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("R$ 0,00");
  const [isVisible, setIsVisible] = useState(true);

  // ✅ Imagem "default" (opcional) — pode ser a cor principal
  const [mainImg, setMainImg] = useState<{ file: File | null; url: string | null }>({
    file: null,
    url: null,
  });

  // ✅ novos blocos
  const [highlightsText, setHighlightsText] = useState("");
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [colorVariants, setColorVariants] = useState<ColorVariant[]>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitial() {
    const { data: cats, error: catsErr } = await supabase.from("categories").select("*").order("name");
    if (catsErr) console.error(catsErr);
    if (cats) setCategories(cats);

    await fetchHyundaiVehicles();
  }

  async function fetchHyundaiVehicles() {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    const onlyHyundai = (data || []).filter((v: any) => String(v.brand || "chevrolet") === BRAND);
    setVehicles(onlyHyundai);
  }

  const groupedByCategory = useMemo(() => {
    return vehicles.reduce((acc: any, v: any) => {
      const cat = v.categories?.name || "Outros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(v);
      return acc;
    }, {});
  }, [vehicles]);

  const resetForm = () => {
    setEditingId(null);
    setModelName("");
    setSlug("");
    setCategoryId("");
    setPrice("R$ 0,00");
    setIsVisible(true);
    setMainImg({ file: null, url: null });

    setHighlightsText("");
    setVersions([]);
    setColorVariants([]);
    setSpecGroups([]);
    setAccessories([]);
  };

  const startEditing = (v: any) => {
    setEditingId(v.id);
    setModelName(v.model_name || "");
    setSlug(v.slug || "");
    setCategoryId(String(v.category_id || ""));
    setPrice(formatMoneyInput(String(v.price_start || 0) + "00"));
    setIsVisible(v.is_visible !== false);
    setMainImg({ file: null, url: v.image_url || null });

    const h = Array.isArray(v.highlights) ? v.highlights : [];
    setHighlightsText(h.join("\n"));

    const vs = Array.isArray(v.versions) ? v.versions : [];
    setVersions(
      vs.map((x: any) => ({
        id: x.id || crypto.randomUUID(),
        title: x.title || "",
        subtitle: x.subtitle || "",
        priceFormatted: formatMoneyInput(String(x.price || 0) + "00"),
        note: x.note || "",
        heroLabel: x.heroLabel || "",
      }))
    );

    // ✅ agora cores viram "variants" com imagem
    const cv = Array.isArray(v.color_variants) ? v.color_variants : [];
    setColorVariants(
      cv.map((x: any) => ({
        id: x.id || crypto.randomUUID(),
        name: x.name || "",
        internal: x.internal || "",
        extraPriceFormatted: formatMoneyInput(String(x.extraPrice || 0) + "00"),
        swatch: x.swatch || "#dddddd",
        file: null,
        preview: x.image_url || null,
      }))
    );

    const sg = Array.isArray(v.spec_groups) ? v.spec_groups : [];
    setSpecGroups(
      sg.map((x: any) => ({
        id: x.id || crypto.randomUUID(),
        title: x.title || "",
        description: x.description || "",
        itemsText: Array.isArray(x.items) ? x.items.join("\n") : "",
      }))
    );

    const list = Array.isArray(v.accessories) ? v.accessories : [];
    setAccessories(
      list.map((a: any) => ({
        id: a.id || crypto.randomUUID(),
        name: a.name || "",
        type: a.type === "interior" ? "interior" : "exterior",
        priceFormatted: formatMoneyInput(String(a.price || 0) + "00"),
        file: null,
        preview: a.image || null,
      }))
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ===== Versions
  const addVersion = () => {
    setVersions((p) => [
      ...p,
      { id: crypto.randomUUID(), title: "", subtitle: "", priceFormatted: "R$ 0,00", note: "", heroLabel: "Exterior" },
    ]);
  };
  const updateVersion = (id: string, patch: Partial<VersionItem>) => {
    setVersions((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const removeVersion = (id: string) => setVersions((p) => p.filter((x) => x.id !== id));

  // ===== Color Variants (com imagem)
  const addColorVariant = () => {
    setColorVariants((p) => [
      ...p,
      {
        id: crypto.randomUUID(),
        name: "",
        internal: "",
        extraPriceFormatted: "R$ 0,00",
        swatch: "#dddddd",
        file: null,
        preview: null,
      },
    ]);
  };
  const updateColorVariant = (id: string, patch: Partial<ColorVariant>) => {
    setColorVariants((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const removeColorVariant = (id: string) => setColorVariants((p) => p.filter((x) => x.id !== id));

  // ===== Spec Groups
  const addSpecGroup = () => {
    setSpecGroups((p) => [...p, { id: crypto.randomUUID(), title: "", description: "", itemsText: "" }]);
  };
  const updateSpecGroup = (id: string, patch: Partial<SpecGroup>) => {
    setSpecGroups((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };
  const removeSpecGroup = (id: string) => setSpecGroups((p) => p.filter((x) => x.id !== id));

  // ===== Accessories
  const addAccessory = () => {
    setAccessories((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", type: "exterior", priceFormatted: "R$ 0,00", file: null, preview: null },
    ]);
  };
  const removeAccessory = (id: string) => setAccessories((prev) => prev.filter((x) => x.id !== id));
  const updateAccessory = (id: string, patch: Partial<AccessoryItem>) => {
    setAccessories((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modelName.trim()) return alert("Preencha o modelo.");
    if (!categoryId) return alert("Selecione a categoria.");
    if (!slug.trim()) return alert("Slug obrigatório.");

    // ✅ regra nova: se existir cor cadastrada, cada uma precisa ter imagem
    const hasColors = colorVariants.length > 0;
    if (hasColors) {
      const missing = colorVariants.find((c) => c.name.trim() && !c.preview && !c.file);
      if (missing) return alert("Cada cor precisa de uma imagem do carro (PNG) nessa cor.");
    }

    setLoading(true);
    try {
      const cat = categories.find((c) => String(c.id) === String(categoryId));
      const basePath = `${BRAND}/${cat?.slug || "categoria"}/${slugify(slug)}`;

      // imagem principal (opcional)
      const mainUrl = await uploadToSupabase(mainImg.file, `${basePath}/capa`, mainImg.url);

      // accessories
      const finalAccessories: any[] = [];
      for (const a of accessories) {
        if (!a.name.trim()) continue;
        const safeName = slugify(a.name) || "acessorio";
        const img = await uploadToSupabase(a.file, `${basePath}/acessorios/${a.type}/${safeName}`, a.preview);
        finalAccessories.push({
          id: a.id,
          name: a.name,
          type: a.type,
          price: parseMoney(a.priceFormatted),
          image: img,
        });
      }

      // highlights
      const finalHighlights = highlightsText.split("\n").map((s) => s.trim()).filter(Boolean);

      // versions
      const finalVersions = versions
        .map((v) => ({
          id: v.id,
          title: (v.title || "").trim(),
          subtitle: (v.subtitle || "").trim(),
          price: parseMoney(v.priceFormatted),
          note: (v.note || "").trim(),
          heroLabel: (v.heroLabel || "").trim(),
        }))
        .filter((v) => v.title);

      // ✅ color variants com upload da imagem por cor
      const finalColorVariants: any[] = [];
      for (const c of colorVariants) {
        if (!c.name.trim()) continue;
        const safeColor = slugify(c.name) || "cor";
        const imgUrl = await uploadToSupabase(c.file, `${basePath}/cores/${safeColor}`, c.preview);

        if (!imgUrl) throw new Error(`A cor "${c.name}" está sem imagem.`);
        finalColorVariants.push({
          id: c.id,
          name: c.name.trim(),
          internal: (c.internal || "").trim(),
          extraPrice: parseMoney(c.extraPriceFormatted),
          swatch: c.swatch || "#dddddd",
          image_url: imgUrl, // ✅ ESSENCIAL
        });
      }

      // spec groups
      const finalSpecGroups = specGroups
        .map((g) => ({
          id: g.id,
          title: (g.title || "").trim(),
          description: (g.description || "").trim(),
          items: (g.itemsText || "").split("\n").map((s) => s.trim()).filter(Boolean),
        }))
        .filter((g) => g.title);

      const payload: any = {
        brand: BRAND,
        model_name: modelName.trim(),
        slug: slugify(slug),
        category_id: Number(categoryId),
        price_start: parseMoney(price),
        is_visible: isVisible,

        // ✅ imagem principal pode ser a "default"
        image_url: mainUrl || null,

        accessories: finalAccessories,
        highlights: finalHighlights,
        versions: finalVersions,
        color_variants: finalColorVariants, // ✅ TROCOU
        spec_groups: finalSpecGroups,
      };

      if (editingId) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", editingId);
        if (error) throw error;
        alert("Veículo Hyundai atualizado!");
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);
        if (error) throw error;
        alert("Veículo Hyundai cadastrado!");
      }

      await fetchHyundaiVehicles();
      resetForm();
    } catch (err: any) {
      alert("Erro: " + (err?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Apagar este veículo?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
      await fetchHyundaiVehicles();
      if (editingId === id) resetForm();
    } catch (err: any) {
      alert("Erro ao apagar: " + (err?.message || "desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32 px-4">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="pt-4">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-sky-600">Admin — Hyundai</p>
              <h1 className="text-2xl font-black text-gray-900">Builder Hyundai</h1>
              <p className="text-sm text-gray-500">
                Agora: versões, <b>cores com imagem do carro</b>, itens de série e acessórios.
              </p>
            </div>

            <Link
              href="/admin"
              className="text-xs font-black uppercase px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.99] transition"
            >
              Voltar ao Admin
            </Link>
          </div>

          <div className="mb-6 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-600 to-cyan-500 p-5 text-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/80">Regra</div>
                <div className="text-base font-black">
                  <span className="underline">Cada cor precisa do PNG do carro</span> naquela cor (fundo transparente).
                </div>
                <div className="text-sm text-white/85 mt-1">
                  Assim o configurador troca a imagem quando o usuário muda a cor.
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-sky-700 font-black text-xs uppercase hover:bg-white/90 active:scale-[0.99] transition"
              >
                <Plus size={14} />
                Novo veículo
              </button>
            </div>
          </div>
        </div>

        {/* LISTA */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-gray-900">Veículos Hyundai ({vehicles.length})</h2>

            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-[0.99] transition"
            >
              <Plus size={14} className="inline -mt-0.5 mr-2" />
              Novo
            </button>
          </div>

          {Object.keys(groupedByCategory).length === 0 ? (
            <div className="text-sm text-gray-500">Nenhum veículo Hyundai ainda.</div>
          ) : (
            <div className="space-y-6">
              {Object.keys(groupedByCategory).map((cat) => (
                <div key={cat}>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b pb-2 mb-3">
                    {cat}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {groupedByCategory[cat].map((v: any) => (
                      <div
                        key={v.id}
                        className={`border rounded-xl p-4 flex gap-3 items-center bg-white hover:shadow-sm transition-shadow ${
                          v.is_visible === false ? "opacity-60" : ""
                        }`}
                      >
                        <div className="w-16 h-16 rounded-lg border bg-white overflow-hidden shrink-0 flex items-center justify-center">
                          {v.image_url ? (
                            <img src={v.image_url} className="w-full h-full object-contain p-1" />
                          ) : (
                            <ImageIcon size={18} className="text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-gray-900 truncate">{v.model_name}</h3>
                            {v.is_visible === false ? (
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 inline-flex items-center gap-1">
                                <EyeOff size={12} /> Oculto
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 inline-flex items-center gap-1">
                                <Eye size={12} /> Visível
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 font-mono mt-1">
                            {formatMoneyInput(String(v.price_start || 0) + "00")}
                          </div>

                          <div className="text-[10px] font-bold text-gray-400 mt-1">/{v.slug}</div>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* ✅ nunca use "app/admin..." em href */}
                          <Link
                            href={`/admin/hyundai/veiculos/${v.slug}`}
                            target="_blank"
                            className="p-2 rounded-full hover:bg-slate-50 text-slate-700"
                            title="Ver no admin"
                          >
                            <Eye size={18} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => startEditing(v)}
                            className="p-2 rounded-full hover:bg-sky-50 text-sky-600 active:scale-95 transition-transform"
                            title="Editar"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(v.id)}
                            className="p-2 rounded-full hover:bg-red-50 text-red-600 active:scale-95 transition-transform"
                            title="Apagar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-8 ${
            editingId ? "ring-2 ring-sky-100" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                {editingId ? "Editando veículo" : "Novo veículo"} — Hyundai
              </h2>
              <p className="text-xs text-gray-500">Regras: cada cor cadastrada precisa da imagem do carro.</p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-black uppercase px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:scale-[0.99] transition"
              >
                <X size={14} className="inline -mt-0.5 mr-2" />
                Cancelar edição
              </button>
            )}
          </div>

          {/* BASE */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-500">Modelo</label>
              <input
                value={modelName}
                onChange={(e) => {
                  const v = e.target.value;
                  setModelName(v);
                  if (!editingId) setSlug(slugify(v));
                }}
                className="w-full mt-1 h-11 px-3 border rounded-xl outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Ex: Creta"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">Slug</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full mt-1 h-11 px-3 border rounded-xl outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="creta"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">Categoria</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full mt-1 h-11 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                required
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500">Preço base</label>
              <input
                value={price}
                onChange={(e) => setPrice(formatMoneyInput(e.target.value))}
                className="w-full mt-1 h-11 px-3 border rounded-xl outline-none focus:ring-2 focus:ring-sky-200"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setIsVisible((p) => !p)}
                className={`w-full h-11 px-4 rounded-xl font-black uppercase text-xs border transition-all active:scale-[0.99]
                ${
                  isVisible
                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                }`}
              >
                {isVisible ? (
                  <span className="inline-flex items-center gap-2">
                    <Eye size={16} /> Visível
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <EyeOff size={16} /> Oculto
                  </span>
                )}
              </button>
            </div>
          </div>

          <ImageUpload
            label="Imagem principal (opcional — pode ser a cor principal)"
            previewUrl={mainImg.url}
            setFile={(f, url) => setMainImg({ file: f, url })}
            accept="image/*"
          />

          {/* HIGHLIGHTS */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-sm font-black uppercase text-gray-800">Destaques (bullets)</h3>
              <span className="text-[10px] font-black uppercase text-gray-400">1 por linha</span>
            </div>
            <textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              className="w-full min-h-[110px] border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              placeholder={"Ex:\nDRL em LED\nPainel digital\nSmart Key"}
            />
          </div>

          {/* VERSÕES */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-black uppercase text-gray-800">Versões</h3>
              <button
                type="button"
                onClick={addVersion}
                className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-[0.99] transition"
              >
                <Plus size={14} className="inline -mt-0.5 mr-2" />
                Adicionar versão
              </button>
            </div>

            {versions.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                Nenhuma versão ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {versions.map((v) => (
                  <div key={v.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Título</label>
                        <input
                          value={v.title}
                          onChange={(e) => updateVersion(v.id, { title: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Ex: Limited"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Preço</label>
                        <input
                          value={v.priceFormatted}
                          onChange={(e) => updateVersion(v.id, { priceFormatted: formatMoneyInput(e.target.value) })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Hero label</label>
                        <input
                          value={v.heroLabel || ""}
                          onChange={(e) => updateVersion(v.id, { heroLabel: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Exterior"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Subtítulo</label>
                        <input
                          value={v.subtitle}
                          onChange={(e) => updateVersion(v.id, { subtitle: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="2026/2027 - Motor..."
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Nota/descrição</label>
                        <input
                          value={v.note || ""}
                          onChange={(e) => updateVersion(v.id, { note: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Texto curto"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeVersion(v.id)}
                        className="h-10 px-4 rounded-xl font-black uppercase text-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={16} className="inline -mt-0.5 mr-2" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CORES COM IMAGEM */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-800">Cores (cada cor tem imagem)</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Para cada cor: escolha o HEX e envie o <b>PNG do carro nessa cor</b>.
                </p>
              </div>

              <button
                type="button"
                onClick={addColorVariant}
                className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-[0.99] transition"
              >
                <Plus size={14} className="inline -mt-0.5 mr-2" />
                Adicionar cor
              </button>
            </div>

            {colorVariants.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                Nenhuma cor ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {colorVariants.map((c) => (
                  <div key={c.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Nome</label>
                        <input
                          value={c.name}
                          onChange={(e) => updateColorVariant(c.id, { name: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Ex: Branco Atlas"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Interno</label>
                        <input
                          value={c.internal || ""}
                          onChange={(e) => updateColorVariant(c.id, { internal: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Ex: Preto Ebony"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Extra (+)</label>
                        <input
                          value={c.extraPriceFormatted}
                          onChange={(e) =>
                            updateColorVariant(c.id, { extraPriceFormatted: formatMoneyInput(e.target.value) })
                          }
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Cor (hex)</label>
                        <input
                          type="color"
                          value={c.swatch || "#dddddd"}
                          onChange={(e) => updateColorVariant(c.id, { swatch: e.target.value })}
                          className="w-full mt-1 h-10 px-2 border rounded-xl bg-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <ImageUpload
                        label="Imagem do carro nessa cor (PNG transparente)"
                        previewUrl={c.preview}
                        setFile={(f, url) => updateColorVariant(c.id, { file: f, preview: url })}
                        accept="image/png,image/*"
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeColorVariant(c.id)}
                        className="h-10 px-4 rounded-xl font-black uppercase text-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={16} className="inline -mt-0.5 mr-2" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ITENS DE SÉRIE (GRUPOS) */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-black uppercase text-gray-800">Itens de série (seções)</h3>
              <button
                type="button"
                onClick={addSpecGroup}
                className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-[0.99] transition"
              >
                <Plus size={14} className="inline -mt-0.5 mr-2" />
                Adicionar seção
              </button>
            </div>

            {specGroups.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                Nenhuma seção ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {specGroups.map((g) => (
                  <div key={g.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Título</label>
                        <input
                          value={g.title}
                          onChange={(e) => updateSpecGroup(g.id, { title: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Ex: ESTILO EXTERIOR"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Descrição (aparece ao expandir)
                        </label>
                        <input
                          value={g.description || ""}
                          onChange={(e) => updateSpecGroup(g.id, { description: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Texto curto explicando a seção"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-[10px] font-black uppercase text-gray-500">Itens (1 por linha)</label>
                      <textarea
                        value={g.itemsText}
                        onChange={(e) => updateSpecGroup(g.id, { itemsText: e.target.value })}
                        className="w-full mt-1 min-h-[120px] border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder={"Ex:\nFaróis full LED\nRodas aro 17\n..."}
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeSpecGroup(g.id)}
                        className="h-10 px-4 rounded-xl font-black uppercase text-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      >
                        <Trash2 size={16} className="inline -mt-0.5 mr-2" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACESSÓRIOS */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-black uppercase text-gray-800">Acessórios do veículo</h3>
              <button
                type="button"
                onClick={addAccessory}
                className="text-xs font-black uppercase px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 active:scale-[0.99] transition"
              >
                <Plus size={14} className="inline -mt-0.5 mr-2" />
                Adicionar
              </button>
            </div>

            {accessories.length === 0 ? (
              <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4">
                Nenhum acessório ainda. Clique em “Adicionar”.
              </div>
            ) : (
              <div className="space-y-4">
                {accessories.map((a) => (
                  <div key={a.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start">
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Nome</label>
                        <input
                          value={a.name}
                          onChange={(e) => updateAccessory(a.id, { name: e.target.value })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                          placeholder="Ex: Sensor de estacionamento"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Tipo</label>
                        <select
                          value={a.type}
                          onChange={(e) => updateAccessory(a.id, { type: e.target.value as any })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="exterior">Exterior</option>
                          <option value="interior">Interior</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase text-gray-500">Preço (+)</label>
                        <input
                          value={a.priceFormatted}
                          onChange={(e) => updateAccessory(a.id, { priceFormatted: formatMoneyInput(e.target.value) })}
                          className="w-full mt-1 h-10 px-3 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-sky-200"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="md:col-span-2">
                        <ImageUpload
                          label="Imagem do acessório"
                          previewUrl={a.preview}
                          setFile={(f, url) => updateAccessory(a.id, { file: f, preview: url })}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAccessory(a.id)}
                        className="h-11 px-4 rounded-xl font-black uppercase text-xs border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:scale-[0.99] transition"
                      >
                        <Trash2 size={16} className="inline -mt-0.5 mr-2" />
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full h-12 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Cadastrar veículo Hyundai"}
          </button>
        </form>
      </div>
    </div>
  );
}