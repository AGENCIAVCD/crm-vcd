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
    <div className="w-[300px] rotate-1 rounded-[22px] border border-[#ffb800] bg-white p-4 shadow-[0_32px_90px_-42px_rgba(0,0,0,0.9)]">
      <p className="line-clamp-1 text-sm font-black uppercase tracking-tight text-black">
        {lead.company}
      </p>
      <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#575757]">
        {lead.clientName}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded-full bg-[#ffb800] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black">
          {lead.service}
        </span>
        <strong className="text-sm font-black text-black">
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
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[34px] border border-[#ffb800]/30 bg-black text-white shadow-[0_40px_120px_-70px_rgba(0,0,0,0.9)]">
        <div className="grid gap-6 px-5 py-6 md:grid-cols-[1fr_auto] md:items-end lg:px-7">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ffb800] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-black">
              <LayoutDashboard className="size-3.5" />
              VCD Sales Board
            </div>
            <h2 className="mt-5 max-w-4xl text-3xl font-black uppercase leading-[0.92] text-white md:text-5xl">
              Kanban comercial para leads e clientes.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/68">
              Operação manual com LocalStorage hoje, pronta para trocar o repositório local por API quando o backend entrar.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 md:min-w-[520px]">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
              <Target className="size-5 text-[#ffb800]" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/48">
                Leads
              </p>
              <p className="mt-1 text-3xl font-black text-white">{leads.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4 sm:col-span-2">
              <CircleDollarSign className="size-5 text-[#ffb800]" />
              <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-white/48">
                Pipeline estimado
              </p>
              <p className="mt-1 text-3xl font-black text-white">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#0a0a0a] px-5 py-4 lg:px-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#ffb800]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, empresa, serviço ou origem..."
                className="w-full rounded-[16px] border border-white/10 bg-white px-11 py-3 text-sm font-semibold text-black outline-none transition focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white/68">
                <DatabaseZap className="size-4 text-[#ffb800]" />
                {isHydrated ? `Sessão de ${userName}` : "Carregando sessão"}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[#ffb800] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-black transition hover:bg-[#e5a400]"
              >
                <Plus className="size-4" />
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
        <div className="overflow-x-auto rounded-[34px] border border-black/10 bg-black p-4 shadow-[0_30px_100px_-70px_rgba(0,0,0,0.8)]">
          <div className="flex min-w-max gap-4">
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
