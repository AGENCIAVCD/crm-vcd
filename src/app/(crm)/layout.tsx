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
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 overflow-hidden rounded-[28px] border border-black bg-black text-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)]">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div className="space-y-5">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#ffb800] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-black">
                <BarChart3 className="size-3.5" />
                VCD CRM
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">
                  Workspace comercial da agência
                </p>
                <h1 className="mt-3 max-w-3xl text-3xl font-black uppercase leading-[0.95] text-white lg:text-5xl">
                  Operação comercial com ritmo de agência e cara de marca.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74 lg:text-base">
                  Pipeline, follow-up, observações, WhatsApp e automações por etapa em uma superfície única para o time comercial da Você Digital Propaganda.
                </p>
              </div>

              <nav className="flex flex-wrap gap-3 text-sm">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-[8px] border-2 border-white bg-transparent px-4 py-3 font-bold uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-black"
                >
                  <LayoutDashboard className="size-4" />
                  Dashboard
                </Link>
                {pipelineId ? (
                  <Link
                    href={`/pipelines/${pipelineId}`}
                    className="inline-flex items-center gap-2 rounded-[8px] bg-[#ffb800] px-4 py-3 font-bold uppercase tracking-[0.08em] text-black transition hover:bg-[#e5a400]"
                  >
                    <Rows3 className="size-4" />
                    Pipeline Principal
                  </Link>
                ) : null}
              </nav>
            </div>

            <div className="flex flex-col items-start justify-between gap-4 lg:items-end">
              <div className="w-full max-w-sm rounded-[24px] bg-white p-5 text-black shadow-[0_10px_30px_-20px_rgba(0,0,0,0.4)]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#575757]">
                  Sessão ativa
                </p>
                <p className="mt-3 text-2xl font-black uppercase leading-tight">
                  {authenticatedUser.profile.full_name}
                </p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-[#575757]">
                  {authenticatedUser.profile.role}
                </p>
              </div>

              <SignOutButton />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
