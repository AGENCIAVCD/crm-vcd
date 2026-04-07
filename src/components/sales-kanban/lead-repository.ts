"use client";

import { EMPTY_BOARD_STATE, KANBAN_STAGES, type BoardState } from "@/components/sales-kanban/types";

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

export function getBoardStorageKey(tenantId: string | null | undefined) {
  return `vcd-crm:manual-kanban:v1:${tenantId ?? "local"}`;
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

// Future API swap point: replace these two functions with fetch/axios calls.
export const leadRepository = {
  loadBoard: loadBoardFromStorage,
  saveBoard: persistBoardToStorage,
};
