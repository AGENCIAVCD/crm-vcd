import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, LayoutDashboard, Rows3 } from "lucide-react";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

export default async function CrmLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  const pipelineId = process.env.NEXT_PUBLIC_DEFAULT_PIPELINE_ID;

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header
          data-panel
          className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/70 px-5 py-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)] sm:px-6"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold tracking-[0.22em] text-brand uppercase">
                <BarChart3 className="size-3.5" />
                VCD CRM
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                  SaaS multi-tenant para a equipe comercial da agencia
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-muted">
                  Base inicial em Next.js, Supabase Realtime e Kanban otimizado
                  para dogfooding da Voce Digital Propaganda.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">
                  {authenticatedUser.profile.full_name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
                  {authenticatedUser.profile.role}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>

          <nav className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-brand/30 hover:text-brand"
            >
              <LayoutDashboard className="size-4" />
              Dashboard
            </Link>
            {pipelineId ? (
              <Link
                href={`/pipelines/${pipelineId}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-line bg-white px-4 py-2 font-medium text-slate-700 transition hover:border-brand/30 hover:text-brand"
              >
                <Rows3 className="size-4" />
                Kanban Principal
              </Link>
            ) : null}
          </nav>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
