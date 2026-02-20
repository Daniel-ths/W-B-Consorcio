"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // ✅ NÃO recria o client a cada render (evita loops e comportamentos estranhos)
  const supabase = useMemo(() => {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Checa sessão ao entrar (sem loop) e SEM travar em loading
  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!mounted) return;

        if (session?.user?.id) {
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();

          const role = profileErr ? "vendedor" : profile?.role || "vendedor";

          router.replace(role === "admin" ? "/admin" : "/vendedor/dashboard");
          return;
        }

        setCheckingSession(false);
      } catch {
        if (mounted) setCheckingSession(false);
      }
    };

    checkUser();
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setError("Email ou senha incorretos.");
        return;
      }

      const userId = data.user?.id || data.session?.user?.id;
      if (!userId) {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user?.id) {
          setError("Não foi possível validar sua sessão. Tente novamente.");
          return;
        }
      }

      const finalUserId = userId || (await supabase.auth.getUser()).data.user?.id!;

      // ✅ role robusto: se falhar, manda para vendedor em vez de travar
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", finalUserId)
        .maybeSingle();

      const role = profileErr ? "vendedor" : profile?.role || "vendedor";

      router.replace(role === "admin" ? "/admin" : "/vendedor/dashboard");
    } catch {
      setError("Ocorreu um erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-200">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-zinc-950 text-white">
      {/* Fundo com gradiente + “aurora” */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-30 bg-fuchsia-500" />
        <div className="absolute top-32 -right-40 h-[560px] w-[560px] rounded-full blur-3xl opacity-25 bg-sky-500" />
        <div className="absolute bottom-[-260px] left-1/2 -translate-x-1/2 h-[620px] w-[620px] rounded-full blur-3xl opacity-20 bg-emerald-500" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.85))]" />
        {/* grid */}
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6">
          {/* Painel esquerdo (desktop) */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-10 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <ShieldCheck size={20} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm text-zinc-200/80">WBCNAC</p>
                <p className="text-lg font-semibold tracking-tight">Painel Automotivo</p>
              </div>
            </div>

            <div className="mt-14">
              <p className="text-4xl font-bold tracking-tight leading-[1.05]">
                Entre e gerencie tudo
                <span className="text-white/70"> em um só lugar.</span>
              </p>
              <p className="mt-4 text-zinc-200/80 text-base leading-relaxed max-w-md">
                Vendas, estoque e equipe com um fluxo simples, rápido e seguro.
              </p>

              <div className="mt-8 space-y-3">
                <Feature text="Login seguro com Supabase Auth" />
                <Feature text="Acesso por cargo (admin / vendedor)" />
                <Feature text="Interface leve, rápida e responsiva" />
              </div>
            </div>

            <div className="mt-10 flex items-center justify-between text-xs text-zinc-200/60">
              <span>© 2026 W B C Consórcio LTDA</span>
              <span className="flex items-center gap-1">
                <Sparkles size={14} />
                v1.0
              </span>
            </div>
          </div>

          {/* Card do login */}
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-7 sm:p-9 shadow-2xl shadow-black/40">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-200/70 uppercase tracking-[0.22em]">
                  Acesso restrito
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Entrar no sistema
                </h1>
                <p className="mt-2 text-sm text-zinc-200/70">
                  Use seu e-mail corporativo para continuar.
                </p>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-300" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200/80">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300/70"
                  />
                  <input
                    type="email"
                    placeholder="exemplo@wbauto.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full h-12 pl-10 pr-3 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200/80">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-300/70"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 pl-10 pr-12 rounded-2xl bg-black/30 border border-white/10 text-white placeholder:text-zinc-300/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-zinc-200/70 hover:text-white hover:bg-white/10 transition"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-12 rounded-2xl font-semibold tracking-tight bg-white text-zinc-950 hover:bg-zinc-100 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Acessando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center text-xs text-zinc-200/50">
                Ao entrar, você concorda com as políticas internas da empresa.
              </div>
            </form>

            <div className="mt-7 lg:hidden text-center text-xs text-zinc-200/50">
              © 2026 W B C Consórcio LTDA. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-6 w-6 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
        <CheckCircle2 size={16} className="text-white/80" />
      </div>
      <p className="text-sm text-zinc-200/80 leading-relaxed">{text}</p>
    </div>
  );
}