"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  CircleDollarSign,
  DatabaseZap,
  LayoutDashboard,
  Plus,
  Search,
  Target,
} from "lucide-react";
import { Column } from "@/components/sales-kanban/Column";
import { KanbanProvider, useSalesKanban } from "@/components/sales-kanban/KanbanContext";
import { LeadModal } from "@/components/sales-kanban/LeadModal";
import {
  KANBAN_STAGES,
  type Lead,
  type LeadDraft,
  type StageId,
} from "@/components/sales-kanban/types";
import { formatCurrency } from "@/lib/utils";

type SalesKanbanDashboardProps = {
  userName: string;
};

function matchesQuery(lead: Lead, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    lead.clientName,
    lead.company,
    lead.service,
    lead.origin,
    lead.email,
    lead.whatsapp,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function isStageId(value: string): value is StageId {
  return KANBAN_STAGES.some((stage) => stage.id === value);
}

function getStageForLead(board: ReturnType<typeof useSalesKanban>["board"], leadId: string) {
  return KANBAN_STAGES.find((stage) =>
    board[stage.id].some((lead) => lead.id === leadId),
  )?.id;
}

function DragPreview({ lead }: { lead: Lead }) {
  return (
    <div className="w-[260px] rotate-[0.8deg] rounded-[14px] border border-black/10 bg-white p-3 shadow-[0_16px_40px_-26px_rgba(0,0,0,0.24)]">
      <p className="ds-ui-title line-clamp-1 text-[0.8125rem] text-black">
        {lead.company}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[0.6875rem] leading-4 text-[#6b7280]">
        {lead.clientName}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#f2ddb0] bg-[#fff8e1] px-2 py-1 text-[9px] font-medium text-[#8a6a00]">
          {lead.service}
        </span>
        <strong className="text-[0.8125rem] font-medium text-black">
          {formatCurrency(lead.estimatedValue)}
        </strong>
      </div>
    </div>
  );
}

function BoardWorkspace({ userName }: SalesKanbanDashboardProps) {
  const {
    board,
    leads,
    isHydrated,
    query,
    setQuery,
    createLead,
    updateLead,
    moveLead,
    findLead,
  } = useSalesKanban();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const filteredBoard = useMemo(
    () =>
      KANBAN_STAGES.reduce((accumulator, stage) => {
        accumulator[stage.id] = board[stage.id].filter((lead) => matchesQuery(lead, query));
        return accumulator;
      }, {} as typeof board),
    [board, query],
  );

  const totalValue = leads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
  const activeLead = findLead(activeLeadId);
  const selectedLead = findLead(selectedLeadId);

  function handleDragStart(event: DragStartEvent) {
    setActiveLeadId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveLeadId(null);

    if (!over) {
      return;
    }

    const leadId = String(active.id);
    const overId = String(over.id);
    const overStageId = isStageId(overId) ? overId : getStageForLead(board, overId);

    if (!overStageId) {
      return;
    }

    const targetIndex = isStageId(overId)
      ? board[overStageId].length
      : board[overStageId].findIndex((lead) => lead.id === overId);

    moveLead(leadId, overStageId, targetIndex < 0 ? board[overStageId].length : targetIndex);
  }

  function handleCreateLead(draft: LeadDraft) {
    createLead(draft);
  }

  function handleUpdateLead(leadId: string, draft: LeadDraft) {
    updateLead(leadId, draft);
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-[24px] border border-black/8 bg-white shadow-[0_12px_44px_-36px_rgba(0,0,0,0.22)]">
        <div className="grid gap-5 px-4 py-4 md:grid-cols-[1fr_auto] md:items-start lg:px-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-[#fafafa] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
              <LayoutDashboard className="size-3" />
              Sales board
            </div>
            <h2 className="ds-ui-title mt-3 max-w-3xl text-[1.125rem] leading-[1.15] text-[#111111] md:text-[1.375rem]">
              Pipeline comercial
            </h2>
            <p className="mt-2 max-w-2xl text-[0.8125rem] leading-5 text-[#6b7280]">
              Leads manuais com busca, dossiê e drag and drop.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 md:min-w-[460px]">
            <div className="rounded-[16px] border border-black/8 bg-[#fafafa] p-3">
              <Target className="size-4 text-[#8a6a00]" />
              <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Leads
              </p>
              <p className="mt-1 text-[1.125rem] font-medium text-[#111111]">{leads.length}</p>
            </div>
            <div className="rounded-[16px] border border-black/8 bg-[#fafafa] p-3 sm:col-span-2">
              <CircleDollarSign className="size-4 text-[#8a6a00]" />
              <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Pipeline estimado
              </p>
              <p className="mt-1 text-[1.125rem] font-medium text-[#111111]">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-black/6 bg-[#fcfcfc] px-4 py-3 lg:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, empresa, serviço ou origem..."
                className="w-full rounded-[12px] border border-black/8 bg-white px-10 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/20 focus:ring-3 focus:ring-black/5"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-black/8 bg-white px-3 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#6b7280]">
                <DatabaseZap className="size-3.5 text-[#8a6a00]" />
                {isHydrated ? `Sessão de ${userName}` : "Carregando sessão"}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[#111111] px-4 py-2.5 text-[0.75rem] font-medium text-white transition hover:bg-[#202020]"
              >
                <Plus className="size-3.5" />
                Novo Lead
              </button>
            </div>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-[24px] border border-black/8 bg-[#fbfbfb] p-3 shadow-[0_12px_44px_-36px_rgba(0,0,0,0.18)]">
          <div className="flex min-w-max gap-3">
            {KANBAN_STAGES.map((stage) => {
              const stageLeads = filteredBoard[stage.id];
              const stageValue = board[stage.id].reduce(
                (sum, lead) => sum + lead.estimatedValue,
                0,
              );

              return (
                <Column
                  key={stage.id}
                  id={stage.id}
                  title={stage.title}
                  subtitle={stage.subtitle}
                  leads={stageLeads}
                  totalValue={stageValue}
                  onOpenDossier={setSelectedLeadId}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeLead ? <DragPreview lead={activeLead} /> : null}
        </DragOverlay>
      </DndContext>

      <LeadModal
        open={isCreateOpen}
        mode="create"
        lead={null}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreateLead}
        onUpdate={handleUpdateLead}
      />

      <LeadModal
        open={Boolean(selectedLead)}
        mode="details"
        lead={selectedLead}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLeadId(null);
          }
        }}
        onCreate={handleCreateLead}
        onUpdate={handleUpdateLead}
      />
    </section>
  );
}

export function SalesKanbanDashboard(props: SalesKanbanDashboardProps) {
  return (
    <KanbanProvider>
      <BoardWorkspace {...props} />
    </KanbanProvider>
  );
}
