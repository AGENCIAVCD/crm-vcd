"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Activity,
  CircleDot,
  Clock3,
  GripVertical,
  Mail,
  Phone,
  RadioTower,
  RefreshCw,
} from "lucide-react";
import { LeadDetails } from "@/components/lead-modal/LeadDetails";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge-2";
import { Button } from "@/components/ui/button-1";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { cn, formatCurrency, formatElapsedTime, getLeadSlaState } from "@/lib/utils";
import type { BoardColumn, LeadRow, StageRow } from "@/types/crm";

type BoardProps = {
  pipelineId: string;
  tenantId?: string;
  initialColumns?: BoardColumn[];
};

const EMPTY_COLUMNS: BoardColumn[] = [];
const STAGE_SELECT = "id, pipeline_id, tenant_id, name, position";
const LEAD_SELECT =
  "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at";

function findLead(columns: BoardColumn[], leadId: string | null) {
  if (!leadId) {
    return null;
  }

  return columns.flatMap((column) => column.leads).find((lead) => lead.id === leadId) ?? null;
}

function cloneColumns(columns: BoardColumn[]) {
  return columns.map((column) => ({
    ...column,
    leads: column.leads.map((lead) => ({
      ...lead,
    })),
  }));
}

function moveLead(
  columns: BoardColumn[],
  activeContainer: string,
  activeIndex: number,
  overContainer: string,
  overIndex: number,
) {
  const draft = cloneColumns(columns);
  const sourceColumn = draft.find((column) => column.id === activeContainer);
  const targetColumn = draft.find((column) => column.id === overContainer);

  if (!sourceColumn || !targetColumn) {
    return columns;
  }

  if (activeIndex < 0 || activeIndex >= sourceColumn.leads.length) {
    return columns;
  }

  if (sourceColumn.id === targetColumn.id) {
    if (activeIndex === overIndex) {
      return columns;
    }

    targetColumn.leads = arrayMove(
      targetColumn.leads,
      activeIndex,
      Math.max(0, Math.min(overIndex, targetColumn.leads.length - 1)),
    );
    return draft;
  }

  const [movedLead] = sourceColumn.leads.splice(activeIndex, 1);
  const nextLead: LeadRow = {
    ...movedLead,
    stage_id: overContainer,
    last_interaction_at: new Date().toISOString(),
  };
  const safeIndex = Math.max(0, Math.min(overIndex, targetColumn.leads.length));
  targetColumn.leads.splice(safeIndex, 0, nextLead);
  return draft;
}

function buildColumns(stages: StageRow[], leads: LeadRow[]) {
  return stages.map((stage) => ({
    ...stage,
    leads: leads.filter((lead) => lead.stage_id === stage.id),
  }));
}

function buildColumnRecord(columns: BoardColumn[]) {
  return Object.fromEntries(columns.map((column) => [column.id, column.leads])) as Record<
    string,
    LeadRow[]
  >;
}

function syncColumnsFromRecord(record: Record<string, LeadRow[]>, columns: BoardColumn[]) {
  const columnMap = new Map(columns.map((column) => [column.id, column]));

  return Object.keys(record).map((columnId, index) => {
    const currentColumn = columnMap.get(columnId);

    if (!currentColumn) {
      throw new Error(`Coluna ${columnId} nao encontrada ao sincronizar Kanban.`);
    }

    return {
      ...currentColumn,
      position: index,
      leads: record[columnId] ?? [],
    };
  });
}

function getLeadInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

function getLeadTone(timestamp: string | null | undefined) {
  const slaState = getLeadSlaState(timestamp);

  if (slaState === "critical") {
    return {
      card: "border-rose-300 bg-rose-50/85",
      badge: "destructive" as const,
      badgeAppearance: "light" as const,
      label: "Critico",
    };
  }

  if (slaState === "warning") {
    return {
      card: "border-amber-300 bg-amber-50/85",
      badge: "warning" as const,
      badgeAppearance: "light" as const,
      label: "Atenção",
    };
  }

  return {
    card: "border-line bg-white",
    badge: "success" as const,
    badgeAppearance: "light" as const,
    label: "Saudavel",
  };
}

function renderLeadCard(lead: LeadRow, onOpenLead: (lead: LeadRow) => void) {
  const tone = getLeadTone(lead.last_interaction_at);

  return (
    <KanbanItem key={lead.id} value={lead.id}>
      <article
        className={cn(
          "rounded-[22px] border p-4 shadow-[0_14px_35px_-26px_rgba(15,23,42,0.55)] transition",
          tone.card,
        )}
      >
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => onOpenLead(lead)} className="flex-1 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-brand-soft font-semibold text-brand">
                    {getLeadInitials(lead.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold tracking-tight text-slate-950">
                    {lead.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">{formatCurrency(lead.value)}</p>
                </div>
              </div>
              <Badge variant={tone.badge} appearance={tone.badgeAppearance} className="shrink-0">
                {tone.label}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-600">
              {lead.phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-brand" />
                  {lead.phone}
                </p>
              ) : null}

              {lead.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-accent" />
                  {lead.email}
                </p>
              ) : null}

              <p className="flex items-center gap-2">
                <Clock3 className="size-4 text-slate-500" />
                {formatElapsedTime(lead.last_interaction_at)}
              </p>
            </div>
          </button>

          <KanbanItemHandle asChild>
            <button
              type="button"
              aria-label={`Arrastar lead ${lead.name}`}
              className="rounded-2xl border border-line bg-slate-50 p-2 text-slate-400 transition hover:border-brand/25 hover:text-brand"
            >
              <GripVertical className="size-4" />
            </button>
          </KanbanItemHandle>
        </div>
      </article>
    </KanbanItem>
  );
}

export function Board({
  pipelineId,
  tenantId: tenantIdFromPage,
  initialColumns = EMPTY_COLUMNS,
}: BoardProps) {
  const { tenantId: tenantIdFromAuth } = useAuth();
  const tenantId = tenantIdFromAuth ?? tenantIdFromPage ?? null;
  const [columns, setColumns] = useState<BoardColumn[] | null>(null);
  const [selectedLead, setSelectedLead] = useState<LeadRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSyncedRealtime, setHasSyncedRealtime] = useState(false);
  const visibleColumns = columns ?? initialColumns;
  const columnRecord = buildColumnRecord(visibleColumns);

  async function syncBoard() {
    if (!tenantId || !isSupabaseConfigured()) {
      return;
    }

    try {
      setIsLoading(true);

      const supabase = createBrowserSupabaseClient();
      const { data: stages, error: stagesError } = await supabase
        .from("stages")
        .select(STAGE_SELECT)
        .eq("tenant_id", tenantId)
        .eq("pipeline_id", pipelineId)
        .order("position");

      if (stagesError) {
        throw stagesError;
      }

      const stageIds = stages.map((stage) => stage.id);
      let leads: LeadRow[] = [];

      if (stageIds.length > 0) {
        const { data: loadedLeads, error: leadsError } = await supabase
          .from("leads")
          .select(LEAD_SELECT)
          .eq("tenant_id", tenantId)
          .in("stage_id", stageIds)
          .order("last_interaction_at", { ascending: true });

        if (leadsError) {
          throw leadsError;
        }

        leads = loadedLeads;
      }

      const nextColumns = buildColumns(stages, leads);
      startTransition(() => {
        setColumns(nextColumns);
        setHasSyncedRealtime(true);
      });
    } catch (error) {
      console.error("Falha ao carregar pipeline:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadBoardFromSupabaseEffect = useEffectEvent(async () => {
    await syncBoard();
  });

  useEffect(() => {
    void loadBoardFromSupabaseEffect();
  }, [pipelineId, tenantId]);

  useEffect(() => {
    if (!tenantId || !isSupabaseConfigured()) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`tenant:${tenantId}:pipeline:${pipelineId}:leads`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `tenant_id=eq.${tenantId}`,
        },
        () => {
          void loadBoardFromSupabaseEffect();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pipelineId, tenantId]);

  useEffect(() => {
    if (!selectedLead) {
      return;
    }

    const freshLead = findLead(visibleColumns, selectedLead.id);

    if (freshLead && freshLead !== selectedLead) {
      setSelectedLead(freshLead);
    }
  }, [selectedLead, visibleColumns]);

  async function persistStageChange(leadId: string, stageId: string) {
    if (!tenantId || !isSupabaseConfigured()) {
      return;
    }

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("leads")
        .update({
          stage_id: stageId,
          last_interaction_at: new Date().toISOString(),
        })
        .eq("id", leadId)
        .eq("tenant_id", tenantId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Falha ao mover lead:", error);
      void syncBoard();
    }
  }

  const totalLeads = visibleColumns.reduce(
    (sum, column) => sum + column.leads.length,
    0,
  );
  const modeLabel = hasSyncedRealtime
    ? "Realtime sincronizado"
    : "Sincronizando Supabase";

  return (
    <>
      <section
        data-panel
        className="overflow-hidden rounded-[30px] border border-white/70 p-5 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]"
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft px-3 py-1 text-xs font-semibold tracking-[0.2em] text-brand uppercase">
              <Activity className="size-3.5" />
              Kanban fluido
            </div>
            <p className="text-sm leading-6 text-muted">
              {totalLeads} leads em acompanhamento. Drag and drop otimista com
              assinatura Realtime na tabela `leads`.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge
              variant="primary"
              appearance="light"
              className="rounded-full border border-brand/20 px-3 py-1.5 text-sm font-medium"
            >
              <RadioTower className="size-4" />
              {modeLabel}
            </Badge>
            <Button
              variant="outline"
              size="md"
              onClick={() => void syncBoard()}
              className="rounded-full text-slate-600 hover:text-brand"
            >
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
              Atualizar
            </Button>
          </div>
        </div>

        <Kanban
          value={columnRecord}
          onValueChange={(nextValue) => {
            setColumns(syncColumnsFromRecord(nextValue, visibleColumns));
          }}
          getItemValue={(lead) => lead.id}
          onMove={async ({
            event,
            activeContainer,
            activeIndex,
            overContainer,
            overIndex,
          }: KanbanMoveEvent) => {
            const nextColumns = moveLead(
              visibleColumns,
              activeContainer,
              activeIndex,
              overContainer,
              overIndex,
            );

            setColumns(nextColumns);

            if (activeContainer !== overContainer) {
              await persistStageChange(String(event.active.id), overContainer);
            }
          }}
          className="overflow-x-auto pb-2"
        >
          <KanbanBoard className="grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {visibleColumns.map((column) => {
              const stageValue = column.leads.reduce(
                (sum, lead) => sum + Number(lead.value ?? 0),
                0,
              );

              return (
                <KanbanColumn
                  key={column.id}
                  value={column.id}
                  disabled
                  className="min-h-[540px] rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,247,251,0.92))] p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.45)]"
                >
                  <div className="mb-4 space-y-3 rounded-[22px] border border-line/80 bg-white/80 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-brand-soft p-2 text-brand">
                          <CircleDot className="size-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold tracking-tight text-slate-950">
                            {column.name}
                          </h3>
                          <p className="text-xs text-muted">posicao {column.position + 1}</p>
                        </div>
                      </div>

                      <Badge variant="secondary" appearance="light" className="rounded-full px-3 py-1">
                        {column.leads.length}
                      </Badge>
                    </div>

                    <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      Pipeline estimado:{" "}
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(stageValue)}
                      </span>
                    </div>
                  </div>

                  <KanbanColumnContent value={column.id} className="flex flex-1 flex-col gap-3 [content-visibility:auto]">
                    {column.leads.map((lead) => renderLeadCard(lead, setSelectedLead))}

                    {column.leads.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center rounded-[22px] border border-dashed border-line bg-white/60 px-4 py-10 text-center text-sm text-muted">
                        Solte um lead aqui para mover para esta etapa.
                      </div>
                    ) : null}
                  </KanbanColumnContent>
                </KanbanColumn>
              );
            })}
          </KanbanBoard>

          <KanbanOverlay>
            {({ value, variant }) => {
              if (variant === "item") {
                const lead = findLead(visibleColumns, String(value));

                if (lead) {
                  return (
                    <div className="opacity-95">
                      <article className="rounded-[22px] border border-line bg-white p-4 shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)]">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-brand-soft font-semibold text-brand">
                              {getLeadInitials(lead.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-slate-950">{lead.name}</p>
                            <p className="text-sm text-muted">{formatCurrency(lead.value)}</p>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                }
              }

              return <div className="size-full rounded-[22px] bg-muted/60" />;
            }}
          </KanbanOverlay>
        </Kanban>
      </section>

      <LeadDetails
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null);
          }
        }}
      />
    </>
  );
}
