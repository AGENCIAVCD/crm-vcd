"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import {
  createBrowserSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase-client";

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath) {
    return "/dashboard";
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

type LoginFormProps = {
  nextPath?: string | null;
};

export function LoginForm({ nextPath: nextPathProp }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = useMemo(
    () => sanitizeNextPath(nextPathProp ?? null),
    [nextPathProp],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setFeedback(
        "Supabase nao configurado. Ative as variaveis de ambiente antes de liberar o CRM.",
      );
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

        window.location.assign(nextPath);
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
            Area Protegida
          </div>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            O CRM da Voce Digital agora exige login antes de qualquer acesso
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">
            Toda rota de CRM esta protegida por sessao Supabase. Sem
            autenticacao valida, o usuario volta para esta tela.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <div className="inline-flex rounded-2xl bg-brand-soft p-3 text-brand">
                <LockKeyhole className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Rotas privadas
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Dashboard e pipelines ficam indisponiveis para visitantes nao
                autenticados.
              </p>
            </div>

            <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
              <div className="inline-flex rounded-2xl bg-accent-soft p-3 text-accent">
                <KeyRound className="size-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900">
                Sessao centralizada
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                A sessao do Supabase controla acesso, redirecionamento e
                isolamento por tenant.
              </p>
            </div>
          </div>

          <p className="mt-8 text-xs leading-6 text-muted">
            Repositorio:{" "}
            <Link
              href="https://github.com/AGENCIAVCD/crm-vcd"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              github.com/AGENCIAVCD/crm-vcd
            </Link>
          </p>
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
                placeholder="bruno@vocedigitalpropaganda.com.br"
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
              {isPending ? "Entrando..." : "Entrar no CRM"}
            </button>

            <p className="text-xs leading-6 text-muted">
              O acesso so e liberado depois de uma sessao valida do Supabase.
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
