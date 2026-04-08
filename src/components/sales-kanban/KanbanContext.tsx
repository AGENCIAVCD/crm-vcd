"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getBoardStorageKey,
  getIntegrationStorageKey,
  leadRepository,
} from "@/components/sales-kanban/lead-repository";
import {
  EMPTY_BOARD_STATE,
  EMPTY_STAGE_INTEGRATIONS,
  KANBAN_STAGES,
  type BoardState,
  type Lead,
  type LeadDraft,
  type StageIntegrationConfig,
  type StageIntegrationsState,
  type StageId,
} from "@/components/sales-kanban/types";

type KanbanContextValue = {
  board: BoardState;
  integrations: StageIntegrationsState;
  leads: Lead[];
  isHydrated: boolean;
  query: string;
  setQuery: (query: string) => void;
  createLead: (draft: LeadDraft) => Lead;
  updateLead: (leadId: string, draft: LeadDraft) => void;
  moveLead: (leadId: string, targetStageId: StageId, targetIndex: number) => void;
  updateStageIntegration: (stageId: StageId, config: StageIntegrationConfig) => void;
  findLead: (leadId: string | null) => Lead | null;
};

const KanbanContext = createContext<KanbanContextValue | null>(null);

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getAllLeads(board: BoardState) {
  return KANBAN_STAGES.flatMap((stage) => board[stage.id]);
}

function findStageByLead(board: BoardState, leadId: string) {
  return KANBAN_STAGES.find((stage) =>
    board[stage.id].some((lead) => lead.id === leadId),
  )?.id;
}

function removeLeadFromBoard(board: BoardState, leadId: string) {
  const nextBoard = { ...board };
  let removedLead: Lead | null = null;

  for (const stage of KANBAN_STAGES) {
    const currentLeads = nextBoard[stage.id];
    const leadIndex = currentLeads.findIndex((lead) => lead.id === leadId);

    if (leadIndex !== -1) {
      const nextLeads = [...currentLeads];
      const [lead] = nextLeads.splice(leadIndex, 1);
      removedLead = lead;
      nextBoard[stage.id] = nextLeads;
      break;
    }
  }

  return {
    board: nextBoard,
    lead: removedLead,
  };
}

function getStageMeta(stageId: StageId) {
  return KANBAN_STAGES.find((stage) => stage.id === stageId) ?? null;
}

async function dispatchStageIntegration(params: {
  lead: Lead;
  stageId: StageId;
  previousStageId?: StageId | null;
  config: StageIntegrationConfig;
}) {
  if (!params.config.enabled || !params.config.webhookUrl || params.config.provider === "none") {
    return;
  }

  const currentStage = getStageMeta(params.stageId);
  const previousStage = params.previousStageId ? getStageMeta(params.previousStageId) : null;

  try {
    await fetch("/api/integrations/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: params.config.provider,
        stageId: params.stageId,
        stageTitle: currentStage?.title ?? params.stageId,
        previousStageId: params.previousStageId ?? null,
        previousStageTitle: previousStage?.title ?? null,
        webhookUrl: params.config.webhookUrl,
        integrationLabel: params.config.label,
        event: params.previousStageId ? "lead.stage.entered" : "lead.created",
        lead: params.lead,
      }),
    });
  } catch (error) {
    console.error("Falha ao disparar integracao da etapa.", error);
  }
}

export function KanbanProvider({ children }: { children: ReactNode }) {
  const { tenantId } = useAuth();
  const storageKey = useMemo(() => getBoardStorageKey(tenantId), [tenantId]);
  const integrationStorageKey = useMemo(
    () => getIntegrationStorageKey(tenantId),
    [tenantId],
  );
  const [board, setBoard] = useState<BoardState>(EMPTY_BOARD_STATE);
  const [integrations, setIntegrations] =
    useState<StageIntegrationsState>(EMPTY_STAGE_INTEGRATIONS);
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const isHydrated = hydratedKey === storageKey;

  useEffect(() => {
    const hydrationTimeout = window.setTimeout(() => {
      setBoard(leadRepository.loadBoard(storageKey));
      setIntegrations(leadRepository.loadIntegrations(integrationStorageKey));
      setHydratedKey(storageKey);
    }, 0);

    return () => window.clearTimeout(hydrationTimeout);
  }, [integrationStorageKey, storageKey]);

  useEffect(() => {
    if (hydratedKey !== storageKey) {
      return;
    }

    leadRepository.saveBoard(storageKey, board);
  }, [board, hydratedKey, storageKey]);

  useEffect(() => {
    if (hydratedKey !== storageKey) {
      return;
    }

    leadRepository.saveIntegrations(integrationStorageKey, integrations);
  }, [hydratedKey, integrationStorageKey, integrations, storageKey]);

  const createLead = useCallback((draft: LeadDraft) => {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: createId(),
      clientName: draft.clientName.trim(),
      company: draft.company.trim(),
      whatsapp: draft.whatsapp.trim(),
      email: draft.email.trim(),
      origin: draft.origin.trim(),
      service: draft.service,
      estimatedValue: Number(draft.estimatedValue || 0),
      notes: draft.notes.trim(),
      stageId: "inbox",
      createdAt: now,
      updatedAt: now,
      enteredStageAt: now,
    };

    setBoard((currentBoard) => ({
      ...currentBoard,
      inbox: [lead, ...currentBoard.inbox],
    }));

    void dispatchStageIntegration({
      lead,
      stageId: "inbox",
      previousStageId: null,
      config: integrations.inbox,
    });

    return lead;
  }, [integrations]);

  const updateLead = useCallback((leadId: string, draft: LeadDraft) => {
    setBoard((currentBoard) => {
      const sourceStageId = findStageByLead(currentBoard, leadId);

      if (!sourceStageId) {
        return currentBoard;
      }

      return {
        ...currentBoard,
        [sourceStageId]: currentBoard[sourceStageId].map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                clientName: draft.clientName.trim(),
                company: draft.company.trim(),
                whatsapp: draft.whatsapp.trim(),
                email: draft.email.trim(),
                origin: draft.origin.trim(),
                service: draft.service,
                estimatedValue: Number(draft.estimatedValue || 0),
                notes: draft.notes.trim(),
                updatedAt: new Date().toISOString(),
              }
            : lead,
        ),
      };
    });
  }, []);

  const moveLead = useCallback(
    (leadId: string, targetStageId: StageId, targetIndex: number) => {
      setBoard((currentBoard) => {
        const sourceStageId = findStageByLead(currentBoard, leadId);

        if (!sourceStageId) {
          return currentBoard;
        }

        if (sourceStageId === targetStageId) {
          const leads = currentBoard[sourceStageId];
          const activeIndex = leads.findIndex((lead) => lead.id === leadId);

          if (activeIndex === -1) {
            return currentBoard;
          }

          const safeIndex = Math.max(0, Math.min(targetIndex, leads.length - 1));

          return {
            ...currentBoard,
            [sourceStageId]: arrayMove(leads, activeIndex, safeIndex),
          };
        }

        const { board: nextBoard, lead } = removeLeadFromBoard(currentBoard, leadId);

        if (!lead) {
          return currentBoard;
        }

        const movedLead: Lead = {
          ...lead,
          stageId: targetStageId,
          updatedAt: new Date().toISOString(),
          enteredStageAt: new Date().toISOString(),
        };
        const targetLeads = [...nextBoard[targetStageId]];
        const safeIndex = Math.max(0, Math.min(targetIndex, targetLeads.length));
        targetLeads.splice(safeIndex, 0, movedLead);

        void dispatchStageIntegration({
          lead: movedLead,
          stageId: targetStageId,
          previousStageId: sourceStageId,
          config: integrations[targetStageId],
        });

        return {
          ...nextBoard,
          [targetStageId]: targetLeads,
        };
      });
    },
    [integrations],
  );

  const updateStageIntegration = useCallback(
    (stageId: StageId, config: StageIntegrationConfig) => {
      setIntegrations((current) => ({
        ...current,
        [stageId]: config,
      }));
    },
    [],
  );

  const findLead = useCallback(
    (leadId: string | null) => {
      if (!leadId) {
        return null;
      }

      return getAllLeads(board).find((lead) => lead.id === leadId) ?? null;
    },
    [board],
  );

  const value = useMemo<KanbanContextValue>(
    () => ({
      board,
      integrations,
      leads: getAllLeads(board),
      isHydrated,
      query,
      setQuery,
      createLead,
      updateLead,
      moveLead,
      updateStageIntegration,
      findLead,
    }),
    [
      board,
      createLead,
      findLead,
      integrations,
      isHydrated,
      moveLead,
      query,
      updateLead,
      updateStageIntegration,
    ],
  );

  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}

export function useSalesKanban() {
  const context = useContext(KanbanContext);

  if (!context) {
    throw new Error("useSalesKanban must be used inside KanbanProvider.");
  }

  return context;
}
