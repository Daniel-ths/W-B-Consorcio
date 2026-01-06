"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, Check, Loader2, Car, DollarSign, FolderTree } from 'lucide-react'

// Interface para tipagem
interface Category {
  id: number
  name: string
  slug: string
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Estado do Formulário
  const [formData, setFormData] = useState({
    model_name: '',
    price_start: '',
    category_id: '',
    slug: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)

  // 1. Carregar Categorias ao abrir a página
  useEffect(() => {
    async function loadCats() {
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (data) setCategories(data)
      if (error) console.error("Erro ao carregar categorias:", error)
    }
    loadCats()
  }, [])

  // 2. Gerador de Slug Automático (ex: "Novo Onix" -> "novo-onix")
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    const slug = name.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9 ]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, '-') // Troca espaços por traços

    setFormData({ ...formData, model_name: name, slug: slug })
  }

  // 3. Envio do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    try {
      if (!imageFile || !formData.category_id) throw new Error("Preencha tudo!")

      // A. Preparar Caminho da Imagem
      const category = categories.find(c => c.id === Number(formData.category_id))
      const fileExt = imageFile.name.split('.').pop()
      // Estrutura: categoria/modelo/timestamp.png
      const filePath = `${category?.slug}/${formData.slug}/${Date.now()}.${fileExt}`

      // B. Upload da Imagem para o Bucket 'cars'
      const { error: uploadError } = await supabase.storage
        .from('cars')
        .upload(filePath, imageFile)

      if (uploadError) throw uploadError

      // C. Pegar URL Pública
      const { data: urlData } = supabase.storage.from('cars').getPublicUrl(filePath)

      // D. Salvar no Banco de Dados
      const { error: dbError } = await supabase.from('vehicles').insert({
        model_name: formData.model_name,
        slug: formData.slug,
        price_start: parseFloat(formData.price_start),
        category_id: Number(formData.category_id),
        image_url: urlData.publicUrl,
        features: {} // JSON vazio por enquanto
      })

      if (dbError) throw dbError

      // Sucesso!
      setSuccess(true)
      setFormData({ model_name: '', price_start: '', category_id: '', slug: '' })
      setImageFile(null)
      
      // Remove mensagem de sucesso após 3s
      setTimeout(() => setSuccess(false), 3000)

    } catch (error: any) {
      alert('Erro: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const deleteVehicle = async (id: number) => {
    if(!confirm("Tem certeza que deseja apagar este veículo?")) return
    await supabase.from('vehicles').delete().eq('id', id)
    fetchVehicles()
  }

  // --- ACTIONS BANNER ---
  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBLoading(true)
    try {
        if(!bImage.file) throw new Error("Selecione uma imagem")
        const imageUrl = await uploadToSupabase(bImage.file, 'banners')
        const { error } = await supabase.from('hero_slides').insert({ title: bFormData.title, subtitle: bFormData.subtitle, image_url: imageUrl })
        if (error) throw error
        alert("Banner adicionado!")
        setBFormData({ title: '', subtitle: '' })
        setBImage({ file: null, url: null })
        loadInitialData()
    } catch (err: any) { alert("Erro: " + err.message) } finally { setBLoading(false) }
  }
  const deleteBanner = async (id: number) => {
      if(!confirm("Tem certeza?")) return
      await supabase.from('hero_slides').delete().eq('id', id)
      loadInitialData()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Painel Admin</h1>
          <p className="text-gray-500 mt-2">Cadastre novos veículos no catálogo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Seleção de Categoria */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <FolderTree size={16} /> Categoria
                </label>
                <select 
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all appearance-none"
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                  required
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Nome e Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                    <Car size={16} /> Modelo
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Novo Onix"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                    value={formData.model_name}
                    onChange={handleNameChange}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block pt-1">
                    Slug (Automático)
                  </label>
                  <div className="w-full p-4 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 italic select-none">
                    {formData.slug || 'aguardando-nome...'}
                  </div>
                </div>
              </div>

              {/* Preço */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <DollarSign size={16} /> Preço Inicial
                </label>
                <input 
                  type="number" 
                  placeholder="86990.00"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  value={formData.price_start}
                  onChange={e => setFormData({...formData, price_start: e.target.value})}
                  required
                />
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <Upload size={16} /> Imagem de Capa
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  {imageFile ? (
                    <div className="text-green-600 font-bold flex flex-col items-center">
                      <Check size={32} className="mb-2" />
                      {imageFile.name}
                    </div>
                  ) : (
                    <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                      <p className="text-sm">Clique ou arraste a imagem aqui</p>
                      <p className="text-xs mt-1">PNG, JPG ou AVIF</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Salvar */}
              <button 
                disabled={loading}
                type="submit" 
                className={`w-full py-4 rounded-lg font-bold text-white uppercase tracking-widest transition-all transform active:scale-95 flex items-center justify-center gap-2
                  ${success ? 'bg-green-600 hover:bg-green-700' : 'bg-black hover:bg-gray-800'}
                  ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                `}
              >
                {loading ? (
                  <><Loader2 className="animate-spin" /> Salvando...</>
                ) : success ? (
                  <><Check /> Salvo com Sucesso!</>
                ) : (
                  'Cadastrar Veículo'
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}