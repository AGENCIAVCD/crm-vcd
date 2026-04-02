import Link from "next/link";
import { ArrowRight, Clock3, DatabaseZap, Target, TrendingUp } from "lucide-react";
import { DEMO_PIPELINE_ID, getDemoBoardColumns } from "@/lib/demo-data";
import { formatCurrency, getLeadSlaState } from "@/lib/utils";

export default function DashboardPage() {
  const pipelineId =
    process.env.NEXT_PUBLIC_DEFAULT_PIPELINE_ID ?? DEMO_PIPELINE_ID;
  const columns = getDemoBoardColumns(pipelineId);
  const leads = columns.flatMap((column) => column.leads);
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
              Dogfooding pronto
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Estrutura inicial do VCD-CRM pronta para ligar no Supabase
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              O projeto ja nasce com Provider de autenticacao, webhook de
              inbound, migration SQL com RLS e um Kanban com `dnd-kit` +
              Realtime para acelerar o hackathon.
            </p>
          </div>

          <Link
            href={`/pipelines/${pipelineId}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-strong"
          >
            Abrir pipeline
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </article>
    </section>
  );
}
