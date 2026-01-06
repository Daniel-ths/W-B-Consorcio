"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Check, Loader2, Car, ImageIcon, Armchair, Trash2, UploadCloud, X, LayoutGrid, MonitorPlay, Plus, Search } from 'lucide-react'

// --- COMPONENTE DE UPLOAD VISUAL (COMPACTO) ---
const ImageUpload = ({ label, file, setFile, previewUrl }: any) => {
  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setFile(selectedFile, objectUrl)
    } else {
      setFile(null, null)
    }
  }
  return (
    <div className="w-full">
      <label className="block text-xs font-bold uppercase text-gray-500 mb-1.5">{label}</label>
      <div className={`relative h-32 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group ${file ? 'border-green-500 bg-green-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-1 z-10" />
            <div className="absolute top-1 right-1 z-30"><button type="button" onClick={(e) => { e.preventDefault(); setFile(null, null); }} className="bg-white text-red-500 p-1 rounded-full shadow hover:scale-110"><X size={14} /></button></div>
          </>
        ) : (
          <div className="text-center p-2"><UploadCloud className="mx-auto h-6 w-6 text-gray-400 mb-1" /><p className="text-xs font-medium text-gray-500">Arraste ou Clique</p></div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'banners'>('vehicles')
  
  // --- ESTADOS GERAIS ---
  const [categories, setCategories] = useState<any[]>([])
  
  // --- ESTADOS DE VEÍCULOS ---
  const [vehicleList, setVehicleList] = useState<any[]>([]) // Lista de carros cadastrados
  const [vLoading, setVLoading] = useState(false)
  const [vSuccess, setVSuccess] = useState(false)
  // Formulario
  const [formData, setFormData] = useState({ model_name: '', category_id: '', slug: '' })
  const [price, setPrice] = useState('')
  const [mainImg, setMainImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [dashImg, setDashImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [seatsImg, setSeatsImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [colors, setColors] = useState([{ id: '1', name: 'Padrão', hex: '#000000', file: null as File | null, preview: null as string | null }])

  // --- ESTADOS DOS BANNERS ---
  const [banners, setBanners] = useState<any[]>([])
  const [bFormData, setBFormData] = useState({ title: '', subtitle: '' })
  const [bImage, setBImage] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [bLoading, setBLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    // Carrega Categorias
    const { data: cats } = await supabase.from('categories').select('*')
    if (cats) setCategories(cats)

    // Carrega Banners
    const { data: bans } = await supabase.from('hero_slides').select('*').order('created_at', { ascending: false })
    if (bans) setBanners(bans)

    // Carrega Veículos (NOVO)
    fetchVehicles()
  }

  async function fetchVehicles() {
    const { data: vecs } = await supabase.from('vehicles').select('*, categories(name)').order('created_at', { ascending: false })
    if (vecs) setVehicleList(vecs)
  }

  // --- FUNÇÕES AUXILIARES ---
  const handlePriceChange = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(numbers) / 100)
    setPrice(formatted)
  }
  const handleNameChange = (e: any) => {
    const name = e.target.value
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, '-')
    setFormData({ ...formData, model_name: name, slug: slug })
  }
  const uploadToSupabase = async (file: File, path: string) => {
    const ext = file.name.split('.').pop()
    const finalPath = `${path}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('cars').upload(finalPath, file)
    if (error) throw error
    return supabase.storage.from('cars').getPublicUrl(finalPath).data.publicUrl
  }

  // --- ACTIONS VEÍCULO ---
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setVLoading(true)
    try {
      if (!formData.category_id || !mainImg.file || !dashImg.file || !seatsImg.file) throw new Error("Preencha tudo!")
      const category = categories.find(c => c.id === Number(formData.category_id))
      const basePath = `${category?.slug}/${formData.slug}`
      const numericPrice = Number(price.replace(/[^0-9,-]+/g,"").replace(",", "."))

      const mainUrl = await uploadToSupabase(mainImg.file, `${basePath}/capa`)
      const dashUrl = await uploadToSupabase(dashImg.file, `${basePath}/interior-painel`)
      const seatsUrl = await uploadToSupabase(seatsImg.file, `${basePath}/interior-bancos`)

      const finalColors = []
      for (const col of colors) {
        if (!col.file) throw new Error(`Faltou a imagem da cor: ${col.name}`)
        const colUrl = await uploadToSupabase(col.file, `${basePath}/cor-${col.name}`)
        finalColors.push({ name: col.name, hex: col.hex, image: colUrl })
      }

      const { error } = await supabase.from('vehicles').insert({
        model_name: formData.model_name, slug: formData.slug, price_start: numericPrice, category_id: Number(formData.category_id),
        image_url: mainUrl, interior_images: { dash: dashUrl, seats: seatsUrl }, exterior_colors: finalColors
      })
      if (error) throw error
      setVSuccess(true)
      fetchVehicles() // Atualiza a lista
      setTimeout(() => window.location.reload(), 2000)
    } catch (err: any) { alert("Erro: " + err.message) } finally { setVLoading(false) }
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
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex flex-col items-center mb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel Administrativo</h1>
            <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex">
                <button onClick={() => setActiveTab('vehicles')} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'vehicles' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}>Veículos</button>
                <button onClick={() => setActiveTab('banners')} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'banners' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}>Banners</button>
            </div>
        </div>

        {/* --- ABA VEÍCULOS --- */}
        {activeTab === 'vehicles' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
              
              {/* LISTA DE VEÍCULOS CADASTRADOS (NOVO) */}
              <div className="space-y-4">
                 <h2 className="text-xl font-bold text-gray-800">Estoque Atual ({vehicleList.length})</h2>
                 {vehicleList.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-gray-200 text-gray-400">
                        <Search className="mx-auto mb-2 opacity-50" />
                        Nenhum veículo encontrado no banco de dados.
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vehicleList.map(v => (
                            <div key={v.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-center">
                                <div className="w-24 h-24 bg-gray-100 rounded-lg shrink-0 overflow-hidden relative">
                                    <img src={v.image_url} alt={v.model_name} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wider">{v.categories?.name}</span>
                                    <h3 className="font-bold text-lg text-gray-900 truncate mt-1">{v.model_name}</h3>
                                    <p className="text-sm text-gray-500 font-mono">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v.price_start)}
                                    </p>
                                </div>
                                <button onClick={() => deleteVehicle(v.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Apagar Veículo">
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                 )}
              </div>

              <div className="border-t border-gray-200 my-8"></div>

              {/* FORMULÁRIO DE CADASTRO */}
              <form onSubmit={handleVehicleSubmit} className="space-y-6">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Plus className="bg-black text-white rounded-full p-1 w-6 h-6"/> Cadastrar Novo Veículo</h2>
                 {/* ... (Todo o formulário anterior mantido aqui, resumido para brevidade) ... */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Modelo</label><input className="w-full mt-1 h-10 px-3 border rounded" onChange={handleNameChange} required /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Categoria</label><select className="w-full mt-1 h-10 px-3 border rounded bg-white" onChange={e => setFormData({...formData, category_id: e.target.value})} required><option value="">Selecione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Preço</label><input value={price} className="w-full mt-1 h-10 px-3 border rounded" onChange={e => handlePriceChange(e.target.value)} required /></div>
                        <div className="md:col-span-3"><ImageUpload label="Capa" file={mainImg.file} previewUrl={mainImg.url} setFile={(f:any, u:any) => setMainImg({file:f, url:u})} /></div>
                    </div>
                 </div>
                 {/* Componentes de Interior e Cores (Simplificados no exemplo, mas mantenha o código completo anterior aqui) */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-sm font-bold mb-4 uppercase">Interior</h2>
                    <div className="grid grid-cols-2 gap-5"><ImageUpload label="1. Painel" file={dashImg.file} previewUrl={dashImg.url} setFile={(f:any,u:any) => setDashImg({file:f, url:u})} /><ImageUpload label="2. Bancos" file={seatsImg.file} previewUrl={seatsImg.url} setFile={(f:any,u:any) => setSeatsImg({file:f, url:u})} /></div>
                 </div>
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between mb-4"><h2 className="text-sm font-bold uppercase">Cores</h2><button type="button" onClick={() => setColors([...colors, {id:crypto.randomUUID(), name:'', hex:'#000', file:null, preview:null}])} className="text-xs font-bold">+ Cor</button></div>
                    <div className="space-y-3">{colors.map((c, i) => (<div key={c.id} className="flex gap-3"><input className="border rounded px-2 w-full" placeholder="Nome" value={c.name} onChange={e=>{const nc=[...colors];nc[i].name=e.target.value;setColors(nc)}}/><input type="color" className="border rounded h-full" value={c.hex} onChange={e=>{const nc=[...colors];nc[i].hex=e.target.value;setColors(nc)}}/><div className="w-20"><ImageUpload label="" file={c.file} previewUrl={c.preview} setFile={(f:any)=>{const nc=[...colors];nc[i].file=f;nc[i].preview=URL.createObjectURL(f);setColors(nc)}}/></div></div>))}</div>
                 </div>
                 <button disabled={vLoading} type="submit" className={`w-full py-4 rounded-xl font-bold text-white uppercase ${vSuccess ? 'bg-green-600' : 'bg-black'}`}>{vLoading ? 'Salvando...' : vSuccess ? 'Salvo!' : 'Cadastrar Veículo'}</button>
              </form>
            </div>
        )}

        {/* --- ABA BANNERS --- */}
        {activeTab === 'banners' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                 {/* (Mesmo código de banners anterior) */}
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleBannerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Título</label><input type="text" className="w-full mt-1 h-10 px-3 text-sm border rounded" value={bFormData.title} onChange={e => setBFormData({...bFormData, title: e.target.value})} required /></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">Subtítulo</label><input type="text" className="w-full mt-1 h-10 px-3 text-sm border rounded" value={bFormData.subtitle} onChange={e => setBFormData({...bFormData, subtitle: e.target.value})} required /></div>
                            <button disabled={bLoading} type="submit" className="w-full h-10 bg-black text-white font-bold uppercase text-xs rounded hover:bg-gray-800 mt-2">{bLoading ? '...' : 'Adicionar Banner'}</button>
                        </div>
                        <div><ImageUpload label="Imagem (1920x1080)" file={bImage.file} previewUrl={bImage.url} setFile={(f:any, u:any) => setBImage({file:f, url:u})} /></div>
                    </form>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    {banners.map((banner) => (
                        <div key={banner.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm">
                            <div className="w-24 h-16 bg-gray-100 rounded overflow-hidden shrink-0"><img src={banner.image_url} className="w-full h-full object-cover" /></div>
                            <div className="flex-1"><h4 className="font-bold text-sm">{banner.title}</h4></div>
                            <button onClick={() => deleteBanner(banner.id)} className="p-2 text-red-500"><Trash2 size={18} /></button>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}