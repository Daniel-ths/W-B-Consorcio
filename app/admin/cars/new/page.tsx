"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Trash2, UploadCloud, Plus, Pencil, Ban, Eye, Loader2, X, Copy, Save, Settings, Palette, EyeOff, CheckCircle2, Square, CheckSquare, Check, Image as ImageIcon, Grid, ChevronRight, Car, Upload } from 'lucide-react'
import Link from 'next/link'

// --- INTERFACES ---
interface UploadProps {
  label?: string;
  file?: File | null;
  previewUrl?: string | null;
  onRemove?: () => void;
  onSelect?: (file: File, url: string) => void;
  setFile?: (file: File | null, url: string | null) => void;
  onOpenLibrary?: () => void; 
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

// --- COMPONENTES AUXILIARES ---

// MODAL DA GALERIA DE IMAGENS (COM UPLOAD EM MASSA)
const ImageGalleryModal = ({ 
    isOpen, 
    onClose, 
    onSelect, 
    vehicles, 
    onBatchUpload, // Função para subir arquivos
    isUploading // Estado de loading do upload
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSelect: (url: string) => void, 
    vehicles: any[],
    onBatchUpload: (files: FileList) => Promise<void>,
    isUploading: boolean
}) => {
    const [selectedVehicleId, setSelectedVehicleId] = useState<number | 'recent'>('recent');
    const [recentImages, setRecentImages] = useState<{url: string, name: string}[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Organiza as imagens por veículo (existentes no banco)
    const vehiclesWithImages = useMemo(() => {
        return vehicles.map(v => {
            const images: { url: string, label: string }[] = [];
            
            if (v.image_url) images.push({ url: v.image_url, label: "Capa" });
            if (v.card_image_url) images.push({ url: v.card_image_url, label: "Card Banner" });
            if (v.interior_images?.dash) images.push({ url: v.interior_images.dash, label: "Painel" });
            if (v.interior_images?.seats) images.push({ url: v.interior_images.seats, label: "Bancos" });
            
            v.exterior_colors?.forEach((c: any) => {
                if (c.image) images.push({ url: c.image, label: `Cor: ${c.name}` });
                if (c.images) { Object.keys(c.images).forEach(k => { if(c.images[k]) images.push({url: c.images[k], label: `Cor: ${c.name} (${k})`}) }) }
            });
            v.wheels?.forEach((w: any) => { if (w.image) images.push({ url: w.image, label: `Roda: ${w.name}` }); });
            v.accessories?.forEach((a: any) => { if (a.image) images.push({ url: a.image, label: `Aces: ${a.name}` }); });

            const uniqueImages = images.filter((img, index, self) => index === self.findIndex((t) => t.url === img.url));

            return { id: v.id, model_name: v.model_name, images: uniqueImages };
        }).filter(v => v.images.length > 0);
    }, [vehicles]);

    // Função interna para processar o upload e atualizar a lista local "Recentes"
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await onBatchUpload(e.target.files);
            // Adiciona as URLs geradas (que o pai deve retornar ou gerenciar, mas aqui vamos simular pegando do pai se ele atualizasse, 
            // mas como o upload é async, vamos depender do pai atualizar a lista ou retornarmos as urls. 
            // SIMPLIFICAÇÃO: O pai retorna as URLs ou nós criamos previews locais. 
            // O ideal é o onBatchUpload retornar as URLs novas.
        }
    };

    // Reseta para 'recent' quando abre se tiver uploads recentes
    useEffect(() => {
        if (isOpen && recentImages.length > 0) setSelectedVehicleId('recent');
        else if (isOpen && !recentImages.length && vehiclesWithImages.length > 0 && selectedVehicleId === 'recent') {
            setSelectedVehicleId(vehiclesWithImages[0].id);
        }
    }, [isOpen]);

    // Escuta eventos customizados ou props para atualizar imagens recentes (Gambiarra saudável para comunicação)
    useEffect(() => {
        const handleNewUploads = (e: CustomEvent) => {
            setRecentImages(prev => [...e.detail, ...prev]);
            setSelectedVehicleId('recent');
        };
        window.addEventListener('new-uploads' as any, handleNewUploads);
        return () => window.removeEventListener('new-uploads' as any, handleNewUploads);
    }, []);

    if (!isOpen) return null;

    let activeImages: { url: string, label: string }[] = [];
    let activeTitle = "";

    if (selectedVehicleId === 'recent') {
        activeImages = recentImages.map(img => ({ url: img.url, label: "Novo Upload" }));
        activeTitle = "✨ Uploads Recentes (Sessão Atual)";
    } else {
        const v = vehiclesWithImages.find(v => v.id === selectedVehicleId);
        if (v) {
            activeImages = v.images;
            activeTitle = v.model_name;
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-6xl h-[85vh] flex shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* SIDEBAR */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                    <div className="p-4 border-b border-gray-200 space-y-3">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Grid size={20}/> Biblioteca</h3>
                        
                        {/* BOTÃO DE UPLOAD EM MASSA */}
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
                        >
                            {isUploading ? <Loader2 className="animate-spin" size={16}/> : <UploadCloud size={16}/>}
                            {isUploading ? 'Enviando...' : 'Upload em Massa'}
                        </button>
                        <input 
                            type="file" 
                            multiple 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {recentImages.length > 0 && (
                            <button 
                                onClick={() => setSelectedVehicleId('recent')}
                                className={`w-full text-left px-3 py-3 rounded-lg text-sm font-bold flex items-center justify-between group transition-all mb-2
                                    ${selectedVehicleId === 'recent' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                <span className="flex items-center gap-2"><CheckCircle2 size={14}/> Recentes ({recentImages.length})</span>
                                {selectedVehicleId === 'recent' && <ChevronRight size={14} />}
                            </button>
                        )}

                        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Veículos Cadastrados</div>
                        
                        {vehiclesWithImages.map((v) => (
                            <button 
                                key={v.id} 
                                onClick={() => setSelectedVehicleId(v.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between group transition-all
                                    ${selectedVehicleId === v.id ? 'bg-black text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                <span className="truncate">{v.model_name}</span>
                                {selectedVehicleId === v.id && <ChevronRight size={14} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm">
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{activeTitle}</h3>
                            <p className="text-xs text-gray-500">{activeImages.length} imagens disponíveis</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={24}/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                        {activeImages.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {activeImages.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => { onSelect(img.url); onClose(); }} 
                                        className="group cursor-pointer flex flex-col gap-2 animate-in fade-in zoom-in-50 duration-300"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <div className="aspect-square bg-white rounded-xl border border-gray-200 flex items-center justify-center p-2 relative shadow-sm group-hover:border-blue-500 group-hover:ring-2 group-hover:ring-blue-100 transition-all overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/2/2f/Transparent_square_tiles_texture.png')] bg-repeat opacity-20 pointer-events-none"></div>
                                            <img src={img.url} className="w-full h-full object-contain relative z-10" />
                                            
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 z-20 transition-all" />
                                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all z-30 bg-blue-600 text-white p-1.5 rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                                <Check size={14} strokeWidth={3} />
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-500 uppercase truncate text-center bg-gray-100 py-1 px-2 rounded-md group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                                            {img.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                {selectedVehicleId === 'recent' ? (
                                    <>
                                        <UploadCloud size={48} className="mb-4 opacity-20"/>
                                        <p>Faça upload de imagens para usar agora.</p>
                                        <p className="text-xs mt-2 text-gray-400">Elas ficarão aqui temporariamente para seleção rápida.</p>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon size={48} className="mb-4 opacity-20"/>
                                        <p>Selecione um veículo ou faça upload.</p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

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

const ImageUpload = ({ label, previewUrl, setFile, onOpenLibrary }: UploadProps) => {
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
        <div className="flex justify-between items-end mb-1.5">
            {label && <label className="block text-[10px] font-bold uppercase text-gray-500">{label}</label>}
            {onOpenLibrary && (
                <button type="button" onClick={onOpenLibrary} className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
                    <Grid size={12}/> Biblioteca
                </button>
            )}
        </div>
        <div className={`relative h-32 rounded-lg border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden group 
          ${previewUrl ? 'border-green-500 bg-green-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'}`}>
          
          <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFile} />
          
          {previewUrl ? (
            <>
              <img src={previewUrl} alt="Preview" className="h-full w-full object-contain p-2 z-10" />
              <div className="absolute top-2 right-2 z-30">
                  <button type="button" onClick={handleRemove} className="bg-red-500 text-white p-1.5 rounded-full shadow hover:scale-110 z-40 cursor-pointer"><Trash2 size={14} /></button>
              </div>
            </>
          ) : (
            <div className="text-center p-4 pointer-events-none">
                <UploadCloud className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-400 block font-medium">Arraste ou clique para enviar</span>
            </div>
          )}
        </div>
      </div>
    )
}

const ColorList = ({ colors, setColors, formatMoneyInput, preventSubmit, onOpenLibrary }: any) => {
    const addColor = () => setColors([...colors, {id:crypto.randomUUID(), name:'', hex:'#000000', priceFormatted: 'R$ 0,00', files: {}, previews: {} }])
    const updateName = (i: number, val: string) => { const n = [...colors]; n[i].name = val; setColors(n); }
    const updatePrice = (i: number, val: string) => { const n = [...colors]; n[i].priceFormatted = formatMoneyInput(val); setColors(n); }
    const updateHex = (i: number, val: string) => { const n = [...colors]; n[i].hex = val; setColors(n); }
    const removeColor = (i: number) => { const n = [...colors]; n.splice(i, 1); setColors(n) }
    
    // ATUALIZAÇÃO: Aceita URL da biblioteca
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
                      
                      {/* Botão de Biblioteca para a cor */}
                      <div className="flex justify-end mb-2">
                          <button type="button" onClick={() => onOpenLibrary((url: string) => {
                              // Callback simples: Se o usuário clicar na biblioteca, por padrão joga na FRENTE
                              // (Para controle fino, teria que abrir a lib para cada mini-input, mas isso polui muito a UI.
                              //  Vamos assumir que ele usa o drag-drop individual ou faremos um upgrade futuro)
                              updateColorFile(i, 'front', null, url)
                          })} className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-bold">
                              <Grid size={10}/> Selecionar Frente da Biblioteca
                          </button>
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

const ConfigurableList = ({ configurables, setConfigurables, formatMoneyInput, preventSubmit, onOpenLibrary }: any) => {
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
                   <div className="w-full md:w-20">
                       <ImageUpload 
                            label="Foto" 
                            previewUrl={item.preview} 
                            setFile={(f, u)=>updateFile(i, f, u)}
                            onOpenLibrary={() => onOpenLibrary((url: string) => updateFile(i, null, url))}
                        />
                   </div>
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

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Estados para Galeria
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryCallback, setGalleryCallback] = useState<(url: string) => void>(() => {});
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  // Dados Básicos
  const [formData, setFormData] = useState({ model_name: '', category_id: '', slug: '' })
  const [price, setPrice] = useState('')
  const [isVisible, setIsVisible] = useState(true) 
  const [transmissionType, setTransmissionType] = useState('automatic')
  
  const [mainImg, setMainImg] = useState<{file: File | null, url: string | null}>({file: null, url: null}) 
  
  const [dashImg, setDashImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [dashDesc, setDashDesc] = useState('') 
  const [seatsImg, setSeatsImg] = useState<{file: File | null, url: string | null}>({file: null, url: null})
  const [seatsDesc, setSeatsDesc] = useState('') 
  const [colors, setColors] = useState<ColorItem[]>([])
  const [configurables, setConfigurables] = useState<ConfigurableItem[]>([])

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

  // --- FUNÇÃO CENTRAL DE ABERTURA DA BIBLIOTECA ---
  const openLibraryFor = (callback: (url: string) => void) => {
      setGalleryCallback(() => callback);
      setIsGalleryOpen(true);
  };

  const formatMoneyInput = (val: string) => {
    const numbers = val.replace(/\D/g, "")
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(numbers) / 100)
  }
  const parseMoney = (val: string) => {
      if(!val) return 0;
      return Number(val.replace(/[^0-9,-]+/g,"").replace(",", "."))
  }

  const toggleSelectVehicle = (id: number) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAllInCategory = (categoryName: string) => {
      const idsInCategory = groupedVehicles[categoryName].map((v: any) => v.id);
      const allSelected = idsInCategory.every((id: number) => selectedIds.includes(id));
      if (allSelected) {
          setSelectedIds(selectedIds.filter(id => !idsInCategory.includes(id)));
      } else {
          const newIds = [...selectedIds];
          idsInCategory.forEach((id: number) => {
              if (!newIds.includes(id)) newIds.push(id);
          });
          setSelectedIds(newIds);
      }
  };

  const handleBatchUpdate = async (type: 'automatic' | 'manual' | 'both') => {
      if (selectedIds.length === 0) return;
      if (!confirm(`Tem certeza que deseja mudar o câmbio de ${selectedIds.length} veículos para "${type}"?`)) return;
      setBatchLoading(true);
      try {
          const { error } = await supabase.from('vehicles').update({ transmission_type: type }).in('id', selectedIds);
          if (error) throw error;
          alert("Veículos atualizados com sucesso!");
          setSelectedIds([]); 
          fetchVehicles(); 
      } catch (error: any) { alert("Erro ao atualizar: " + error.message); } finally { setBatchLoading(false); }
  };

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

  // Função Genérica de Upload
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
    } catch (err) { console.error("FALHA NO UPLOAD:", err); return existingUrl; }
  }

  // --- NOVO: UPLOAD EM MASSA NA GALERIA ---
  const handleGalleryBatchUpload = async (files: FileList) => {
      setIsBatchUploading(true);
      try {
          const category = categories.find(c => c.id === Number(formData.category_id));
          const catSlug = category ? category.slug : 'uncategorized';
          const vehicleSlug = formData.slug || 'draft';
          const basePath = `${catSlug}/${vehicleSlug}/gallery`; // Pasta dedicada para galeria

          const uploadedUrls: {url: string, name: string}[] = [];

          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const url = await uploadToSupabase(file, basePath, null);
              if (url) {
                  uploadedUrls.push({ url, name: file.name });
              }
          }

          // Dispara evento para o Modal atualizar
          window.dispatchEvent(new CustomEvent('new-uploads', { detail: uploadedUrls }));

      } catch (err) {
          console.error(err);
          alert("Erro no upload em massa.");
      } finally {
          setIsBatchUploading(false);
      }
  };

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
    
    if (v.exterior_colors) {
        setColors(v.exterior_colors.map((c: any) => ({ 
            ...c, id: crypto.randomUUID(), priceFormatted: formatMoneyInput((c.price || 0).toString() + '00'),
            files: {}, previews: c.images || (c.image ? { front: c.image } : {})
        })))
    } else {
        setColors([{ id: crypto.randomUUID(), name: 'Padrão', hex: '#000000', priceFormatted: 'R$ 0,00', files: {}, previews: {} }])
    }

    let merged: ConfigurableItem[] = [];
    if (v.wheels) merged = merged.concat(v.wheels.map((w: any) => ({ ...w, id: crypto.randomUUID(), type: 'wheel', file: null, preview: w.image, priceFormatted: formatMoneyInput((w.price || 0).toString() + '00') })))
    if (v.seat_types) merged = merged.concat(v.seat_types.map((s: any) => ({ ...s, id: crypto.randomUUID(), type: 'seat', file: null, preview: s.image, priceFormatted: formatMoneyInput((s.price || 0).toString() + '00') })))
    if (v.accessories) {
        merged = merged.concat(v.accessories.map((a: any) => ({ ...a, id: crypto.randomUUID(), type: a.type === 'exterior' ? 'acc_ext' : 'acc_int', file: null, preview: a.image, priceFormatted: formatMoneyInput((a.price || 0).toString() + '00') })))
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

      const finalColors = []
      for (const col of colors) {
        const images: any = {}
        const viewKeys = ['front', 'side', 'rear_angle', 'front_detail', 'rear'];
        for (const key of viewKeys) {
            const file = col.files?.[key];
            const oldUrl = col.previews?.[key];
            if (file) { images[key] = await uploadToSupabase(file, `${basePath}/cor-${col.name}-${key}`, oldUrl); } 
            else { images[key] = oldUrl || null; }
        }
        if (!images.front) throw new Error(`A cor ${col.name} precisa de pelo menos a foto de FRENTE.`);
        finalColors.push({ name: col.name, hex: col.hex, price: parseMoney(col.priceFormatted), image: images.front, images: images })
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
    if (!confirm(`Copiar RODAS, BANCOS e ACESSÓRIOS para TODOS os "${baseName}"?`)) return;
    setRLoading(true);
    try {
        const finalWheels = []; const finalSeatTypes = []; const finalAccessories = []
        for (const item of configurables) {
            const cleanItem = { id: item.id, name: item.name, price: parseMoney(item.priceFormatted), image: item.preview }
            if (item.type === 'wheel') finalWheels.push(cleanItem)
            else if (item.type === 'seat') finalSeatTypes.push(cleanItem)
            else if (item.type === 'acc_ext') finalAccessories.push({ ...cleanItem, type: 'exterior' })
            else if (item.type === 'acc_int') finalAccessories.push({ ...cleanItem, type: 'interior' })
        }
        const { error } = await supabase.from('vehicles').update({ wheels: finalWheels, seat_types: finalSeatTypes, accessories: finalAccessories }).ilike('model_name', `${baseName}%`); 
        if (error) throw error; alert(`Sucesso! Copiado para todos os ${baseName}.`);
    } catch (error: any) { alert("Erro: " + error.message); } finally { setRLoading(false); }
  }

  const deleteVehicle = async (id: number) => { if(confirm("Apagar?")) { await supabase.from('vehicles').delete().eq('id', id); fetchVehicles(); if (editingId === id) cancelEditing() } }
  const handleBannerSubmit = async (e: React.FormEvent) => { e.preventDefault(); setBLoading(true); try { const imageUrl = await uploadToSupabase(bImage.file, 'banners', null); await supabase.from('hero_slides').insert({ title: bFormData.title, subtitle: bFormData.subtitle, image_url: imageUrl }); setBFormData({ title: '', subtitle: '' }); setBImage({ file: null, url: null }); loadInitialData() } catch (err: any) { alert("Erro: " + err.message) } finally { setBLoading(false) } }
  const deleteBanner = async (id: number) => { if(confirm("Apagar?")) { await supabase.from('hero_slides').delete().eq('id', id); loadInitialData() } }

  const groupedVehicles = vehicleList.reduce((acc: any, vehicle) => {
      const catName = vehicle.categories?.name || 'Outros';
      if (!acc[catName]) acc[catName] = [];
      acc[catName].push(vehicle);
      return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-32 px-4 font-sans relative">
      <ImageGalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        onSelect={galleryCallback} 
        vehicles={vehicleList}
        onBatchUpload={handleGalleryBatchUpload}
        isUploading={isBatchUploading}
      />

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
              
              <div className="space-y-8">
                  <div className="flex justify-between items-end">
                      <h2 className="text-xl font-bold text-gray-800">Estoque ({vehicleList.length})</h2>
                      {selectedIds.length > 0 && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{selectedIds.length} selecionados</span>}
                  </div>
                  
                  {Object.keys(groupedVehicles).map((categoryName) => (
                      <div key={categoryName} className="space-y-3">
                          <div className="flex items-center gap-3 border-b border-gray-200 pb-1">
                              <button onClick={() => selectAllInCategory(categoryName)} className="text-gray-400 hover:text-black transition-colors" title="Selecionar todos desta categoria"><CheckSquare size={16} /></button>
                              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{categoryName}</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {groupedVehicles[categoryName].map((v: any) => {
                                const isSelected = selectedIds.includes(v.id);
                                return (
                                <div key={v.id} className={`p-4 rounded-xl border flex gap-4 items-center transition-all relative group ${isSelected ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 shadow-sm hover:border-gray-300'} ${v.is_visible === false ? 'opacity-60' : ''}`}>
                                    <div onClick={() => toggleSelectVehicle(v.id)} className="cursor-pointer">{isSelected ? <CheckSquare className="text-blue-600" size={20} /> : <Square className="text-gray-300 hover:text-gray-500" size={20} />}</div>
                                    {v.is_visible === false && (<div className="absolute top-2 right-2 bg-red-100 text-red-600 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider"><EyeOff size={10}/> Oculto</div>)}
                                    <div className="w-20 h-20 bg-white rounded-lg shrink-0 overflow-hidden border border-gray-100"><img src={v.image_url} className="w-full h-full object-contain" /></div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base text-gray-900 truncate">{v.model_name}</h3>
                                        <p className="text-sm text-gray-500 font-mono">{formatMoneyInput(v.price_start.toString() + '00')}</p>
                                        <span className="text-[10px] font-bold uppercase text-gray-400">{v.transmission_type === 'automatic' ? 'Automático' : v.transmission_type === 'manual' ? 'Manual' : 'Ambos'}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link href={`/configurador?id=${v.id}`} target="_blank" className="p-2 text-green-600 hover:bg-green-50 rounded-full"><Eye size={18} /></Link>
                                        <button onClick={() => startEditing(v)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"><Pencil size={18} /></button>
                                        <button onClick={() => deleteVehicle(v.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )})}
                          </div>
                      </div>
                  ))}
              </div>

              {selectedIds.length > 0 && (
                  <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-50 flex justify-center animate-in slide-in-from-bottom-10">
                      <div className="max-w-5xl w-full flex items-center justify-between">
                          <div className="flex items-center gap-2"><span className="font-bold text-gray-900">{selectedIds.length} selecionados</span><button onClick={() => setSelectedIds([])} className="text-xs text-red-500 hover:underline">Limpar</button></div>
                          <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 hidden sm:block">Definir Câmbio:</span>
                              <button onClick={() => handleBatchUpdate('automatic')} disabled={batchLoading} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-bold uppercase transition-colors">Automático</button>
                              <button onClick={() => handleBatchUpdate('manual')} disabled={batchLoading} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg text-xs font-bold uppercase transition-colors">Manual</button>
                              <button onClick={() => handleBatchUpdate('both')} disabled={batchLoading} className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold uppercase hover:bg-gray-800 transition-colors">Ambos</button>
                          </div>
                      </div>
                  </div>
              )}

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

                        {/* --- CAMPO DE UPLOAD COM BIBLIOTECA INTEGRADA --- */}
                        <div className="md:col-span-3 mt-4">
                            <ImageUpload 
                                label="Imagem do Veículo (PNG sem fundo) - Configurador" 
                                previewUrl={mainImg.url} 
                                setFile={(f, u) => setMainImg({file:f, url:u})} 
                                onOpenLibrary={() => openLibraryFor((url: string) => setMainImg({file: null, url}))}
                            />
                        </div>

                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-sm font-bold mb-4 uppercase text-gray-400">Interior (Padrão)</h2>
                    <div className="grid grid-cols-2 gap-5">
                        <div><ImageUpload label="1. Painel" previewUrl={dashImg.url} setFile={(f,u) => setDashImg({file:f, url:u})} /><input onKeyDown={preventSubmit} value={dashDesc} onChange={e => setDashDesc(e.target.value)} className="w-full mt-2 border rounded h-9 px-2 text-xs" placeholder="Descrição do Painel" /></div>
                        <div><ImageUpload label="2. Bancos Padrão" previewUrl={seatsImg.url} setFile={(f,u) => setSeatsImg({file:f, url:u})} /><input onKeyDown={preventSubmit} value={seatsDesc} onChange={e => setSeatsDesc(e.target.value)} className="w-full mt-2 border rounded h-9 px-2 text-xs" placeholder="Descrição dos Bancos" /></div>
                    </div>
                  </div>

                  <ColorList 
                    colors={colors} 
                    setColors={setColors} 
                    formatMoneyInput={formatMoneyInput} 
                    preventSubmit={preventSubmit} 
                    onOpenLibrary={openLibraryFor}
                  />
                  
                  <ConfigurableList 
                    configurables={configurables} 
                    setConfigurables={setConfigurables} 
                    formatMoneyInput={formatMoneyInput} 
                    preventSubmit={preventSubmit} 
                    onOpenLibrary={openLibraryFor}
                  />

                  <div className="flex gap-4">
                    <button disabled={vLoading} type="submit" className={`flex-1 py-4 rounded-xl font-bold text-white uppercase text-sm tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-800'}`}>
                        {vLoading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                        {vLoading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar Veículo'}
                    </button>
                    {editingId && (
                        <button type="button" onClick={() => handleReplicate()} disabled={rLoading} className="px-6 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 uppercase text-xs tracking-widest shadow-lg flex items-center gap-2 transition-all">
                            {rLoading ? <Loader2 className="animate-spin" size={16}/> : <Copy size={16} />}
                            {rLoading ? '...' : 'Copiar Itens'}
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