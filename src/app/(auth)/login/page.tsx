"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setFeedback(
        "Supabase nao configurado ainda. Entrando em modo demo para acelerar o hackathon.",
      );
      router.push("/dashboard");
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setFeedback(error.message);
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Nao foi possivel autenticar.",
        );
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[34px] border border-white/60 bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.18),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(239,246,255,0.85))] p-8 shadow-[0_32px_120px_-64px_rgba(15,23,42,0.55)] sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold tracking-[0.2em] text-brand uppercase">
            <ShieldCheck className="size-3.5" />
            Autenticacao
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            Acesso ao VCD-CRM com Supabase Auth
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
            Esta tela ja conecta com `signInWithPassword` quando as variaveis de
            ambiente do Supabase estiverem preenchidas. Enquanto isso, o app
            continua operando em modo demo para ganhar velocidade no MVP.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
            >
              Ir para dashboard
              <ArrowRight className="size-4" />
            </Link>
            <span className="inline-flex items-center rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-600">
              Modo demo habilitado sem bloquear o fluxo
            </span>
          </div>
        </section>

        <section
          data-panel
          className="rounded-[34px] border border-white/70 p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            <KeyRound className="size-3.5" />
            Login
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">E-mail</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="bruno@vcdigital.com.br"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Senha</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                placeholder="Sua senha"
              />
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-xs leading-6 text-muted">
              Use `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e
              `SUPABASE_SERVICE_ROLE_KEY` para ativar a stack completa.
            </p>

            {feedback ? (
              <p className="rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-700">
                {feedback}
              </p>
            ) : null}
          </form>
        </section>
      </div>
    </main>
  );
}
