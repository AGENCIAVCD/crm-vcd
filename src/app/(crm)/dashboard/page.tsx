import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  MessageCircleMore,
  Rows3,
  Target,
  TrendingUp,
} from "lucide-react";
import { getAuthenticatedAppUser, createServerSupabaseClient } from "@/lib/supabase-auth";
import { formatCurrency, getLeadSlaState } from "@/lib/utils";

const LEAD_STATS_SELECT = "id, value, last_interaction_at, notes, phone";

export default async function DashboardPage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  const supabase = await createServerSupabaseClient();
  const pipelineId = process.env.NEXT_PUBLIC_DEFAULT_PIPELINE_ID;
  let leads: Array<{
    id: string;
    value: number | null;
    last_interaction_at: string | null;
    notes: string | null;
    phone: string | null;
  }> = [];

  if (supabase) {
    const { data } = await supabase
      .from("leads")
      .select(LEAD_STATS_SELECT)
      .eq("tenant_id", authenticatedUser.profile.tenant_id);

    leads = data ?? [];
  }

  const totalValue = leads.reduce((sum, lead) => sum + Number(lead.value ?? 0), 0);
  const criticalCount = leads.filter(
    (lead) => getLeadSlaState(lead.last_interaction_at) === "critical",
  ).length;
  const withNotesCount = leads.filter((lead) => Boolean(lead.notes?.trim())).length;
  const whatsappReadyCount = leads.filter((lead) => Boolean(lead.phone?.trim())).length;

  const stats = [
    {
      label: "Leads ativos",
      value: String(leads.length),
      icon: Target,
      accent: "bg-[#ffb800] text-black",
    },
    {
      label: "Pipeline estimado",
      value: formatCurrency(totalValue),
      icon: TrendingUp,
      accent: "bg-black text-white",
    },
    {
      label: "SLAs críticos",
      value: String(criticalCount),
      icon: Clock3,
      accent: "bg-[#fff1bf] text-black",
    },
  ];

  const operations = [
    {
      label: "Leads com observação",
      value: String(withNotesCount),
      icon: Rows3,
    },
    {
      label: "Leads com WhatsApp pronto",
      value: String(whatsappReadyCount),
      icon: MessageCircleMore,
    },
  ];

  return (
    <section className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="ds-panel p-6">
            <div className={`inline-flex rounded-[18px] p-3 ${stat.accent}`}>
              <stat.icon className="size-5" />
            </div>
            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-[#575757]">
              {stat.label}
            </p>
            <p className="mt-3 text-4xl font-black uppercase leading-none text-black">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="overflow-hidden rounded-[28px] border border-black bg-black text-white shadow-[0_18px_50px_-24px_rgba(0,0,0,0.55)]">
          <div className="space-y-5 px-6 py-7 lg:px-8">
            <div className="ds-kicker">Painel Operacional</div>
            <div>
              <h2 className="text-3xl font-black uppercase leading-[0.95] lg:text-5xl">
                O CRM já virou máquina de operação.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/74 lg:text-base">
                Crie leads, registre contexto, mova etapas, configure webhooks por coluna e mantenha o histórico comercial centralizado.
              </p>
            </div>

            {pipelineId ? (
              <Link
                href={`/pipelines/${pipelineId}`}
                className="btn-attention inline-flex items-center justify-center gap-2 rounded-[8px] px-5 py-4 text-sm font-bold transition"
              >
                Abrir Pipeline Agora
                <ArrowRight className="size-4" />
              </Link>
            ) : null}
          </div>
        </article>

        <article className="ds-panel p-6">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#575757]">
            Visão rápida
          </p>
          <h3 className="mt-3 text-2xl font-black uppercase leading-tight text-black">
            O que precisa de atenção hoje
          </h3>
          <div className="mt-6 space-y-4">
            {operations.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-[20px] border border-[#e5e5e5] bg-[#f2f2f2] px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-[16px] bg-[#ffb800] p-2.5 text-black">
                    <item.icon className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-black">{item.label}</span>
                </div>
                <span className="text-2xl font-black uppercase text-black">{item.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
