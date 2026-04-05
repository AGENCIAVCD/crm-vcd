"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  Activity,
  CircleDot,
  Clock3,
  GripVertical,
  Link2,
  Mail,
  Phone,
  Plus,
  RadioTower,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { CreateLeadDialog } from "@/components/kanban/CreateLeadDialog";
import { StageConfigDialog } from "@/components/kanban/StageConfigDialog";
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
const STAGE_SELECT =
  "id, pipeline_id, tenant_id, name, position, description, integration_enabled, integration_label, integration_webhook_url";
const LEAD_SELECT =
  "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at, notes";

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

function replaceLead(columns: BoardColumn[], nextLead: LeadRow) {
  return columns.map((column) => ({
    ...column,
    leads: column.leads.map((lead) => (lead.id === nextLead.id ? nextLead : lead)),
  }));
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
      card: "border-l-4 border-[#dc2626] bg-white",
      badge: "destructive" as const,
      badgeAppearance: "outline" as const,
      label: "Critico",
    };
  }

  if (slaState === "warning") {
    return {
      card: "border-l-4 border-[#ffb800] bg-white",
      badge: "warning" as const,
      badgeAppearance: "outline" as const,
      label: "Atencao",
    };
  }

  return {
    card: "border-l-4 border-black bg-white",
    badge: "success" as const,
    badgeAppearance: "outline" as const,
    label: "Ativo",
  };
}

function getNotesPreview(notes: string | null | undefined) {
  if (!notes) {
    return null;
  }

  const compact = notes.replace(/\s+/g, " ").trim();
  return compact.length > 0 ? compact : null;
}

function renderLeadCard(lead: LeadRow, onOpenLead: (lead: LeadRow) => void) {
  const tone = getLeadTone(lead.last_interaction_at);
  const notesPreview = getNotesPreview(lead.notes);

  return (
    <KanbanItem key={lead.id} value={lead.id}>
      <article
        className={cn(
          "rounded-[24px] border border-black/10 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5",
          tone.card,
        )}
      >
        <div className="flex items-start gap-3">
          <button type="button" onClick={() => onOpenLead(lead)} className="flex-1 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-[#ffb800] font-black text-black">
                    {getLeadInitials(lead.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-black uppercase tracking-tight text-black">
                    {lead.name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[#575757]">{formatCurrency(lead.value)}</p>
                </div>
              </div>
              <Badge variant={tone.badge} appearance={tone.badgeAppearance} className="shrink-0">
                {tone.label}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-[#575757]">
              {lead.phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="size-4 text-black" />
                  {lead.phone}
                </p>
              ) : null}

              {lead.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="size-4 text-black" />
                  {lead.email}
                </p>
              ) : null}

              <p className="flex items-center gap-2">
                <Clock3 className="size-4 text-black" />
                {formatElapsedTime(lead.last_interaction_at)}
              </p>
            </div>

            {notesPreview ? (
              <div className="mt-4 rounded-[18px] border border-black/10 bg-[#f2f2f2] px-3 py-2 text-sm leading-6 text-[#575757]">
                <p className="line-clamp-3">{notesPreview}</p>
              </div>
            ) : null}
          </button>

          <KanbanItemHandle asChild>
            <button
              type="button"
              aria-label={`Arrastar lead ${lead.name}`}
              className="rounded-[14px] border border-black/10 bg-[#f2f2f2] p-2 text-black transition hover:bg-[#ffb800]"
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
  const [isCreateLeadOpen, setIsCreateLeadOpen] = useState(false);
  const [createLeadStageId, setCreateLeadStageId] = useState<string | null>(null);
  const [isStageDialogOpen, setIsStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageRow | null>(null);
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

  function openLeadCreation(stageId?: string) {
    setCreateLeadStageId(stageId ?? visibleColumns[0]?.id ?? null);
    setIsCreateLeadOpen(true);
  }

  function openStageConfig(stage?: StageRow | null) {
    setEditingStage(stage ?? null);
    setIsStageDialogOpen(true);
  }

  async function persistStageChange(leadId: string, stageId: string, previousStageId: string) {
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

      try {
        const response = await fetch("/api/pipelines/stage-integration", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leadId,
            pipelineId,
            stageId,
            previousStageId,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          console.error("Falha ao disparar integracao de etapa:", payload?.error);
        }
      } catch (integrationError) {
        console.error("Falha ao chamar a integracao da etapa:", integrationError);
      }
    } catch (error) {
      console.error("Falha ao mover lead:", error);
      void syncBoard();
    }
  }

  const totalLeads = visibleColumns.reduce((sum, column) => sum + column.leads.length, 0);
  const modeLabel = hasSyncedRealtime ? "Realtime sincronizado" : "Sincronizando Supabase";

  return (
    <>
      <section
        data-panel
        className="overflow-hidden rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="ds-kicker">
              <Activity className="size-3.5" />
              Kanban fluido
            </div>
            <p className="text-sm leading-7 text-[#575757]">
              {totalLeads} leads em acompanhamento. Agora voce pode cadastrar
              leads manualmente, registrar observacoes e configurar webhook por
              etapa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge
              variant="primary"
              appearance="light"
              className="rounded-full border border-black px-3 py-1.5 text-sm font-bold uppercase"
            >
              <RadioTower className="size-4" />
              {modeLabel}
            </Badge>
            <Button
              variant="secondary"
              size="md"
              onClick={() => openLeadCreation()}
              disabled={visibleColumns.length === 0}
              className="rounded-[8px] !bg-[#ffb800] !text-black hover:!bg-[#e5a400] uppercase font-bold"
            >
              <Plus className="size-4" />
              Novo lead
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => openStageConfig()}
              className="rounded-[8px] !border-black !text-black hover:!bg-black hover:!text-white uppercase font-bold"
            >
              <Plus className="size-4" />
              Nova etapa
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => void syncBoard()}
              className="rounded-[8px] !border-black !text-black hover:!bg-black hover:!text-white uppercase font-bold"
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
              await persistStageChange(String(event.active.id), overContainer, activeContainer);
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
                  className="min-h-[540px] rounded-[24px] border border-black/10 bg-[#fcfcfc] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                >
                  <div className="mb-4 space-y-3 rounded-[20px] border border-black bg-black p-4 text-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <div className="rounded-full bg-[#ffb800] p-2 text-black">
                          <CircleDot className="size-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black uppercase tracking-tight text-white">
                              {column.name}
                            </h3>
                            {column.integration_enabled ? (
                              <Badge
                                variant="primary"
                                appearance="light"
                                className="rounded-full !bg-[#ffb800] px-2.5 py-1 text-[11px] !text-black"
                              >
                                <Link2 className="size-3.5" />
                                {column.integration_label ?? "Webhook ativo"}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                            posicao {column.position + 1}
                          </p>
                          {column.description ? (
                            <p className="text-sm leading-6 text-white/72">{column.description}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          appearance="light"
                          className="rounded-full !bg-white px-3 py-1 !text-black"
                        >
                          {column.leads.length}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => openStageConfig(column)}
                          className="rounded-full border border-white/15 bg-white/10 p-2 text-white transition hover:bg-[#ffb800] hover:text-black"
                          aria-label={`Configurar etapa ${column.name}`}
                        >
                          <Settings2 className="size-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-[16px] bg-white/10 px-3 py-3 text-sm text-white/74">
                      <span>
                        Pipeline estimado:{" "}
                        <span className="font-black text-white">
                          {formatCurrency(stageValue)}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openLeadCreation(column.id)}
                        className="rounded-[8px] bg-[#ffb800] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-black transition hover:bg-[#e5a400]"
                      >
                        + Lead
                      </button>
                    </div>
                  </div>

                  <KanbanColumnContent
                    value={column.id}
                    className="flex flex-1 flex-col gap-3 [content-visibility:auto]"
                  >
                    {column.leads.map((lead) => renderLeadCard(lead, setSelectedLead))}

                    {column.leads.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-[22px] border-2 border-dashed border-black/15 bg-[#f2f2f2] px-4 py-10 text-center text-sm text-[#575757]">
                        <p>Solte um lead aqui ou crie o primeiro lead desta etapa.</p>
                        <button
                          type="button"
                          onClick={() => openLeadCreation(column.id)}
                          className="btn-dark rounded-[8px] px-4 py-3 text-sm font-bold transition"
                        >
                          Criar lead nesta etapa
                        </button>
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
                      <article className="rounded-[22px] border border-black/10 bg-white p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-10">
                            <AvatarFallback className="bg-[#ffb800] font-black text-black">
                              {getLeadInitials(lead.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-black uppercase text-black">{lead.name}</p>
                            <p className="text-sm text-[#575757]">{formatCurrency(lead.value)}</p>
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

      <CreateLeadDialog
        open={isCreateLeadOpen}
        onOpenChange={setIsCreateLeadOpen}
        tenantId={tenantId}
        stages={visibleColumns}
        defaultStageId={createLeadStageId}
        onCreated={(lead) => {
          setSelectedLead(lead);
          void syncBoard();
        }}
      />

      <StageConfigDialog
        open={isStageDialogOpen}
        onOpenChange={(open) => {
          setIsStageDialogOpen(open);
          if (!open) {
            setEditingStage(null);
          }
        }}
        tenantId={tenantId}
        pipelineId={pipelineId}
        defaultPosition={visibleColumns.length}
        stage={editingStage}
        onSaved={() => {
          void syncBoard();
        }}
      />

      <LeadDetails
        lead={selectedLead}
        open={Boolean(selectedLead)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLead(null);
          }
        }}
        onLeadUpdated={(updatedLead) => {
          setSelectedLead(updatedLead);
          setColumns((currentColumns) =>
            currentColumns ? replaceLead(currentColumns, updatedLead) : currentColumns,
          );
        }}
      />
    </>
  );
}
