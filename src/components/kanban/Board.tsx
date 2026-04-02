"use client";

import {
  closestCorners,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { Activity, RadioTower, RefreshCw } from "lucide-react";
import { Column } from "@/components/kanban/Column";
import { LeadDetails } from "@/components/lead-modal/LeadDetails";
import { useAuth } from "@/components/providers/auth-provider";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
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

function findLeadStage(columns: BoardColumn[], leadId: string) {
  return columns.find((column) => column.leads.some((lead) => lead.id === leadId)) ?? null;
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
  activeLeadId: string,
  overId: string,
  overType: "lead" | "stage",
  targetStageId: string,
) {
  const draft = cloneColumns(columns);
  const sourceColumn = draft.find((column) =>
    column.leads.some((lead) => lead.id === activeLeadId),
  );
  const targetColumn = draft.find((column) => column.id === targetStageId);

  if (!sourceColumn || !targetColumn) {
    return columns;
  }

  const sourceIndex = sourceColumn.leads.findIndex((lead) => lead.id === activeLeadId);

  if (sourceIndex === -1) {
    return columns;
  }

  if (sourceColumn.id === targetColumn.id && overType === "lead") {
    const targetIndex = targetColumn.leads.findIndex((lead) => lead.id === overId);

    if (targetIndex === -1 || targetIndex === sourceIndex) {
      return columns;
    }

    targetColumn.leads = arrayMove(targetColumn.leads, sourceIndex, targetIndex);
    return draft;
  }

  const [movedLead] = sourceColumn.leads.splice(sourceIndex, 1);
  const nextLead: LeadRow = {
    ...movedLead,
    stage_id: targetStageId,
    last_interaction_at: new Date().toISOString(),
  };

  if (sourceColumn.id === targetColumn.id) {
    targetColumn.leads.push(nextLead);
    return draft;
  }

  if (overType === "lead") {
    const targetIndex = targetColumn.leads.findIndex((lead) => lead.id === overId);

    if (targetIndex === -1) {
      targetColumn.leads.push(nextLead);
    } else {
      targetColumn.leads.splice(targetIndex, 0, nextLead);
    }

    return draft;
  }

  targetColumn.leads.push(nextLead);
  return draft;
}

function buildColumns(stages: StageRow[], leads: LeadRow[]) {
  return stages.map((stage) => ({
    ...stage,
    leads: leads.filter((lead) => lead.stage_id === stage.id),
  }));
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
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSyncedRealtime, setHasSyncedRealtime] = useState(false);
  const visibleColumns = columns ?? initialColumns;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  function handleDragStart(event: DragStartEvent) {
    setActiveLeadId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLeadId(null);

    if (!event.over) {
      return;
    }

    const activeLeadId = String(event.active.id);
    const overId = String(event.over.id);
    const sourceColumn = findLeadStage(visibleColumns, activeLeadId);

    if (!sourceColumn) {
      return;
    }

    const overType = event.over.data.current?.type === "stage" ? "stage" : "lead";
    const targetStageId =
      overType === "stage"
        ? String(event.over.data.current?.stageId ?? overId)
        : String(event.over.data.current?.stageId ?? overId);

    if (!targetStageId) {
      return;
    }

    const nextColumns = moveLead(
      visibleColumns,
      activeLeadId,
      overId,
      overType,
      targetStageId,
    );
    const targetColumn = findLeadStage(nextColumns, activeLeadId);

    if (!targetColumn) {
      return;
    }

    setColumns(nextColumns);

    if (sourceColumn.id !== targetColumn.id) {
      await persistStageChange(activeLeadId, targetColumn.id);
    }
  }

  const activeLead = findLead(visibleColumns, activeLeadId);
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
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium",
                "border-brand/20 bg-brand-soft text-brand",
              )}
            >
              <RadioTower className="size-4" />
              {modeLabel}
            </span>
            <button
              type="button"
              onClick={() => void syncBoard()}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-brand/25 hover:text-brand"
            >
              <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={(event) => {
                void handleDragEnd(event);
              }}
            >
              {visibleColumns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  onOpenLead={setSelectedLead}
                />
              ))}
            </DndContext>
          </div>
        </div>

        {activeLead ? (
          <div className="mt-4 text-xs text-slate-500">
            Arrastando: <span className="font-semibold text-slate-700">{activeLead.name}</span>
          </div>
        ) : null}
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
