"use client";

export const dynamic = "force-dynamic";

import { useRouter } from "next/navigation";
import { ArrowLeft, Construction } from "lucide-react";

export default function PageEmConstrucao() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f4ef] text-zinc-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f7f4ee_0%,#eef1f5_45%,#f7f1ea_100%)]" />

        <div className="aurora aurora-one" />
        <div className="aurora aurora-two" />
        <div className="aurora aurora-three" />

        <div className="absolute inset-0 opacity-[0.045] bg-grid" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-white/70 bg-white/75 p-7 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <Construction className="h-8 w-8 text-zinc-800" />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">
            Área temporariamente indisponível
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
            Em construção
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Esta parte do sistema ainda está sendo ajustada. Em breve ela estará
            disponível para uso.
          </p>

          <div className="mt-7 flex justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
          background: #f6f4ef;
        }

        .bg-grid {
          background-image:
            linear-gradient(to right, rgba(15, 23, 42, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 23, 42, 0.45) 1px, transparent 1px);
          background-size: 52px 52px;
        }

        .aurora {
          position: absolute;
          border-radius: 999px;
          filter: blur(55px);
          opacity: 0.55;
          animation: floaty 12s ease-in-out infinite;
        }

        .aurora-one {
          width: 360px;
          height: 360px;
          left: -110px;
          top: -90px;
          background: rgba(120, 113, 108, 0.35);
        }

        .aurora-two {
          width: 420px;
          height: 420px;
          right: -130px;
          top: 20%;
          background: rgba(148, 163, 184, 0.38);
          animation-delay: -4s;
        }

        .aurora-three {
          width: 380px;
          height: 380px;
          left: 35%;
          bottom: -170px;
          background: rgba(214, 211, 209, 0.7);
          animation-delay: -7s;
        }

        @keyframes floaty {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }

          50% {
            transform: translate3d(18px, -18px, 0) scale(1.05);
          }

          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @media (max-width: 640px) {
          .aurora {
            filter: blur(44px);
            opacity: 0.45;
          }

          .aurora-one {
            width: 260px;
            height: 260px;
          }

          .aurora-two {
            width: 300px;
            height: 300px;
          }

          .aurora-three {
            width: 300px;
            height: 300px;
          }

          .bg-grid {
            background-size: 38px 38px;
          }
        }
      `}</style>
    </main>
  );
}