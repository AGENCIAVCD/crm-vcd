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
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
          Pipeline ativo
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Funil comercial principal
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Drag and drop com atualizacao otimista, sincronizacao em tempo real
              e acesso restrito a usuarios autenticados.
            </p>
          </div>
          <p className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-slate-600">
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
