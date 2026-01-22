"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, UploadCloud, Plus, Pencil, Ban, Eye, Loader2, X, Copy, Save, Settings, Palette, EyeOff, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

// --- INTERFACES ---
interface UploadProps {
  label?: string;
  file?: File | null;
  previewUrl?: string | null;
  onRemove?: () => void;
  onSelect?: (file: File, url: string) => void;
  setFile?: (file: File | null, url: string | null) => void;
}

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  priceFormatted: string;
  files: Record<string, File | null>;
  previews: Record<string, string | null>;
}

interface ConfigurableItem {
  id: string;
  name: string;
  priceFormatted: string;
  type: string;
  file: File | null;
  preview: string | null;
}

// --- UPLOAD MINI (Componente Puro) ---
const MiniUpload = ({ label, previewUrl, onRemove, onSelect }: UploadProps) => {
  return (
    <div className="w-full">
      <label className="block text-[9px] font-bold uppercase text-gray-400 mb-1 truncate" title={label}>{label}</label>
      <div className={`relative h-20 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group 
        ${previewUrl ? 'border-green-500 bg-green-50/30' : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'}`}>
        <input 
          type="file" 
          accept="image/*" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
          onChange={(e) => {
            const f = e.target.files?.[0];
            if(f && onSelect) {
                onSelect(f, URL.createObjectURL(f));
                e.target.value = ""; 
            }
          }} 
        />
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-1 z-10" />
            <div className="absolute top-1 right-1 z-30">
               <button type="button" onClick={(e) => { e.preventDefault(); if(onRemove) onRemove() }} className="bg-red-500 text-white p-1 rounded-full shadow hover:scale-110 z-40 cursor-pointer"><X size={10} /></button>
            </div>
          </>
        ) : (
          <div className="text-center p-1"><Plus className="mx-auto h-5 w-5 text-gray-300" /></div>
        )}
      </div>
    </div>
  )
}

// --- UPLOAD PADRÃO (Componente Puro) ---
const ImageUpload = ({ label, previewUrl, setFile }: UploadProps) => {
    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile && setFile) {
        setFile(selectedFile, URL.createObjectURL(selectedFile))
      }
      e.target.value = ""; 
    }
    
    const handleRemove = (e: any) => { e.preventDefault(); e.stopPropagation(); if(setFile) setFile(null, null); }
  
    return (
      <div className="w-full">
        {label && <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">{label}</label>}
        <div className={`relative h-24 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group 
          ${previewUrl ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFile} />
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-1 z-10" />
              <div className="absolute top-1 right-1 z-30">
                  <button type="button" onClick={handleRemove} className="bg-red-500 text-white p-1 rounded-full shadow hover:scale-110 z-40 cursor-pointer"><Trash2 size={12} /></button>
              </div>
            </>
          ) : (
            <div className="text-center p-1"><UploadCloud className="mx-auto h-5 w-5 text-gray-400" /></div>
          )}
        </div>
      </div>
    )
}

// --- COMPONENTES EXTRAÍDOS ---
const ColorList = ({ colors, setColors, formatMoneyInput, preventSubmit }: any) => {
    const addColor = () => setColors([...colors, {id:crypto.randomUUID(), name:'', hex:'#000000', priceFormatted: 'R$ 0,00', files: {}, previews: {} }])
    
    const updateName = (i: number, val: string) => { const n = [...colors]; n[i].name = val; setColors(n); }
    const updatePrice = (i: number, val: string) => { const n = [...colors]; n[i].priceFormatted = formatMoneyInput(val); setColors(n); }
    const updateHex = (i: number, val: string) => { const n = [...colors]; n[i].hex = val; setColors(n); }
    const removeColor = (i: number) => { const n = [...colors]; n.splice(i, 1); setColors(n) }
    
    const updateColorFile = (i: number, view: string, file: File | null, url: string | null) => {
        const n = [...colors];
        if(!n[i].files) n[i].files = {};
        if(!n[i].previews) n[i].previews = {};
        n[i].files[view] = file;
        n[i].previews[view] = url;
        setColors(n);
    }

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold uppercase text-gray-800 flex items-center gap-2"><Palette size={16}/> Cores</h2>
              <button type="button" onClick={addColor} className="text-[10px] font-bold bg-black text-white px-3 py-1.5 rounded">+ Adicionar Cor</button>
          </div>
          <div className="space-y-6">
              {colors.map((c: ColorItem, i: number) => (
                  <div key={c.id} className="border-b border-gray-100 pb-6 last:border-0 bg-gray-50/50 p-4 rounded-xl">
                      <div className="flex gap-3 items-end mb-4">
                          <div className="flex-1">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Nome</label>
                              <input onKeyDown={preventSubmit} className="border rounded h-9 px-2 w-full text-sm" value={c.name} onChange={e=>updateName(i, e.target.value)} placeholder="Ex: Branco Summit"/>
                          </div>
                          <div className="w-24">
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Preço (+)</label>
                              <input onKeyDown={preventSubmit} className="border rounded h-9 px-2 w-full text-sm" value={c.priceFormatted} onChange={e=>updatePrice(i, e.target.value)}/>
                          </div>
                          <div>
                              <label className="text-[9px] font-bold text-gray-400 uppercase">Hex</label>
                              <input type="color" className="border rounded h-9 w-10 p-0.5 cursor-pointer" value={c.hex} onChange={e=>updateHex(i, e.target.value)}/>
                          </div>
                          <button type="button" onClick={() => removeColor(i)} className="mb-1 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          <MiniUpload label="1. Frente" previewUrl={c.previews?.front} onRemove={()=>updateColorFile(i,'front',null,null)} onSelect={(f,u)=>updateColorFile(i,'front',f,u)} />
                          <MiniUpload label="2. Lado" previewUrl={c.previews?.side} onRemove={()=>updateColorFile(i,'side',null,null)} onSelect={(f,u)=>updateColorFile(i,'side',f,u)} />
                          <MiniUpload label="3. Ângulo" previewUrl={c.previews?.rear_angle} onRemove={()=>updateColorFile(i,'rear_angle',null,null)} onSelect={(f,u)=>updateColorFile(i,'rear_angle',f,u)} />
                          <MiniUpload label="4. Detalhe" previewUrl={c.previews?.front_detail} onRemove={()=>updateColorFile(i,'front_detail',null,null)} onSelect={(f,u)=>updateColorFile(i,'front_detail',f,u)} />
                          <MiniUpload label="5. Traseira" previewUrl={c.previews?.rear} onRemove={()=>updateColorFile(i,'rear',null,null)} onSelect={(f,u)=>updateColorFile(i,'rear',f,u)} />
                      </div>
                  </div>
              ))}
          </div>
      </div>
    )
}

const ConfigurableList = ({ configurables, setConfigurables, formatMoneyInput, preventSubmit }: any) => {
    const addItem = () => setConfigurables([...configurables, { id: crypto.randomUUID(), name: '', priceFormatted: 'R$ 0,00', type: 'acc_ext', file: null, preview: null }])
    
    const updateType = (i: number, val: string) => { const n = [...configurables]; n[i].type = val; setConfigurables(n); }
    const updateName = (i: number, val: string) => { const n = [...configurables]; n[i].name = val; setConfigurables(n); }
    const updatePrice = (i: number, val: string) => { const n = [...configurables]; n[i].priceFormatted = formatMoneyInput(val); setConfigurables(n); }
    const updateFile = (i: number, file: File|null, url: string|null) => { const n = [...configurables]; n[i].file = file; n[i].preview = url; setConfigurables(n); }
    const removeItem = (i: number) => { const n = [...configurables]; n.splice(i, 1); setConfigurables(n) }

    return (
       <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
           <div className="flex justify-between mb-4"><h2 className="text-sm font-bold uppercase text-gray-800 flex items-center gap-2"><Settings size={16}/> Itens de Configuração</h2><button type="button" onClick={addItem} className="text-xs font-bold bg-black text-white px-3 py-1.5 rounded">+ Adicionar</button></div>
           <div className="space-y-4">{configurables.map((item: ConfigurableItem, i: number) => (
               <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start border-b border-gray-100 pb-4 bg-gray-50/50 p-3 rounded-xl">
                   <div className="w-full md:w-40"><label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Tipo</label><select className="w-full h-9 px-2 text-xs border rounded bg-white" value={item.type} onChange={e => updateType(i, e.target.value)}><option value="wheel">Roda</option><option value="seat">Banco</option><option value="acc_ext">Aces. Externo</option><option value="acc_int">Aces. Interno</option></select></div>
                   <div className="flex-1 grid grid-cols-2 gap-2 w-full"><div><label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Nome</label><input onKeyDown={preventSubmit} className="border rounded h-9 px-2 w-full text-sm" value={item.name} onChange={e=>updateName(i, e.target.value)}/></div><div><label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Preço (+)</label><input onKeyDown={preventSubmit} className="border rounded h-9 px-2 w-full text-sm" value={item.priceFormatted} onChange={e=>updatePrice(i, e.target.value)}/></div></div>
                   <div className="w-full md:w-20"><ImageUpload label="Foto" previewUrl={item.preview} setFile={(f, u)=>updateFile(i, f, u)}/></div>
                   <button type="button" onClick={() => removeItem(i)} className="mt-5 text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={16}/></button>
               </div>
           ))}</div>
       </div>
    )
}

// --- PÁGINA PRINCIPAL ---
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
  const [isVisible, setIsVisible] = useState(true) 
  const [transmissionType, setTransmissionType] = useState('automatic')
  
  // Imagens
  const [mainImg, setMainImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [dashImg, setDashImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [dashDesc, setDashDesc] = useState('') 
  const [seatsImg, setSeatsImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [seatsDesc, setSeatsDesc] = useState('') 

  // Listas Complexas
  const [colors, setColors] = useState<ColorItem[]>([])
  const [configurables, setConfigurables] = useState<ConfigurableItem[]>([])

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
  const parseMoney = (val: string) => {
      if(!val) return 0;
      return Number(val.replace(/[^0-9,-]+/g,"").replace(",", "."))
  }

  const handleNameChange = (e: any) => {
    const name = e.target.value
    if (!editingId) {
        const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, '-')
        setFormData(prev => ({ ...prev, model_name: name, slug: slug }))
    } else {
        setFormData(prev => ({ ...prev, model_name: name }))
    }
  }

  const preventSubmit = (e: React.KeyboardEvent) => { if (e.key === 'Enter') e.preventDefault(); }

  const uploadToSupabase = async (file: File | null, path: string, existingUrl: string | null) => {
    if (!file) return existingUrl
    const cleanPath = path.replace(/[^a-zA-Z0-9\-\/]/g, '_').toLowerCase(); 
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const finalPath = `${cleanPath}/${fileName}`;

    try {
        const { error } = await supabase.storage.from('cars').upload(finalPath, file, { cacheControl: '3600', upsert: false })
        if (error) throw error;
        const { data: publicData } = supabase.storage.from('cars').getPublicUrl(finalPath);
        return publicData.publicUrl;
    } catch (err) {
        console.error("FALHA NO UPLOAD:", err);
        return existingUrl; 
    }
  }

  const startEditing = (v: any) => {
    setEditingId(v.id)
    setFormData({ model_name: v.model_name, category_id: v.category_id, slug: v.slug })
    setPrice(formatMoneyInput(v.price_start.toString() + '00'))
    setIsVisible(v.is_visible !== false)
    setTransmissionType(v.transmission_type || 'automatic')
    
    setMainImg({ file: null, url: v.image_url })
    setDashImg({ file: null, url: v.interior_images?.dash || null })
    setDashDesc(v.interior_images?.dash_desc || '') 
    setSeatsImg({ file: null, url: v.interior_images?.seats || null })
    setSeatsDesc(v.interior_images?.seats_desc || '') 
    
    // Cores
    if (v.exterior_colors) {
        setColors(v.exterior_colors.map((c: any) => ({ 
            ...c, 
            id: crypto.randomUUID(),
            priceFormatted: formatMoneyInput((c.price || 0).toString() + '00'),
            files: {}, 
            previews: c.images || (c.image ? { front: c.image } : {})
        })))
    } else {
        setColors([{ id: crypto.randomUUID(), name: 'Padrão', hex: '#000000', priceFormatted: 'R$ 0,00', files: {}, previews: {} }])
    }

    // Configuráveis
    let merged: ConfigurableItem[] = [];
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
    setIsVisible(true)
    setTransmissionType('automatic')
    setMainImg({ file: null, url: null })
    setDashImg({ file: null, url: null }); setDashDesc('');
    setSeatsImg({ file: null, url: null }); setSeatsDesc('');
    setColors([{ id: crypto.randomUUID(), name: 'Padrão', hex: '#000000', priceFormatted: 'R$ 0,00', files: {}, previews: {} }])
    setConfigurables([])
  }

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setVLoading(true)
    try {
      if (!formData.category_id) throw new Error("Categoria obrigatória!")
      const category = categories.find(c => c.id === Number(formData.category_id))
      const basePath = `${category?.slug}/${formData.slug}`
      
      const mainUrl = await uploadToSupabase(mainImg.file, `${basePath}/capa`, mainImg.url)
      const dashUrl = await uploadToSupabase(dashImg.file, `${basePath}/interior-painel`, dashImg.url)
      let seatsUrl = await uploadToSupabase(seatsImg.file, `${basePath}/interior-bancos`, seatsImg.url)
      if (!dashUrl) throw new Error("Painel obrigatório!")
      if (!seatsUrl) seatsUrl = dashUrl;

      // Upload Cores
      const finalColors = []
      for (const col of colors) {
        const images: any = {}
        const viewKeys = ['front', 'side', 'rear_angle', 'front_detail', 'rear'];
        for (const key of viewKeys) {
            const file = col.files?.[key];
            const oldUrl = col.previews?.[key];
            if (file) {
                images[key] = await uploadToSupabase(file, `${basePath}/cor-${col.name}-${key}`, oldUrl);
            } else {
                images[key] = oldUrl || null;
            }
        }
        if (!images.front) throw new Error(`A cor ${col.name} precisa de pelo menos a foto de FRENTE.`);
        finalColors.push({ 
            name: col.name, hex: col.hex, price: parseMoney(col.priceFormatted), 
            image: images.front, images: images
        })
      }

      // Upload Configuráveis
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
        is_visible: isVisible, 
        transmission_type: transmissionType,
        image_url: mainUrl, 
        interior_images: { dash: dashUrl, dash_desc: dashDesc, seats: defaultSeatUrl, seats_desc: seatsDesc },
        exterior_colors: finalColors,
        wheels: finalWheels,
        seat_types: finalSeatTypes,
        accessories: finalAccessories
      }

      if (editingId) {
         const { error } = await supabase.from('vehicles').update(payload).eq('id', editingId)
         if (error) throw error
         alert("Atualizado com sucesso!")
      } else {
         const { error } = await supabase.from('vehicles').insert(payload)
         if (error) throw error
         alert("Cadastrado com sucesso!")
      }
      fetchVehicles(); cancelEditing()
    } catch (err: any) { alert("Erro: " + err.message) } finally { setVLoading(false) }
  }

  const handleReplicate = async () => {
    if (!formData.model_name) return alert("Preencha o nome do modelo.");
    const baseName = formData.model_name.split(' ')[0]; 
    if (!confirm(`Replicar ITENS DE CONFIGURAÇÃO (Rodas/Bancos/Acessórios) para "${baseName}"?`)) return;

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

  const deleteVehicle = async (id: number) => { if(confirm("Apagar?")) { await supabase.from('vehicles').delete().eq('id', id); fetchVehicles(); if (editingId === id) cancelEditing() } }
  const handleBannerSubmit = async (e: React.FormEvent) => { e.preventDefault(); setBLoading(true); try { const imageUrl = await uploadToSupabase(bImage.file, 'banners', null); await supabase.from('hero_slides').insert({ title: bFormData.title, subtitle: bFormData.subtitle, image_url: imageUrl }); setBFormData({ title: '', subtitle: '' }); setBImage({ file: null, url: null }); loadInitialData() } catch (err: any) { alert("Erro: " + err.message) } finally { setBLoading(false) } }
  const deleteBanner = async (id: number) => { if(confirm("Apagar?")) { await supabase.from('hero_slides').delete().eq('id', id); loadInitialData() } }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center mb-10">
            <img src="https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/parceirologo.jpg" alt="Logo" className="h-40 mb-4 object-contain" />
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
                        <div key={v.id} className={`p-4 rounded-xl border flex gap-4 items-center transition-all relative ${editingId === v.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 shadow-sm'} ${v.is_visible === false ? 'opacity-60 grayscale' : ''}`}>
                            {v.is_visible === false && (
                                <div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider"><EyeOff size={10}/> Oculto</div>
                            )}
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
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">{editingId ? <Pencil className="bg-blue-600 text-white rounded-full p-1.5 w-7 h-7"/> : <Plus className="bg-black text-white rounded-full p-1 w-6 h-6"/>} {editingId ? 'Editando' : 'Novo Veículo'}</h2>
                    {editingId && <button type="button" onClick={cancelEditing} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"><Ban size={14}/> Cancelar</button>}
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2"><label className="text-xs font-bold text-gray-500 uppercase">Modelo</label><input onKeyDown={preventSubmit} value={formData.model_name} className="w-full mt-1 h-10 px-3 border rounded focus:ring-1 focus:ring-black outline-none" onChange={handleNameChange} required /></div>
                        
                        <div className="flex items-center pt-5">
                            <button type="button" onClick={() => setIsVisible(!isVisible)} className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all w-full ${isVisible ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isVisible ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>{isVisible ? <CheckCircle2 size={12}/> : <EyeOff size={12}/>}</div>
                                <span className="text-xs font-bold uppercase">{isVisible ? 'Visível no Site' : 'Oculto (Rascunho)'}</span>
                            </button>
                        </div>

                        <div><label className="text-xs font-bold text-gray-500 uppercase">Categoria</label><select value={formData.category_id} className="w-full mt-1 h-10 px-3 border rounded bg-white" onChange={e => setFormData({...formData, category_id: e.target.value})} required><option value="">Selecione...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Preço Base</label><input onKeyDown={preventSubmit} value={price} className="w-full mt-1 h-10 px-3 border rounded" onChange={e => setPrice(formatMoneyInput(e.target.value))} required /></div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Câmbio Disponível</label>
                            <select value={transmissionType} onChange={e => setTransmissionType(e.target.value)} className="w-full mt-1 h-10 px-3 border rounded bg-white flex items-center">
                                <option value="automatic">Somente Automático</option>
                                <option value="manual">Somente Manual</option>
                                <option value="both">Automático e Manual</option>
                            </select>
                        </div>

                        <div className="md:col-span-3 mt-4"><ImageUpload label="Capa do Catálogo (Thumbnail)" previewUrl={mainImg.url} setFile={(f, u) => setMainImg({file:f, url:u})} /></div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-sm font-bold mb-4 uppercase text-gray-400">Interior (Padrão)</h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div><ImageUpload label="1. Painel" previewUrl={dashImg.url} setFile={(f,u) => setDashImg({file:f, url:u})} /><input onKeyDown={preventSubmit} value={dashDesc} onChange={e => setDashDesc(e.target.value)} className="w-full mt-2 border rounded h-9 px-2 text-xs" placeholder="Descrição do Painel" /></div>
                        <div><ImageUpload label="2. Bancos Padrão" previewUrl={seatsImg.url} setFile={(f,u) => setSeatsImg({file:f, url:u})} /><input onKeyDown={preventSubmit} value={seatsDesc} onChange={e => setSeatsDesc(e.target.value)} className="w-full mt-2 border rounded h-9 px-2 text-xs" placeholder="Descrição dos Bancos" /></div>
                    </div>
                  </div>

                  {/* CORES */}
                  <ColorList colors={colors} setColors={setColors} formatMoneyInput={formatMoneyInput} preventSubmit={preventSubmit} />

                  {/* CONFIGURÁVEIS */}
                  <ConfigurableList configurables={configurables} setConfigurables={setConfigurables} formatMoneyInput={formatMoneyInput} preventSubmit={preventSubmit} />

                  <div className="flex gap-4">
                    <button disabled={vLoading} type="submit" className={`flex-1 py-4 rounded-xl font-bold text-white uppercase text-sm tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}>
                        {vLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {vLoading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => handleReplicate()} disabled={rLoading} className="px-6 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all">
                            {rLoading ? <Loader2 className="animate-spin" size={16}/> : <Copy size={16} />}
                            {rLoading ? '...' : 'Replicar'}
                        </button>
                    )}
                  </div>
              </form>
            </div>
        )}

        {/* BANNERS */}
        {activeTab === 'banners' && (
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleBannerSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Título</label><input onKeyDown={preventSubmit} className="w-full mt-1 h-10 px-3 text-sm border rounded" value={bFormData.title} onChange={e => setBFormData({...bFormData, title: e.target.value})} required /></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Subtítulo</label><input onKeyDown={preventSubmit} className="w-full mt-1 h-10 px-3 text-sm border rounded" value={bFormData.subtitle} onChange={e => setBFormData({...bFormData, subtitle: e.target.value})} required /></div>
                        <button disabled={bLoading} type="submit" className="w-full h-10 bg-black text-white font-bold uppercase text-xs rounded hover:bg-gray-800 mt-2">{bLoading ? '...' : 'Adicionar Banner'}</button>
                    </div>
                    <div><ImageUpload label="Imagem (1920x1080)" previewUrl={bImage.url} setFile={(f, u) => setBImage({file:f, url:u})} /></div>
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