"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";

type Role = "admin" | "supervisor" | "vendedor";

export default function LoginPage() {
  const router = useRouter();

  // ✅ NÃO recria o client a cada render
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

  // evita redirecionar duas vezes
  const redirectedRef = useRef(false);

  const resolveRedirectPath = (role: Role) => {
    if (role === "admin") return "/admin";
    if (role === "supervisor") return "/supervisor/dashboard";
    return "/vendedor/dashboard";
  };

  const safeRedirect = (path: string) => {
    if (redirectedRef.current) return;
    redirectedRef.current = true;

    router.replace(path);
    router.refresh();

    // ✅ fallback forte para produção (Netlify)
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== path) {
        window.location.assign(path);
      }
    }, 250);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // ✅ IMPORTANTE: retorna null se NÃO conseguir ler role (não chuta vendedor)
  const getRoleByUserId = async (userId: string): Promise<Role | null> => {
    for (let i = 0; i < 10; i++) {
      const { data: profile, error: err } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      // debug (pode remover depois)
      // console.log("[ROLE CHECK]", { try: i + 1, userId, profile, err });

      if (!err && profile?.role) {
        const role = profile.role as Role;
        if (role === "admin" || role === "supervisor" || role === "vendedor") return role;
      }

      await sleep(200);
    }

    return null;
  };

  // ✅ Checa sessão ao abrir + ouve mudanças de auth (fix do Netlify)
  useEffect(() => {
    let mounted = true;

    const redirectIfLogged = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!mounted) return;

        if (session?.user?.id) {
          const role = await getRoleByUserId(session.user.id);

          if (role) {
            safeRedirect(resolveRedirectPath(role));
            return;
          }

          // se não conseguiu identificar role, não redireciona errado
          setError("Não foi possível identificar seu perfil (role). Verifique RLS/policies do profiles.");
        }

        setCheckingSession(false);
      } catch {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    };

    redirectIfLogged();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // ✅ Deixa o onAuthStateChange ser o "redirecionador oficial"
      if (event === "SIGNED_IN" && session?.user?.id) {
        const role = await getRoleByUserId(session.user.id);

        if (role) {
          safeRedirect(resolveRedirectPath(role));
        } else {
          redirectedRef.current = false;
          setError("Não foi possível identificar seu perfil (role). Verifique RLS/policies do profiles.");
        }
      }

      if (event === "SIGNED_OUT") {
        redirectedRef.current = false;
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInErr) {
        setError("Email ou senha incorretos.");
        return;
      }

      // ✅ NÃO redireciona aqui.
      // Quem redireciona é o onAuthStateChange (mais confiável no Netlify/produção).
    } catch {
      setError("Ocorreu um erro ao entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-slate-700">
          <Loader2 className="animate-spin" size={18} />
          <span className="text-sm font-medium">Verificando sessão...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-white text-slate-900">
      {/* Fundo branco com leve “aurora” suave */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-20 bg-fuchsia-300" />
        <div className="absolute top-32 -right-40 h-[560px] w-[560px] rounded-full blur-3xl opacity-20 bg-sky-300" />
        <div className="absolute bottom-[-260px] left-1/2 -translate-x-1/2 h-[620px] w-[620px] rounded-full blur-3xl opacity-15 bg-emerald-300" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.03),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(0,0,0,0.10)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.10)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      <div className="relative z-10 min-h-screen w-full flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Card do login */}
          <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-xl p-7 sm:p-9 shadow-2xl shadow-black/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-[0.22em] font-semibold">
                  Acesso restrito
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  Entrar no sistema
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Use seu e-mail corporativo para continuar.
                </p>
              </div>

              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white border border-slate-900/10 flex items-center justify-center shadow-sm">
                <ShieldCheck size={20} />
              </div>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">E-mail</label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    placeholder="exemplo@wbauto.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="w-full h-12 pl-10 pr-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Senha</label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full h-12 pl-10 pr-12 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full h-12 rounded-2xl font-semibold tracking-tight bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-sm"
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

              <div className="pt-2 text-center text-xs text-slate-500">
                Ao entrar, você concorda com as políticas internas da empresa.
              </div>
            </form>

            <div className="mt-7 text-center text-xs text-slate-400">
              © 2026 W B C Consórcio LTDA. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}