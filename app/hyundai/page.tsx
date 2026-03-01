import Link from "next/link";

const HIGHLIGHTS = [
  {
    title: "SUVs Inteligentes",
    text: "Linha com foco em tecnologia, economia e segurança para toda a família.",
  },
  {
    title: "Conectividade",
    text: "Experiência digital moderna com central multimídia e recursos de assistência.",
  },
  {
    title: "Condições Hyundai",
    text: "Planos exclusivos para acelerar sua conquista com a nova estrutura multimarca.",
  },
];

export default function HyundaiPage() {
  return (
    <main className="bg-slate-950 text-white min-h-screen">
      <section className="relative min-h-[80vh] flex items-center">
        <img
          src="https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=2000&auto=format&fit=crop"
          alt="Hyundai"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <p className="text-sm uppercase tracking-[0.25em] text-slate-300">Nova Marca</p>
          <h1 className="text-5xl md:text-7xl font-black uppercase mt-4">Hyundai</h1>
          <p className="text-lg md:text-2xl text-slate-200 mt-6 max-w-2xl">
            Bem-vindo ao novo site Hyundai dentro do ecossistema multimarca da WB Consórcio.
          </p>
          <div className="flex gap-4 mt-10">
            <Link
              href="/chevrolet"
              className="px-6 py-3 rounded-full border border-white/60 text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-slate-900 transition"
            >
              Ir para Chevrolet
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-full bg-white text-slate-900 text-sm font-bold uppercase tracking-widest"
            >
              Trocar marca
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-6">
        {HIGHLIGHTS.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-700 p-6 bg-slate-900/60">
            <h2 className="text-2xl font-bold mb-3">{item.title}</h2>
            <p className="text-slate-300">{item.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
