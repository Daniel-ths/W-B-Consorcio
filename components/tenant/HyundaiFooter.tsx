"use client";

import Link from "next/link";

export default function HyundaiFooter() {
  return (
    <footer className="border-t border-white/10 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">
              Hyundai • WB Auto
            </div>
            <div className="mt-3 text-2xl font-black">
              Performance. Tecnologia. Design.
            </div>
            <p className="mt-3 text-sm text-white/60 max-w-md">
              Esboço visual Hyundai. Depois vamos trocar paleta, tipografia e seções
              da home para ficar 100% original.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
                Navegação
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <Link href="/hyundai" className="block text-white/70 hover:text-white">
                  Home Hyundai
                </Link>
                <Link href="/carros" className="block text-white/70 hover:text-white">
                  Catálogo
                </Link>
                <Link href="/" className="block text-white/70 hover:text-white">
                  Trocar marca
                </Link>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">
                Contato
              </div>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <div>WhatsApp: (91) 99999-9999</div>
                <div>Email: contato@wbauto.com.br</div>
                <div>CNPJ: 00.000.000/0000-00</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-[11px] text-white/50 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div>© 2026 WBCNAC Digital</div>
          <div className="text-white/40">Versão Hyundai (esboço)</div>
        </div>
      </div>
    </footer>
  );
}