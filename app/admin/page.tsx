"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, UploadCloud, Plus, Pencil, Ban, Eye, Loader2, X, Copy, Save, Settings } from 'lucide-react'
import Link from 'next/link'

// --- COMPONENTE DE UPLOAD ---
const ImageUpload = ({ label, file, setFile, previewUrl }: any) => {
  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      const objectUrl = URL.createObjectURL(selectedFile)
      setFile(selectedFile, objectUrl)
    } else {
      setFile(null, null) 
    }
  }
  const handleRemove = (e: any) => { e.preventDefault(); e.stopPropagation(); setFile(null, null); }

  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">{label}</label>}
      <div className={`relative h-24 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group 
        ${previewUrl ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-1 z-10" />
            <div className="absolute top-1 right-1 z-30">
               <button type="button" onClick={handleRemove} className="bg-red-500 text-white p-1 rounded-full shadow hover:scale-110 z-40 cursor-pointer"><Trash2 size={12} /></button>
            </div>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"><p className="text-white text-[10px] font-bold">Trocar</p></div>
          </>
        ) : (
          <div className="text-center p-1"><UploadCloud className="mx-auto h-5 w-5 text-gray-400" /></div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'banners'>('vehicles')
  const [categories, setCategories] = useState<any[]>([])
  const [vehicleList, setVehicleList] = useState<any[]>([])
  const [vLoading, setVLoading] = useState(false)
  const [rLoading, setRLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Dados Básicos
  const [formData, setFormData] = useState({ model_name: '', category_id: '', slug: '' })
  const [price, setPrice] = useState('')
  
  // Imagens e Descrições
  const [mainImg, setMainImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [backImg, setBackImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [dashImg, setDashImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [dashDesc, setDashDesc] = useState('') 
  const [seatsImg, setSeatsImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [seatsDesc, setSeatsDesc] = useState('') 

  // Arrays
  const [colors, setColors] = useState<any[]>([])
  const [configurables, setConfigurables] = useState<any[]>([]) // Lista Unificada

  // Banners
  const [banners, setBanners] = useState<any[]>([])
  const [bFormData, setBFormData] = useState({ title: '', subtitle: '' })
  const [bImage, setBImage] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [bLoading, setBLoading] = useState(false)

  useEffect(() => { loadInitialData() }, [])

  async function loadInitialData() {
    const { data: cats } = await supabase.from('categories').select('*')
    if (cats) setCategories(cats)
    const { data: bans } = await supabase.from('hero_slides').select('*').order('created_at', { ascending: false })
    if (bans) setBanners(bans)
    fetchVehicles()
  }

  async function fetchVehicles() {
    const { data: vecs } = await supabase.from('vehicles').select('*, categories(name)').order('created_at', { ascending: false })
    if (vecs) setVehicleList(vecs)
  }

  const formatMoneyInput = (val: string) => {
    const numbers = val.replace(/\D/g, "")
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(numbers) / 100)
  }
  const parseMoney = (val: string) => Number(val.replace(/[^0-9,-]+/g,"").replace(",", "."))

  const handleNameChange = (e: any) => {
    const name = e.target.value
    if (!editingId) {
        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, '-')
        setFormData({ ...formData, model_name: name, slug: slug })
    } else {
        setFormData({ ...formData, model_name: name })
    }
  }

  const uploadToSupabase = async (file: File | null, path: string, existingUrl: string | null) => {
    if (!file) return existingUrl
    const ext = file.name.split('.').pop()
    const finalPath = `${path}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('cars').upload(finalPath, file)
    if (error) throw error
    return supabase.storage.from('cars').getPublicUrl(finalPath).data.publicUrl
  }

  const startEditing = (v: any) => {
    setEditingId(v.id)
    setFormData({ model_name: v.model_name, category_id: v.category_id, slug: v.slug })
    setPrice(formatMoneyInput(v.price_start.toString() + '00'))
    
    setMainImg({ file: null, url: v.image_url })
    setBackImg({ file: null, url: v.image_back_url || null })
    
    setDashImg({ file: null, url: v.interior_images?.dash || null })
    setDashDesc(v.interior_images?.dash_desc || '') 
    setSeatsImg({ file: null, url: v.interior_images?.seats || null })
    setSeatsDesc(v.interior_images?.seats_desc || '') 
    
    if (v.exterior_colors) setColors(v.exterior_colors.map((c: any) => ({ ...c, id: crypto.randomUUID(), file: null, preview: c.image, priceFormatted: formatMoneyInput((c.price || 0).toString() + '00') })))
    else setColors([{ id: crypto.randomUUID(), name: 'Padrão', hex: '#000000', price: 0, priceFormatted: 'R$ 0,00', file: null, preview: null }])

    let merged: any[] = [];
    if (v.wheels) merged = merged.concat(v.wheels.map((w: any) => ({ ...w, id: crypto.randomUUID(), type: 'wheel', file: null, preview: w.image, priceFormatted: formatMoneyInput((w.price || 0).toString() + '00') })))
    if (v.seat_types) merged = merged.concat(v.seat_types.map((s: any) => ({ ...s, id: crypto.randomUUID(), type: 'seat', file: null, preview: s.image, priceFormatted: formatMoneyInput((s.price || 0).toString() + '00') })))
    if (v.accessories) {
        merged = merged.concat(v.accessories.map((a: any) => ({
            ...a,
            id: crypto.randomUUID(),
            type: a.type === 'exterior' ? 'acc_ext' : 'acc_int',
            file: null, 
            preview: a.image, 
            priceFormatted: formatMoneyInput((a.price || 0).toString() + '00') 
        })))
    }
    setConfigurables(merged);
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setFormData({ model_name: '', category_id: '', slug: '' })
    setPrice('')
    setMainImg({ file: null, url: null }); setBackImg({ file: null, url: null }); 
    setDashImg({ file: null, url: null }); setDashDesc('');
    setSeatsImg({ file: null, url: null }); setSeatsDesc('');
    setColors([{ id: crypto.randomUUID(), name: 'Padrão', hex: '#000000', price: 0, priceFormatted: 'R$ 0,00', file: null, preview: null }])
    setConfigurables([])
  }

  const handleReplicate = async () => {
    if (!formData.model_name) return alert("Preencha o nome do modelo.");
    const baseName = formData.model_name.split(' ')[0]; 
    if (!confirm(`Replicar para TODOS os "${baseName}"?`)) return;

    setRLoading(true);
    try {
        const category = categories.find(c => c.id === Number(formData.category_id));
        const basePath = `${category?.slug}/${formData.slug}`;

        const finalWheels = []
        const finalSeatTypes = []
        const finalAccessories = []

        for (const item of configurables) {
            const itemUrl = await uploadToSupabase(item.file, `${basePath}/item-${item.type}-${item.name}`, item.preview)
            const cleanItem = { id: item.id, name: item.name, price: parseMoney(item.priceFormatted), image: itemUrl }

            if (item.type === 'wheel') finalWheels.push(cleanItem)
            else if (item.type === 'seat') finalSeatTypes.push(cleanItem)
            else if (item.type === 'acc_ext') finalAccessories.push({ ...cleanItem, type: 'exterior' })
            else if (item.type === 'acc_int') finalAccessories.push({ ...cleanItem, type: 'interior' })
        }

        const { error } = await supabase.from('vehicles')
            .update({ wheels: finalWheels, seat_types: finalSeatTypes, accessories: finalAccessories })
            .ilike('model_name', `${baseName}%`);
        
        if (error) throw error;
        alert(`Sucesso! Itens copiados.`);
    } catch (error: any) { alert("Erro: " + error.message); } finally { setRLoading(false); }
  }

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setVLoading(true)
    try {
      if (!formData.category_id) throw new Error("Categoria obrigatória!")
      const category = categories.find(c => c.id === Number(formData.category_id))
      const basePath = `${category?.slug}/${formData.slug}`
      
      const mainUrl = await uploadToSupabase(mainImg.file, `${basePath}/capa`, mainImg.url)
      const backUrl = await uploadToSupabase(backImg.file, `${basePath}/capa-traseira`, backImg.url)
      const dashUrl = await uploadToSupabase(dashImg.file, `${basePath}/interior-painel`, dashImg.url)
      let seatsUrl = await uploadToSupabase(seatsImg.file, `${basePath}/interior-bancos`, seatsImg.url)
      
      if (!mainUrl || !dashUrl) throw new Error("Capa e Painel obrigatórios!")
      if (!seatsUrl) seatsUrl = dashUrl;

      const finalColors = []
      for (const col of colors) {
        const colUrl = await uploadToSupabase(col.file, `${basePath}/cor-${col.name}`, col.preview)
        finalColors.push({ name: col.name, hex: col.hex, price: parseMoney(col.priceFormatted), image: colUrl })
      }

      const finalWheels = []
      const finalSeatTypes = []
      const finalAccessories = []

      for (const item of configurables) {
          const itemUrl = await uploadToSupabase(item.file, `${basePath}/item-${item.type}-${item.name}`, item.preview)
          const cleanItem = { id: item.id, name: item.name, price: parseMoney(item.priceFormatted), image: itemUrl }

          if (item.type === 'wheel') finalWheels.push(cleanItem)
          else if (item.type === 'seat') finalSeatTypes.push(cleanItem)
          else if (item.type === 'acc_ext') finalAccessories.push({ ...cleanItem, type: 'exterior' })
          else if (item.type === 'acc_int') finalAccessories.push({ ...cleanItem, type: 'interior' })
      }

      const defaultSeatUrl = finalSeatTypes.length > 0 ? finalSeatTypes[0].image : seatsUrl;

      const payload = {
        model_name: formData.model_name,
        slug: formData.slug,
        price_start: parseMoney(price),
        category_id: Number(formData.category_id),
        image_url: mainUrl,
        image_back_url: backUrl,
        interior_images: { 
            dash: dashUrl, 
            dash_desc: dashDesc, 
            seats: defaultSeatUrl,
            seats_desc: seatsDesc 
        },
        exterior_colors: finalColors,
        wheels: finalWheels,
        seat_types: finalSeatTypes,
        accessories: finalAccessories
      }

      if (editingId) {
         const { error } = await supabase.from('vehicles').update(payload).eq('id', editingId)
         if (error) throw error
         alert("Salvo com sucesso!")
      } else {
         const { error } = await supabase.from('vehicles').insert(payload)
         if (error) throw error
         alert("Veículo cadastrado!")
      }
      fetchVehicles(); cancelEditing()
    } catch (err: any) { alert("Erro: " + err.message) } finally { setVLoading(false) }
  }

  const deleteVehicle = async (id: number) => { if(confirm("Apagar?")) { await supabase.from('vehicles').delete().eq('id', id); fetchVehicles(); if (editingId === id) cancelEditing() } }
  const handleBannerSubmit = async (e: React.FormEvent) => { e.preventDefault(); setBLoading(true); try { const imageUrl = await uploadToSupabase(bImage.file, 'banners', null); await supabase.from('hero_slides').insert({ title: bFormData.title, subtitle: bFormData.subtitle, image_url: imageUrl }); setBFormData({ title: '', subtitle: '' }); setBImage({ file: null, url: null }); loadInitialData() } catch (err: any) { alert("Erro: " + err.message) } finally { setBLoading(false) } }
  const deleteBanner = async (id: number) => { if(confirm("Apagar?")) { await supabase.from('hero_slides').delete().eq('id', id); loadInitialData() } }

  const ConfigurableList = () => {
     const addItem = () => setConfigurables([...configurables, { id: crypto.randomUUID(), name: '', priceFormatted: 'R$ 0,00', type: 'acc_ext', file: null, preview: null }])
     const updateItem = (i: number, field: string, val: any) => { const n = [...configurables]; n[i][field] = val; setConfigurables(n) }
     const removeItem = (i: number) => { const n = [...configurables]; n.splice(i, 1); setConfigurables(n) }

     return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between mb-4">
                <h2 className="text-sm font-bold uppercase text-gray-800 flex items-center gap-2"><Settings size={16}/> Itens de Configuração</h2>
                <button type="button" onClick={addItem} className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded hover:bg-gray-800 transition-colors">+ Adicionar Item</button>
            </div>
            <div className="space-y-4">
                {configurables.map((item: any, i: number) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start border-b border-gray-100 pb-4 last:border-0 animate-in fade-in bg-gray-50/50 p-3 rounded-xl">
                        <div className="w-full md:w-40">
                            <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Tipo</label>
                            <select className={`w-full h-10 px-2 text-xs font-bold uppercase border-2 rounded focus:outline-none ${item.type === 'wheel' ? 'border-blue-200 text-blue-600 bg-blue-50' : item.type === 'seat' ? 'border-purple-200 text-purple-600 bg-purple-50' : item.type === 'acc_ext' ? 'border-orange-200 text-orange-600 bg-orange-50' : 'border-green-200 text-green-600 bg-green-50'}`} value={item.type} onChange={e => updateItem(i, 'type', e.target.value)}>
                                <option value="wheel">Roda</option>
                                <option value="seat">Tipo de Banco</option>
                                <option value="acc_ext">Acessório (Externo)</option>
                                <option value="acc_int">Acessório (Interno)</option>
                            </select>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-2 w-full">
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome</label><input className="border rounded h-10 px-3 w-full text-sm bg-white" value={item.name} onChange={e=>updateItem(i, 'name', e.target.value)} placeholder="Ex: Item XYZ"/></div>
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Preço (+)</label><input className="border rounded h-10 px-3 w-full text-sm bg-white" value={item.priceFormatted} onChange={e=>updateItem(i, 'priceFormatted', formatMoneyInput(e.target.value))}/></div>
                        </div>
                        <div className="w-full md:w-24"><ImageUpload label="Foto" file={item.file} previewUrl={item.preview} setFile={(f:any, u:any)=>{updateItem(i,'file',f); updateItem(i,'preview',u)}}/></div>
                        <button type="button" onClick={() => removeItem(i)} className="mt-6 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-lg shadow-sm transition-all"><Trash2 size={16}/></button>
                    </div>
                ))}
                {configurables.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">Nenhum item adicionado.</p>}
            </div>
        </div>
     )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center mb-10">
            <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/chevrolet-bowtie-120.svg" alt="Chevrolet" className="h-10 mb-4 object-contain" />
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel Administrativo</h1>
            <div className="bg-white p-1 rounded-full shadow-sm border border-gray-200 inline-flex">
                <button onClick={() => setActiveTab('vehicles')} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'vehicles' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}>Veículos</button>
                <button onClick={() => setActiveTab('banners')} className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'banners' ? 'bg-black text-white shadow' : 'text-gray-500 hover:text-black'}`}>Banners</button>
            </div>
        </div>

        {activeTab === 'vehicles' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                 <h2 className="text-xl font-bold text-gray-800">Estoque ({vehicleList.length})</h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vehicleList.map(v => (
                        <div key={v.id} className={`p-4 rounded-xl border flex gap-4 items-center transition-all ${editingId === v.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="w-20 h-20 bg-white rounded-lg shrink-0 overflow-hidden border border-gray-100"><img src={v.image_url} className="w-full h-full object-contain" /></div>
                            <div className="flex-1 min-w-0"><h3 className="font-bold text-base text-gray-900 truncate">{v.model_name}</h3><p className="text-sm text-gray-500 font-mono">{formatMoneyInput(v.price_start.toString() + '00')}</p></div>
                            <div className="flex gap-1">
                                <Link href={`/configurador?id=${v.id}`} target="_blank" className="p-2 text-green-600 hover:bg-green-50 rounded-full"><Eye size={18} /></Link>
                                <button onClick={() => startEditing(v)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"><Pencil size={18} /></button>
                                <button onClick={() => deleteVehicle(v.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
              <div className="border-t border-gray-200 my-8"></div>

              <form onSubmit={handleVehicleSubmit} className={`space-y-6 relative ${editingId ? 'p-6 bg-blue-50/50 rounded-3xl border border-blue-100' : ''}`}>
                 <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{editingId ? <Pencil className="bg-blue-600 text-white rounded-full p-1.5 w-7 h-7"/> : <Plus className="bg-black text-white rounded-full p-1 w-6 h-6"/>} {editingId ? 'Editando Veículo' : 'Cadastrar Novo Veículo'}</h2>
                    {editingId && <button type="button" onClick={cancelEditing} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"><Ban size={14}/> Cancelar Edição</button>}
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Modelo</label><input value={formData.model_name} className="w-full mt-1 h-10 px-3 border rounded focus:ring-1 focus:ring-black outline-none" onChange={handleNameChange} required /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Categoria</label><select value={formData.category_id} className="w-full mt-1 h-10 px-3 border rounded bg-white" onChange={e => setFormData({...formData, category_id: e.target.value})} required><option value="">Selecione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Preço Base</label><input value={price} className="w-full mt-1 h-10 px-3 border rounded" onChange={e => setPrice(formatMoneyInput(e.target.value))} required /></div>
                        <div className="md:col-span-1.5"><ImageUpload label="Capa do Carro (Frente)" file={mainImg.file} previewUrl={mainImg.url} setFile={(f:any, u:any) => setMainImg({file:f, url:u})} /></div>
                        <div className="md:col-span-1.5"><ImageUpload label="Vista Traseira (Opcional)" file={backImg.file} previewUrl={backImg.url} setFile={(f:any, u:any) => setBackImg({file:f, url:u})} /></div>
                    </div>
                 </div>
                 
                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-sm font-bold mb-4 uppercase text-gray-400">Interior (Padrão)</h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <ImageUpload label="1. Painel (Obrigatório)" file={dashImg.file} previewUrl={dashImg.url} setFile={(f:any,u:any) => setDashImg({file:f, url:u})} />
                            <input value={dashDesc} onChange={e => setDashDesc(e.target.value)} className="w-full mt-2 border rounded h-9 px-2 text-xs" placeholder="Descrição do Painel (Ex: Soft-touch preto)" />
                        </div>
                        <div>
                            <ImageUpload label="2. Bancos Padrão (Opcional)" file={seatsImg.file} previewUrl={seatsImg.url} setFile={(f:any,u:any) => setSeatsImg({file:f, url:u})} />
                            <input value={seatsDesc} onChange={e => setSeatsDesc(e.target.value)} className="w-full mt-2 border rounded h-9 px-2 text-xs" placeholder="Descrição dos Bancos (Ex: Tecido Hybrid)" />
                        </div>
                    </div>
                 </div>

                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between mb-4"><h2 className="text-sm font-bold uppercase text-gray-400">Pintura e Cores</h2><button type="button" onClick={() => setColors([...colors, {id:crypto.randomUUID(), name:'', hex:'#000', priceFormatted: 'R$ 0,00', file:null, preview:null}])} className="text-xs font-bold bg-black text-white px-2 py-1 rounded">+ Cor</button></div>
                    <div className="space-y-3">
                        {colors.map((c, i) => (
                            <div key={c.id} className="flex gap-3 items-end border-b border-gray-50 pb-3 last:border-0">
                                <div className="flex-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Nome</label><input className="border rounded h-9 px-2 w-full text-sm" value={c.name} onChange={e=>{const nc=[...colors];nc[i].name=e.target.value;setColors(nc)}}/></div>
                                <div className="w-24"><label className="text-[10px] font-bold text-gray-400 uppercase">Preço (+)</label><input className="border rounded h-9 px-2 w-full text-sm" value={c.priceFormatted} onChange={e=>{const nc=[...colors];nc[i].priceFormatted=formatMoneyInput(e.target.value);setColors(nc)}}/></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase">Cor</label><input type="color" className="border rounded h-9 w-10 p-0.5" value={c.hex} onChange={e=>{const nc=[...colors];nc[i].hex=e.target.value;setColors(nc)}}/></div>
                                <div className="w-20"><ImageUpload label="Foto" file={c.file} previewUrl={c.preview} setFile={(f:any, u:any)=>{const nc=[...colors];nc[i].file=f;nc[i].preview=u;setColors(nc)}}/></div>
                                <button type="button" onClick={() => { const nc = [...colors]; nc.splice(i, 1); setColors(nc); }} className="p-2 mb-1 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                 </div>

                 <ConfigurableList />

                 <div className="flex gap-4">
                    <button disabled={vLoading} type="submit" className={`flex-1 py-4 rounded-xl font-bold text-white uppercase text-sm tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}>
                        {vLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {vLoading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={handleReplicate} disabled={rLoading} className="px-6 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all">
                            {rLoading ? <Loader2 className="animate-spin" size={16}/> : <Copy size={16} />}
                            {rLoading ? 'Copiando...' : 'Replicar para Similares'}
                        </button>
                    )}
                 </div>
              </form>
            </div>
        )}

        {activeTab === 'banners' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleBannerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Título</label><input className="w-full mt-1 h-10 px-3 text-sm border rounded" value={bFormData.title} onChange={e => setBFormData({...bFormData, title: e.target.value})} required /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Subtítulo</label><input className="w-full mt-1 h-10 px-3 text-sm border rounded" value={bFormData.subtitle} onChange={e => setBFormData({...bFormData, subtitle: e.target.value})} required /></div>
                        <button disabled={bLoading} type="submit" className="w-full h-10 bg-black text-white font-bold uppercase text-xs rounded hover:bg-gray-800 mt-2">{bLoading ? '...' : 'Adicionar Banner'}</button>
                    </div>
                    <div><ImageUpload label="Imagem (1920x1080)" file={bImage.file} previewUrl={bImage.url} setFile={(f:any, u:any) => setBImage({file:f, url:u})} /></div>
                </form>
                <div className="grid grid-cols-1 gap-4 mt-6">
                    {banners.map((banner) => (
                        <div key={banner.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-4 shadow-sm"><div className="w-24 h-16 bg-gray-100 rounded overflow-hidden shrink-0"><img src={banner.image_url} className="w-full h-full object-cover" /></div><div className="flex-1"><h4 className="font-bold text-sm">{banner.title}</h4></div><button onClick={() => deleteBanner(banner.id)} className="p-2 text-red-500"><Trash2 size={18} /></button></div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}