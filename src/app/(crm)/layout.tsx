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
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1520px] flex-col px-3 py-3 sm:px-4 lg:px-5">
        <header className="sticky top-2 z-30 mb-3 rounded-[18px] border border-[#2a2a2a] bg-[#171717]/92 px-3 py-2.5 text-white shadow-[0_18px_50px_-38px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-[12px] bg-[#ffb500] text-black">
                <ShieldCheck className="size-4.5" />
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#ffcf5c]">
                  Você Digital Propaganda
                </p>
                <h1 className="ds-display-title text-[1rem] leading-tight text-white md:text-[1.2rem]">
                  VCD CRM
                </h1>
              </div>
              <nav className="ml-1 flex flex-wrap gap-1.5 text-[0.75rem]">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#2a2a2a] bg-[#ffb500] px-3 py-2 font-medium text-black transition hover:bg-[#e2a000]"
                >
                  <LayoutDashboard className="size-3.5" />
                  Board
                </Link>
                {pipelineId ? (
                  <Link
                    href={`/pipelines/${pipelineId}`}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-2 font-medium text-white transition hover:border-[#ffb500]/50 hover:text-[#ffcf5c]"
                  >
                    <Rows3 className="size-3.5" />
                    Pipeline
                  </Link>
                ) : null}
              </nav>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-[14px] border border-[#2a2a2a] bg-[#1d1d1d] px-3.5 py-2.5 text-white">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8c8c8c]">
                  Sessão ativa
                </p>
                <p className="mt-1 text-[0.8125rem] font-medium leading-tight text-white">
                  {authenticatedUser.profile.full_name}
                </p>
                <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-[#ffcf5c]">
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
