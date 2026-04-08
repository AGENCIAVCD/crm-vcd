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
import { StageIntegrationModal } from "@/components/sales-kanban/StageIntegrationModal";
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
    <div className="w-[260px] rotate-[0.8deg] rounded-[14px] border border-[#2a2a2a] bg-[#171717] p-3 shadow-[0_18px_44px_-28px_rgba(0,0,0,0.42)]">
      <p className="ds-ui-title line-clamp-1 text-[0.8125rem] text-white">
        {lead.company}
      </p>
      <p className="mt-0.5 line-clamp-1 text-[0.6875rem] leading-4 text-[#a3a3a3]">
        {lead.clientName}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="rounded-full border border-[#473810] bg-[#2b2411] px-2 py-1 text-[9px] font-medium text-[#ffcf5c]">
          {lead.service}
        </span>
        <strong className="text-[0.8125rem] font-medium text-white">
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
    integrations,
    isHydrated,
    query,
    setQuery,
    createLead,
    updateLead,
    moveLead,
    updateStageIntegration,
    findLead,
  } = useSalesKanban();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIntegrationStageId, setSelectedIntegrationStageId] =
    useState<StageId | null>(null);

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
  const selectedIntegrationStage = selectedIntegrationStageId
    ? KANBAN_STAGES.find((stage) => stage.id === selectedIntegrationStageId) ?? null
    : null;

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
      <div className="overflow-hidden rounded-[24px] border border-[#2a2a2a] bg-[#171717] text-white shadow-[0_18px_50px_-38px_rgba(0,0,0,0.55)]">
        <div className="grid gap-5 px-4 py-4 md:grid-cols-[1fr_auto] md:items-start lg:px-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#ffcf5c]">
              <LayoutDashboard className="size-3 text-[#ffb500]" />
              Sales board
            </div>
            <h2 className="ds-ui-title mt-3 max-w-3xl text-[1.125rem] leading-[1.15] text-white md:text-[1.375rem]">
              Pipeline comercial
            </h2>
            <p className="mt-2 max-w-2xl text-[0.8125rem] leading-5 text-[#a3a3a3]">
              Leads manuais com busca, dossiê e drag and drop.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 md:min-w-[460px]">
            <div className="rounded-[16px] border border-[#2a2a2a] bg-[#1d1d1d] p-3">
              <Target className="size-4 text-[#ffb500]" />
              <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#8c8c8c]">
                Leads
              </p>
              <p className="mt-1 text-[1.125rem] font-medium text-white">{leads.length}</p>
            </div>
            <div className="rounded-[16px] border border-[#2a2a2a] bg-[#1d1d1d] p-3 sm:col-span-2">
              <CircleDollarSign className="size-4 text-[#ffb500]" />
              <p className="mt-2 text-[9px] font-medium uppercase tracking-[0.12em] text-[#8c8c8c]">
                Pipeline estimado
              </p>
              <p className="mt-1 text-[1.125rem] font-medium text-white">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-[#2a2a2a] bg-[#141414] px-4 py-3 lg:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-lg">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nome, empresa, serviço ou origem..."
                className="w-full rounded-[12px] border border-[#2a2a2a] bg-[#1d1d1d] px-10 py-2.5 text-[0.8125rem] font-normal text-white outline-none transition placeholder:text-[#8c8c8c] focus:border-[#ffb500]/60 focus:ring-3 focus:ring-[#ffb500]/10"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-[#a3a3a3]">
                <DatabaseZap className="size-3.5 text-[#ffb500]" />
                {isHydrated ? `Sessão de ${userName}` : "Carregando sessão"}
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[#ffb500] px-4 py-2.5 text-[0.75rem] font-medium text-black transition hover:bg-[#e2a000]"
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
        <div className="overflow-x-auto rounded-[24px] border border-[#2a2a2a] bg-[#141414] p-3 shadow-[0_18px_50px_-38px_rgba(0,0,0,0.55)]">
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
                  integration={integrations[stage.id]}
                  onOpenDossier={setSelectedLeadId}
                  onOpenIntegration={setSelectedIntegrationStageId}
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

      {selectedIntegrationStage ? (
        <StageIntegrationModal
          key={`${selectedIntegrationStage.id}:${integrations[selectedIntegrationStage.id].provider}:${integrations[selectedIntegrationStage.id].webhookUrl}`}
          open={Boolean(selectedIntegrationStage)}
          stageId={selectedIntegrationStage.id}
          stageTitle={selectedIntegrationStage.title}
          value={integrations[selectedIntegrationStage.id]}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIntegrationStageId(null);
            }
          }}
          onSave={(config) => updateStageIntegration(selectedIntegrationStage.id, config)}
        />
      ) : null}
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
