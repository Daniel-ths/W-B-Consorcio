import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white pt-24 px-6 lg:px-12">
      <div className="max-w-[1400px] mx-auto flex gap-8">
        
        {/* SKELETON DO MENU LATERAL (Igual ao seu layout) */}
        <aside className="hidden md:block w-1/4 pr-6 border-r border-gray-100 space-y-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div> {/* Título 'Categorias' */}
            
            {/* Lista de Categorias Fake */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg w-full"></div>
            ))}
        </aside>

        {/* SKELETON DO GRID DE CARROS (Conteúdo Principal) */}
        <main className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                     <div key={i} className="flex flex-col items-center p-4 bg-white border border-gray-100 rounded-xl">
                        {/* Imagem do carro */}
                        <div className="h-32 bg-gray-100 rounded-lg w-full mb-4"></div>
                        {/* Texto Nome */}
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        {/* Texto Preço */}
                        <div className="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
                        {/* Botão Saiba Mais */}
                        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                     </div>
                ))}
            </div>
        </main>
      </div>
    </div>
  );
}