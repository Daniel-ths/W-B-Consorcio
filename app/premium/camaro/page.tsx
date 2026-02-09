"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  Gauge, 
  Timer, 
  Zap, 
  ChevronRight, 
  Volume2, 
  VolumeX,
  ShieldCheck,
  Award,
  Flame,
  MousePointer2,
  Armchair,
  Radio,
  RotateCw,
  Layers
} from "lucide-react";

// --- DADOS REAIS: CHEVROLET CAMARO SS COLLECTION 2024 ---
const CAMARO_DATA = {
  nome: "Camaro SS Collection",
  subtitulo: "A Despedida da Lenda. Edição Limitada.",
  preco: 555900,
  motor: "6.2L V8 LT1",
  potencia: "461 CV",
  torque: "62.9 kgfm",
  aceleracao: "4.2s (0-100 km/h)",
  velocidade_max: "290 km/h",
  
  // Imagens Premium
  imagem_hero: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/2018-Camaro-ZL1-1LE-13.jpg", 
  imagem_lateral: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/Chevrolet-Camaro-Collection-2025.jpg", 
  imagem_interior_full: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/2024-chevrolet-camaro-ss-collectors-edition-1200x720.jpg",
  imagem_volante: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/galeria-3%20(1).avif",
  imagem_bancos: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/galeria-4.avif",
  imagem_motor: "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/pbx_9188-tif.webp",
  som_motor: "https://www.chevrolet.com.br/content/dam/chevrolet/mercosur/brazil/portuguese/index/cars/2020-camaro/mov/camaro-engine-sound.mp3"
};

// --- IMAGENS PARA ROTAÇÃO 360 ---
const ROTATION_IMAGES = [
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/cor-preto_global-front/1769189515548_25jz4n.avif", // 0. Frente
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/cor-preto_global-side/1769189515793_7xi1ud.avif",  // 1. Lado
  "https://qkpfsisyaohpdetyhtjd.supabase.co/storage/v1/object/public/cars/esportivos/camaro-ss/cor-preto_global-rear_angle/1769189516087_tj1mii.avif" // 2. Costas
];

export default function CamaroPage() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showStickyNav, setShowStickyNav] = useState(false);
  
  // Estado da Rotação (0 a 2)
  const [rotationIndex, setRotationIndex] = useState(0);

  // Controle do Som
  const toggleEngine = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0; 
      } else {
        audioRef.current.volume = 0.6;
        audioRef.current.play().catch(e => console.log("Interação necessária", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => setShowStickyNav(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Checkout
  const handleFazerPedido = () => {
    const params = new URLSearchParams({
      modelo: CAMARO_DATA.nome,
      valor: CAMARO_DATA.preco.toString(),
      entrada: (CAMARO_DATA.preco * 0.3).toString(), 
      imagem: CAMARO_DATA.imagem_hero
    });
    router.push(`/vendedor/analise?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#f2e14c] selection:text-black pb-20 overflow-x-hidden">
      
      <audio ref={audioRef} src={CAMARO_DATA.som_motor} />

      {/* --- NAVBAR FLUTUANTE --- */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${showStickyNav ? 'bg-black/90 backdrop-blur-xl border-white/10 py-3' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Voltar
          </Link>
          
          <div className={`flex items-center gap-6 transition-all duration-500 ${showStickyNav ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            <span className="font-black text-sm tracking-tighter uppercase hidden md:block text-white/90">{CAMARO_DATA.nome}</span>
            <button 
              onClick={handleFazerPedido}
              className="bg-[#f2e14c] hover:bg-white text-black text-[10px] font-black uppercase px-5 py-2.5 rounded-sm transition-all shadow-[0_0_15px_rgba(242,225,76,0.3)] hover:shadow-[0_0_25px_rgba(242,225,76,0.6)]"
            >
              Comprar
            </button>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        
        {/* Background com Profundidade */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#050505] z-10"></div>
          <div className="absolute inset-0 bg-black/40 z-10"></div> 
          <img src={CAMARO_DATA.imagem_hero} alt="Camaro Hero" className="w-full h-full object-cover object-center scale-105 animate-in zoom-in duration-[3000ms]" />
        </div>

        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto mt-20">
          <div className="inline-flex items-center gap-3 border border-white/20 bg-black/40 backdrop-blur-md px-5 py-2 rounded-full mb-8 animate-in slide-in-from-top duration-1000 shadow-lg">
            <Award size={16} className="text-[#f2e14c] fill-[#f2e14c]"/>
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">The Final Edition</span>
          </div>
          
          <h1 className="text-7xl md:text-[10rem] font-black uppercase tracking-tighter mb-2 leading-[0.85] italic drop-shadow-2xl animate-in fade-in zoom-in duration-1000 delay-100">
            Camaro <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#f2e14c] to-[#ffc400] drop-shadow-none">SS</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-200 font-medium mb-12 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 leading-relaxed drop-shadow-md">
            {CAMARO_DATA.subtitulo} O último suspiro do V8 aspirado puro sangue.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            {/* BOTÃO HERO */}
            <button 
              onClick={handleFazerPedido}
              className="group relative bg-white text-black h-14 px-10 transform -skew-x-12 hover:bg-[#f2e14c] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(242,225,76,0.4)]"
            >
              <div className="transform skew-x-12 flex items-center gap-3 font-black uppercase tracking-widest text-xs">
                Garanta o Seu <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </button>

            <button 
              onClick={toggleEngine}
              className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-white hover:text-[#f2e14c] transition-colors group bg-black/30 backdrop-blur-sm px-6 py-4 rounded-full border border-white/10 hover:border-[#f2e14c]/50"
            >
              <div className={`w-8 h-8 rounded-full border border-white/30 flex items-center justify-center group-hover:border-[#f2e14c] group-hover:bg-[#f2e14c]/20 transition-all ${isPlaying ? 'animate-pulse border-[#f2e14c] text-[#f2e14c]' : ''}`}>
                {isPlaying ? <VolumeX size={14}/> : <Volume2 size={14}/>}
              </div>
              <span className="group-hover:translate-x-1 transition-transform">{isPlaying ? "Desligar Motor" : "Ouvir o V8"}</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-pulse z-20">
          <span className="text-[9px] uppercase tracking-widest text-white">Detalhes</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white to-transparent"></div>
        </div>
      </section>

      {/* --- SPECS GRID --- */}
      <section className="py-24 px-6 bg-[#050505] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#f2e14c]/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3 text-[#f2e14c]">
                <Gauge size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Potência</span>
              </div>
              <p className="text-4xl font-black italic text-white">{CAMARO_DATA.potencia}</p>
              <p className="text-[10px] text-gray-500 mt-2">@ 6.000 RPM</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#f2e14c]/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3 text-[#f2e14c]">
                <Flame size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Torque</span>
              </div>
              <p className="text-4xl font-black italic text-white">{CAMARO_DATA.torque}</p>
              <p className="text-[10px] text-gray-500 mt-2">Força Bruta</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#f2e14c]/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3 text-[#f2e14c]">
                <Timer size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">0 a 100</span>
              </div>
              <p className="text-4xl font-black italic text-white">4.2s</p>
              <p className="text-[10px] text-gray-500 mt-2">Controle de Largada</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-[#f2e14c]/50 transition-colors group">
              <div className="flex items-center gap-3 mb-3 text-[#f2e14c]">
                <Zap size={24}/>
                <span className="text-xs font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Velocidade</span>
              </div>
              <p className="text-4xl font-black italic text-white">{CAMARO_DATA.velocidade_max}</p>
              <p className="text-[10px] text-gray-500 mt-2">Limitada eletronicamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- ROTAÇÃO 360 --- */}
      <section className="py-24 px-6 bg-[#080808] border-t border-white/5 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center">
            
            <div className="mb-10 flex flex-col items-center">
                <h2 className="text-3xl md:text-4xl font-black uppercase italic mb-2">Explore cada Ângulo</h2>
                <div className="flex items-center gap-2 text-[#f2e14c]">
                    <RotateCw size={18} className="animate-spin-slow"/>
                    <span className="text-xs font-bold uppercase tracking-widest">Visualização 360º</span>
                </div>
            </div>

            {/* Container da Imagem */}
            <div className="relative aspect-[16/9] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
                {ROTATION_IMAGES.map((img, idx) => (
                    <img 
                        key={idx}
                        src={img} 
                        alt={`Camaro Angulo ${idx}`} 
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${rotationIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    />
                ))}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent z-20"></div>
            </div>

            {/* Controle Slider */}
            <div className="mt-8 max-w-md mx-auto">
                <div className="relative w-full h-2 bg-white/10 rounded-full">
                    <div 
                        className="absolute top-0 left-0 h-full bg-[#f2e14c] rounded-full transition-all duration-300"
                        style={{ width: `${(rotationIndex / (ROTATION_IMAGES.length - 1)) * 100}%` }}
                    ></div>
                    <input 
                        type="range" 
                        min="0" 
                        max="2"
                        step="1"
                        value={rotationIndex}
                        onChange={(e) => setRotationIndex(parseInt(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30"
                    />
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(242,225,76,0.8)] border-2 border-[#f2e14c] pointer-events-none transition-all duration-300 z-20"
                        style={{ left: `${(rotationIndex / (ROTATION_IMAGES.length - 1)) * 100}%`, transform: `translate(-50%, -50%)` }}
                    ></div>
                </div>
                <div className="flex justify-between mt-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Frente</span>
                    <span>Lateral</span>
                    <span>Traseira</span>
                </div>
                <p className="mt-4 text-xs text-gray-400 flex items-center justify-center gap-2">
                    <MousePointer2 size={12}/> Arraste para girar
                </p>
            </div>

        </div>
      </section>

      {/* --- ENGINE SECTION --- */}
      <section className="py-20 relative overflow-hidden border-t border-white/5">
        <div className="absolute inset-0 z-0">
            <img src={CAMARO_DATA.imagem_motor} className="w-full h-full object-cover opacity-10 blur-xl scale-125" alt="Background Texture" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-[#050505]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#f2e14c] to-yellow-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square lg:aspect-[4/3]">
                    <img src={CAMARO_DATA.imagem_motor} alt="Motor V8" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <p className="text-white font-black text-2xl uppercase">6.2L LT1 V8</p>
                        <p className="text-gray-400 text-xs">Small Block Chevy • Injeção Direta</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-6">O Coração <br/><span className="text-[#f2e14c]">Da Besta.</span></h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8 border-l-2 border-[#f2e14c] pl-4">
                    Sob o capô, respira o lendário motor V8 Small Block da GM. Sem turbos, sem assistência elétrica. Apenas admissão atmosférica pura, entregando torque instantâneo e uma sinfonia mecânica que arrepia a espinha a 6.000 RPM.
                </p>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="bg-[#f2e14c]/20 p-2 rounded-lg text-[#f2e14c]"><Award size={20}/></div>
                        <div>
                            <p className="font-bold text-white text-sm uppercase">Transmissão de 10 Marchas</p>
                            <p className="text-[10px] text-gray-500">Trocas em milissegundos, mais rápido que PDK.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                        <div className="bg-[#f2e14c]/20 p-2 rounded-lg text-[#f2e14c]"><MousePointer2 size={20}/></div>
                        <div>
                            <p className="font-bold text-white text-sm uppercase">4 Modos de Condução</p>
                            <p className="text-[10px] text-gray-500">Tour, Sport, Track e Snow/Ice.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- INTERIOR --- */}
      <section className="py-24 px-6 bg-[#080808] border-t border-white/5">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-black uppercase italic mb-4">Cockpit <span className="text-[#f2e14c]">Jet-Fighter</span></h2>
                <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                    Inspirado em caças de combate, o interior do Camaro SS é focado inteiramente no piloto. Materiais premium e ergonomia de pista.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2 relative h-[50vh] rounded-3xl overflow-hidden group border border-white/10">
                    <img src={CAMARO_DATA.imagem_interior_full} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                    <div className="absolute bottom-8 left-8">
                        <div className="flex items-center gap-2 mb-2 text-[#f2e14c]">
                            <Layers size={20}/> <span className="text-xs font-bold uppercase tracking-widest text-white">Acabamento Exclusivo</span>
                        </div>
                        <p className="text-2xl font-black uppercase text-white">Couro Premium & Alcantara</p>
                    </div>
                </div>

                <div className="relative h-[40vh] rounded-3xl overflow-hidden group border border-white/10">
                    <img src={CAMARO_DATA.imagem_bancos} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                    <div className="absolute bottom-6 left-6">
                        <div className="flex items-center gap-2 mb-1 text-[#f2e14c]">
                            <Armchair size={18}/> <span className="text-[10px] font-bold uppercase tracking-widest text-white">Recaro Performance</span>
                        </div>
                        <p className="text-lg font-black uppercase text-white leading-tight">Bancos com Ventilação</p>
                        <p className="text-xs text-gray-300 mt-1">Aquecimento e resfriamento para máximo conforto.</p>
                    </div>
                </div>

                <div className="relative h-[40vh] rounded-3xl overflow-hidden group border border-white/10">
                    <img src={CAMARO_DATA.imagem_volante} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all"></div>
                    <div className="absolute bottom-6 left-6">
                        <div className="flex items-center gap-2 mb-1 text-[#f2e14c]">
                            <Radio size={18}/> <span className="text-[10px] font-bold uppercase tracking-widest text-white">Bose Premium</span>
                        </div>
                        <p className="text-lg font-black uppercase text-white leading-tight">Audio System</p>
                        <p className="text-xs text-gray-300 mt-1">9 alto-falantes de alta fidelidade.</p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- PREÇO E CTA FINAL --- */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#f2e14c]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-bold text-[#f2e14c] uppercase tracking-[0.4em] mb-6">Últimas Unidades no Brasil</p>
          <h2 className="text-5xl md:text-8xl font-black uppercase italic mb-8 text-white">
            Domine as ruas.
          </h2>
          
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-md inline-block w-full max-w-lg relative overflow-hidden group hover:border-[#f2e14c]/30 transition-colors">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck size={100} className="text-white"/>
            </div>

            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">Valor de Investimento</p>
            <p className="text-5xl font-mono font-black text-white mb-8 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(CAMARO_DATA.preco)}
            </p>
            
            {/* BOTÃO PREMIUM AMARELO */}
            <button 
              onClick={handleFazerPedido}
              className="group w-full bg-gradient-to-r from-[#f2e14c] to-[#d4c025] hover:from-[#fff] hover:to-[#f2e14c] text-black font-black uppercase py-6 rounded-xl tracking-widest transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(242,225,76,0.3)] hover:shadow-[0_20px_60px_-10px_rgba(242,225,76,0.5)] hover:-translate-y-1 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Iniciar Negociação <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300"/>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
            </button>

            <p className="text-[9px] text-gray-600 mt-6 uppercase tracking-wide">
              *Sujeito a análise de crédito • Estoque limitado
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}