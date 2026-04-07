"use client";

import Image from "next/image";
import React, { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 48 48"
    aria-hidden="true"
  >
    <path
      fill="#FFB800"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#000000"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#1A1A1A"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#FFB800"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  feedback?: React.ReactNode;
  isPending?: boolean;
  submitLabel?: string;
  googleLabel?: string;
  googleDisabled?: boolean;
}

const EMPTY_TESTIMONIALS: Testimonial[] = [];

function TestimonialCard({ testimonial, delay }: { testimonial: Testimonial; delay: string }) {
  return (
    <div
      className={`animate-testimonial ${delay} w-full max-w-xs rounded-[24px] border border-white/10 bg-black/70 p-5 text-white shadow-[0_24px_60px_-40px_rgba(0,0,0,0.8)] backdrop-blur-md`}
    >
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-[18px] ring-2 ring-[#ffb800]">
          <Image
            src={testimonial.avatarSrc}
            alt={testimonial.name}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold uppercase tracking-[0.08em] text-[#ffb800]">
            {testimonial.name}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
            {testimonial.handle}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-white/85">{testimonial.text}</p>
    </div>
  );
}

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span>Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = EMPTY_TESTIMONIALS,
  onSignIn,
  onGoogleSignIn,
  onResetPassword,
  onCreateAccount,
  feedback,
  isPending = false,
  submitLabel = "Sign In",
  googleLabel = "Continue with Google",
  googleDisabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const emailInputId = "signin-email";
  const accessFieldId = "signin-access";

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f9f9f9] md:flex-row">
      <section className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10 md:px-10 lg:px-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,184,0,0.18),_transparent_28%),linear-gradient(180deg,_#fffdf8_0%,_#f9f9f9_100%)]" />
        <div className="relative z-10 w-full max-w-xl">
          <div className="animate-element animate-delay-100 inline-flex items-center gap-2 rounded-full bg-[#ffb800] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-black">
            <Sparkles className="size-3.5" />
            Você Digital Propaganda
          </div>

          <div className="mt-6">
            <p className="animate-element animate-delay-200 text-[10px] font-black uppercase tracking-[0.24em] text-[#575757]">
              Acesso interno do comercial
            </p>
            <h1 className="animate-element animate-delay-300 mt-3 text-4xl font-black uppercase leading-[0.95] text-black md:text-6xl">
              {title}
            </h1>
            <p className="animate-element animate-delay-400 mt-5 max-w-lg text-base leading-7 text-[#575757] md:text-lg">
              {description}
            </p>
          </div>

          <form className="animate-element animate-delay-500 mt-10 space-y-5" onSubmit={onSignIn}>
            <div className="space-y-2">
              <label htmlFor={emailInputId} className="ds-label">
                E-mail
              </label>
              <input
                id={emailInputId}
                name="email"
                type="email"
                placeholder="seuemail@vocedigitalpropaganda.com.br"
                className="ds-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor={accessFieldId} className="ds-label">
                Senha
              </label>
              <div className="relative">
                <input
                  id={accessFieldId}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className="ds-input pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-4 flex items-center text-[#575757] transition hover:text-black"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-3 text-[#1a1a1a]">
                <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                <span className="font-medium">Continuar logado neste dispositivo</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onResetPassword?.();
                }}
                className="font-semibold uppercase tracking-[0.08em] text-black transition hover:text-[#ffb800]"
              >
                Redefinir senha
              </button>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn-dark w-full rounded-[8px] px-5 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitLabel}
            </button>

            {feedback ? (
              <div className="rounded-[18px] border border-black/10 bg-white px-4 py-3 text-sm text-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                {feedback}
              </div>
            ) : null}
          </form>

          <div className="animate-element animate-delay-700 mt-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-black/10" />
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-[#575757]">
              ou continue com
            </span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <button
            type="button"
            onClick={onGoogleSignIn}
            disabled={googleDisabled}
            className="animate-element animate-delay-800 btn-outline-dark mt-5 flex w-full items-center justify-center gap-3 rounded-[8px] px-5 py-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <GoogleIcon />
            {googleLabel}
          </button>

          <div className="animate-element animate-delay-900 mt-8 flex items-start gap-3 rounded-[20px] border border-black/10 bg-white px-5 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <div className="rounded-full bg-[#ffb800] p-2 text-black">
              <ShieldCheck className="size-4" />
            </div>
            <p className="text-sm leading-6 text-[#575757]">
              Ambiente protegido para operação interna. Rotas privadas do CRM só abrem com sessão válida.
            </p>
          </div>

          <p className="animate-element animate-delay-1000 mt-6 text-sm text-[#575757]">
            Novo por aqui?{" "}
            <button
              type="button"
              onClick={() => {
                onCreateAccount?.();
              }}
              className="font-semibold uppercase tracking-[0.08em] text-black transition hover:text-[#ffb800]"
            >
              Solicitar acesso
            </button>
          </p>
        </div>
      </section>

      {heroImageSrc ? (
        <section className="relative hidden min-h-[100dvh] flex-1 overflow-hidden md:block">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.78))]" />
          <div className="animate-slide-right animate-delay-300 absolute inset-0 flex flex-col justify-between p-10 lg:p-14">
            <div className="max-w-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#ffb800]">
                Operação, pipeline e follow-up
              </p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.95] text-white lg:text-6xl">
                O CRM da agência precisa ter cara de agência.
              </h2>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/76 lg:text-lg">
                Menos tela neutra, mais comando visual, contexto comercial e clareza para a equipe vender.
              </p>
            </div>

            {testimonials.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
                {testimonials[1] ? (
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                ) : null}
                {testimonials[2] ? (
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};
