import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Rows3, ShieldCheck } from "lucide-react";
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
    <div className="min-h-screen bg-[#050505]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-3 py-4 sm:px-5 lg:px-6">
        <header className="sticky top-3 z-30 mb-4 rounded-[24px] border border-[#ffb800]/30 bg-black/92 px-4 py-3 text-white shadow-[0_26px_80px_-55px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[14px] bg-[#ffb800] text-black">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#ffb800]">
                  Você Digital Propaganda
                </p>
                <h1 className="text-xl font-black uppercase leading-tight text-white md:text-2xl">
                  VCD CRM
                </h1>
              </div>
              <nav className="flex flex-wrap gap-2 text-xs">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-[10px] bg-[#ffb800] px-3 py-2 font-black uppercase tracking-[0.08em] text-black transition hover:bg-[#e5a400]"
                >
                  <LayoutDashboard className="size-4" />
                  Board
                </Link>
                {pipelineId ? (
                  <Link
                    href={`/pipelines/${pipelineId}`}
                    className="inline-flex items-center gap-2 rounded-[10px] border border-white/20 px-3 py-2 font-black uppercase tracking-[0.08em] text-white transition hover:border-[#ffb800] hover:text-[#ffb800]"
                  >
                    <Rows3 className="size-4" />
                    Pipeline
                  </Link>
                ) : null}
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3 text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                  Sessão ativa
                </p>
                <p className="mt-1 text-sm font-black uppercase leading-tight">
                  {authenticatedUser.profile.full_name}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffb800]">
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
