"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, UploadCloud, Trash2 } from "lucide-react";
import Link from "next/link";

export default function EditCarPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: 0,
    price: 0,
    image_url: "",
    description: "",
    features: ""
  });

  // 1. Carregar dados do carro ao abrir a página
  useEffect(() => {
    const fetchCar = async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        alert("Erro ao buscar carro.");
        router.push("/admin/dashboard");
        return;
      }

      // Preenche o formulário com os dados que vieram do banco
      setFormData({
        brand: data.brand,
        model: data.model,
        year: data.year,
        price: data.price,
        image_url: data.image_url || "",
        description: data.description || "",
        features: data.features ? data.features.join(", ") : ""
      });
      setLoading(false);
    };

    fetchCar();
  }, [params.id, router]);

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const featuresArray = formData.features.split(',').map(item => item.trim()).filter(item => item !== "");

    const { error } = await supabase
      .from('vehicles')
      .update({
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        price: Number(formData.price),
        image_url: formData.image_url,
        description: formData.description,
        features: featuresArray
      })
      .eq('id', params.id);

    if (error) {
        alert("Erro ao atualizar: " + error.message);
        setSaving(false);
    } else {
        alert("Veículo atualizado com sucesso!");
        router.push("/admin/dashboard");
    }
  };

  if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Carregando dados...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        
        <Link href="/admin/dashboard" className="inline-flex items-center text-gray-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest gap-2">
            <ArrowLeft size={14} /> Cancelar
        </Link>

        <h1 className="text-3xl font-bold uppercase tracking-tighter mb-8">Editar Veículo</h1>

        <form onSubmit={handleUpdate} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Marca</label>
                    <input name="brand" value={formData.brand} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</label>
                    <input name="model" value={formData.model} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ano</label>
                    <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preço (R$)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    Link da Foto <UploadCloud size={14}/>
                </label>
                <div className="flex gap-4">
                    <input name="image_url" value={formData.image_url} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none text-sm font-mono" />
                    {formData.image_url && <img src={formData.image_url} className="h-12 w-16 object-cover border border-gray-700"/>}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opcionais (Separe por vírgula)</label>
                <input name="features" value={formData.features} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição Completa</label>
                <textarea name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
            </div>

            <button disabled={saving} type="submit" className="w-full bg-blue-600 text-white h-14 font-bold uppercase tracking-[0.15em] hover:bg-blue-500 transition-all flex items-center justify-center gap-2 text-xs">
                {saving ? "Atualizando..." : "Salvar Alterações"} <Save size={16} />
            </button>

        </form>
      </div>
    </div>
  )
}