"use client";

export const KANBAN_STAGES = [
  {
    id: "inbox",
    title: "Inbox",
    subtitle: "Entrada/MQL",
  },
  {
    id: "qualification",
    title: "Qualificação",
    subtitle: "SQL",
  },
  {
    id: "diagnosis",
    title: "Reunião",
    subtitle: "Diagnóstico",
  },
  {
    id: "proposal",
    title: "Proposta",
    subtitle: "Enviada",
  },
  {
    id: "follow-up",
    title: "Follow-up",
    subtitle: "Ativo",
  },
  {
    id: "negotiation",
    title: "Negociação",
    subtitle: "Ajustes finais",
  },
  {
    id: "closed",
    title: "Fechado",
    subtitle: "Ganhou/Perdeu",
  },
] as const;

export const SERVICE_TYPES = [
  "Google Ads",
  "SEO",
  "Social Media",
  "Landing Page",
  "Tráfego + CRM",
  "Consultoria",
] as const;

export type StageId = (typeof KANBAN_STAGES)[number]["id"];
export type ServiceType = (typeof SERVICE_TYPES)[number];

export type Lead = {
  id: string;
  clientName: string;
  company: string;
  whatsapp: string;
  email: string;
  origin: string;
  service: ServiceType;
  estimatedValue: number;
  notes: string;
  stageId: StageId;
  createdAt: string;
  updatedAt: string;
  enteredStageAt: string;
};

export type LeadDraft = {
  clientName: string;
  company: string;
  whatsapp: string;
  email: string;
  origin: string;
  service: ServiceType;
  estimatedValue: string;
  notes: string;
};

export type BoardState = Record<StageId, Lead[]>;

export const EMPTY_BOARD_STATE = KANBAN_STAGES.reduce((accumulator, stage) => {
  accumulator[stage.id] = [];
  return accumulator;
}, {} as BoardState);
