import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Board } from "@/components/kanban/Board";
import {
  createServerSupabaseClient,
  getAuthenticatedAppUser,
} from "@/lib/supabase-auth";
import type { BoardColumn, LeadRow, StageRow } from "@/types/crm";

type PipelinePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "VCD-CRM | Pipeline",
  description: "Kanban comercial protegido por autenticacao.",
};

export default async function PipelinePage({ params }: PipelinePageProps) {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  const { id } = await params;
  const pipelineId = id;
  const tenantId = authenticatedUser.profile.tenant_id;
  const supabase = await createServerSupabaseClient();

  let initialColumns: BoardColumn[] = [];

  if (supabase) {
    const { data: stages } = await supabase
      .from("stages")
      .select(
        "id, pipeline_id, tenant_id, name, position, description, integration_enabled, integration_label, integration_webhook_url",
      )
      .eq("tenant_id", tenantId)
      .eq("pipeline_id", pipelineId)
      .order("position");

    const stageIds = (stages ?? []).map((stage) => stage.id);
    let leads: LeadRow[] = [];

    if (stageIds.length > 0) {
        const { data: loadedLeads } = await supabase
          .from("leads")
          .select(
            "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at, notes",
          )
        .eq("tenant_id", tenantId)
        .in("stage_id", stageIds)
        .order("last_interaction_at", { ascending: true });

      leads = loadedLeads ?? [];
    }

    initialColumns = (stages ?? []).map((stage: StageRow) => ({
      ...stage,
      leads: leads.filter((lead) => lead.stage_id === stage.id),
    }));
  }

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.24em] text-[#575757] uppercase">
          Pipeline ativo
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-black uppercase leading-[0.95] text-black lg:text-5xl">
              Funil comercial principal
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#575757] lg:text-base">
              Crie leads, adicione observações, mova oportunidades entre etapas e conecte automações por coluna com uma leitura forte e operacional.
            </p>
          </div>
          <p className="rounded-full border-2 border-black bg-white px-4 py-2 text-[10px] font-black tracking-[0.18em] text-black uppercase">
            pipeline_id: {pipelineId}
          </p>
        </div>
      </div>

      <Board
        key={`${tenantId}:${pipelineId}`}
        pipelineId={pipelineId}
        tenantId={tenantId}
        initialColumns={initialColumns}
      />
    </section>
  );
}
