"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, UploadCloud } from "lucide-react";
import Link from "next/link";

export default function NewCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Dados do Formulário
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    price: "",
    image_url: "",
    description: "",
    features: "" // Vamos separar por vírgula
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Converter string de opcionais em array (Ar, Vidro, Trava...)
    const featuresArray = formData.features.split(',').map(item => item.trim()).filter(item => item !== "");

    const { error } = await supabase.from('vehicles').insert([{
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        price: Number(formData.price),
        image_url: formData.image_url, // Por enquanto, colaremos o Link da imagem
        description: formData.description,
        features: featuresArray,
        is_active: true
    }]);

    if (error) {
        alert("Erro ao salvar: " + error.message);
        setLoading(false);
    } else {
        alert("Veículo cadastrado com sucesso!");
        router.push("/admin/dashboard"); // Volta pro painel
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Voltar */}
        <Link href="/admin/dashboard" className="inline-flex items-center text-gray-500 hover:text-white mb-8 text-xs font-bold uppercase tracking-widest gap-2">
            <ArrowLeft size={14} /> Cancelar e Voltar
        </Link>

        <h1 className="text-3xl font-bold uppercase tracking-tighter mb-8">Cadastrar Novo Veículo</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Marca</label>
                    <input name="brand" required placeholder="Ex: BMW" onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Modelo</label>
                    <input name="model" required placeholder="Ex: 320i M Sport" onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ano</label>
                    <input type="number" name="year" required value={formData.year} onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Preço (R$)</label>
                    <input type="number" name="price" required placeholder="150000" onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    Link da Foto <UploadCloud size={14}/>
                </label>
                <input name="image_url" placeholder="Cole o link da imagem aqui (https://...)" onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none text-sm font-mono" />
                <p className="text-[10px] text-gray-600">Dica: Use links do Unsplash ou Wikimedia para testar.</p>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Opcionais (Separe por vírgula)</label>
                <input name="features" placeholder="Teto Solar, Banco de Couro, GPS..." onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Descrição Completa</label>
                <textarea name="description" rows={4} placeholder="Descreva os detalhes do carro..." onChange={handleChange} className="w-full bg-black border border-gray-800 p-3 text-white focus:border-blue-500 outline-none" />
            </div>

            <button disabled={loading} type="submit" className="w-full bg-white text-black h-14 font-bold uppercase tracking-[0.15em] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-xs">
                {loading ? "Salvando..." : "Salvar Veículo"} <Save size={16} />
            </button>

        </form>
      </div>
    </div>
  )
}