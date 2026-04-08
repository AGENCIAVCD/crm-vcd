"use client";

import {
  EMPTY_BOARD_STATE,
  EMPTY_STAGE_INTEGRATIONS,
  KANBAN_STAGES,
  type BoardState,
  type StageIntegrationsState,
} from "@/components/sales-kanban/types";

function cloneEmptyBoard() {
  return KANBAN_STAGES.reduce((accumulator, stage) => {
    accumulator[stage.id] = [];
    return accumulator;
  }, {} as BoardState);
}

function normalizeBoardState(value: unknown): BoardState {
  const nextBoard = cloneEmptyBoard();

  if (!value || typeof value !== "object") {
    return nextBoard;
  }

  for (const stage of KANBAN_STAGES) {
    const maybeLeads = (value as Partial<BoardState>)[stage.id];
    nextBoard[stage.id] = Array.isArray(maybeLeads) ? maybeLeads : [];
  }

  return nextBoard;
}

function normalizeIntegrationsState(value: unknown): StageIntegrationsState {
  const nextState = { ...EMPTY_STAGE_INTEGRATIONS };

  if (!value || typeof value !== "object") {
    return nextState;
  }

  for (const stage of KANBAN_STAGES) {
    const maybeConfig = (value as Partial<StageIntegrationsState>)[stage.id];

    nextState[stage.id] = {
      provider:
        maybeConfig?.provider === "webhook" ||
        maybeConfig?.provider === "make" ||
        maybeConfig?.provider === "google-sheets"
          ? maybeConfig.provider
          : "none",
      enabled: Boolean(maybeConfig?.enabled),
      label: typeof maybeConfig?.label === "string" ? maybeConfig.label : "",
      webhookUrl: typeof maybeConfig?.webhookUrl === "string" ? maybeConfig.webhookUrl : "",
    };
  }

  return nextState;
}

export function getBoardStorageKey(tenantId: string | null | undefined) {
  return `vcd-crm:manual-kanban:v1:${tenantId ?? "local"}`;
}

export function getIntegrationStorageKey(tenantId: string | null | undefined) {
  return `vcd-crm:stage-integrations:v1:${tenantId ?? "local"}`;
}

export function loadBoardFromStorage(storageKey: string): BoardState {
  if (typeof window === "undefined") {
    return EMPTY_BOARD_STATE;
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return cloneEmptyBoard();
  }

  try {
    return normalizeBoardState(JSON.parse(rawValue));
  } catch {
    return cloneEmptyBoard();
  }
}

export function persistBoardToStorage(storageKey: string, board: BoardState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(board));
}

export function loadIntegrationsFromStorage(storageKey: string): StageIntegrationsState {
  if (typeof window === "undefined") {
    return EMPTY_STAGE_INTEGRATIONS;
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return { ...EMPTY_STAGE_INTEGRATIONS };
  }

  try {
    return normalizeIntegrationsState(JSON.parse(rawValue));
  } catch {
    return { ...EMPTY_STAGE_INTEGRATIONS };
  }
}

export function persistIntegrationsToStorage(
  storageKey: string,
  integrations: StageIntegrationsState,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(integrations));
}

// Future API swap point: replace these two functions with fetch/axios calls.
export const leadRepository = {
  loadBoard: loadBoardFromStorage,
  saveBoard: persistBoardToStorage,
  loadIntegrations: loadIntegrationsFromStorage,
  saveIntegrations: persistIntegrationsToStorage,
};
