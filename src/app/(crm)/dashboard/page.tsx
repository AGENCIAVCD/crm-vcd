import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock3, DatabaseZap, Target, TrendingUp } from "lucide-react";
import { getAuthenticatedAppUser, createServerSupabaseClient } from "@/lib/supabase-auth";
import { formatCurrency, getLeadSlaState } from "@/lib/utils";

const LEAD_STATS_SELECT = "id, value, last_interaction_at";

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

  const stats = [
    {
      label: "Leads ativos",
      value: String(leads.length),
      icon: Target,
      tone: "bg-brand-soft text-brand",
    },
    {
      label: "Pipeline estimado",
      value: formatCurrency(totalValue),
      icon: TrendingUp,
      tone: "bg-accent-soft text-accent",
    },
    {
      label: "SLAs criticos",
      value: String(criticalCount),
      icon: Clock3,
      tone: "bg-rose-50 text-rose-600",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            data-panel
            className="rounded-[26px] border border-white/70 p-5 shadow-[0_18px_55px_-38px_rgba(15,23,42,0.5)]"
          >
            <div
              className={`inline-flex rounded-2xl p-3 ${stat.tone}`}
            >
              <stat.icon className="size-5" />
            </div>
            <p className="mt-5 text-sm text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      <article
        data-panel
        className="rounded-[30px] border border-white/70 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent-soft px-3 py-1 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              <DatabaseZap className="size-3.5" />
              Area autenticada
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              CRM protegido por sessao e pronto para uso interno da agencia
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              O acesso ao dashboard agora depende de login valido. As metricas
              abaixo refletem somente os dados do tenant autenticado.
            </p>
          </div>

          {pipelineId ? (
            <Link
              href={`/pipelines/${pipelineId}`}
              className="btn-dark inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition"
            >
              Abrir pipeline
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
        </div>
      </article>
    </section>
  );
}
