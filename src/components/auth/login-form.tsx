"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import {
  SignInPage,
  type Testimonial,
} from "@/components/ui/sign-in";

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

const loginTestimonials: Testimonial[] = [
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
    name: "Ana Paula",
    handle: "@vcdperformance",
    text: "A equipe comercial conseguiu centralizar pipeline, follow-up e histórico em um lugar só.",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
    name: "Renan Silva",
    handle: "@vocedigital",
    text: "O Kanban ficou rápido, visual e pronto para a rotina da agência sem complicação.",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
    name: "Bruno Ravaglia",
    handle: "@vcdceo",
    text: "O objetivo agora é dogfooding real: entrar, acompanhar leads e evoluir o CRM com uso diário.",
  },
];

export function LoginForm({ nextPath: nextPathProp }: LoginFormProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextPath = useMemo(
    () => sanitizeNextPath(nextPathProp ?? null),
    [nextPathProp],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!isSupabaseConfigured()) {
      setFeedback(
        "Supabase nao configurado. Ative as variaveis de ambiente antes de liberar o CRM.",
      );
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
            nextPath,
          }),
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              error?: string;
              redirectTo?: string;
            }
          | null;

        if (!response.ok) {
          setFeedback(payload?.error ?? "Nao foi possivel autenticar.");
          return;
        }

        window.location.assign(payload?.redirectTo ?? nextPath);
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Nao foi possivel autenticar.",
        );
      }
    });
  }

  function handleGoogleSignIn() {
    setFeedback("Login com Google ainda nao foi ativado neste MVP.");
  }

  function handleResetPassword() {
    setFeedback("Recuperacao de senha sera conectada ao fluxo do Supabase na proxima etapa.");
  }

  function handleCreateAccount() {
    setFeedback("Criacao de conta publica ainda nao esta liberada para este ambiente interno.");
  }

  return (
    <SignInPage
      title={
        <>
          CRM VCD para a rotina comercial da <span className="font-light">VOCE DIGITAL</span>
        </>
      }
      description="Entre para criar leads, mover oportunidades, registrar observacoes, operar o WhatsApp e evoluir o funil em tempo real."
      heroImageSrc="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80"
      testimonials={loginTestimonials}
      onSignIn={handleSubmit}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      feedback={feedback}
      isPending={isPending}
      submitLabel={isPending ? "Entrando..." : "Entrar no CRM"}
      googleLabel="Entrar com Google"
      googleDisabled
    />
  );
}
