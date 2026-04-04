import type { BoardColumn, MessageWithLead } from "@/types/crm";

export const DEMO_TENANT_ID = "30000000-0000-4000-8000-000000000001";
export const DEMO_PIPELINE_ID = "20000000-0000-4000-8000-000000000001";

const STAGE_IDS = {
  capture: "10000000-0000-4000-8000-000000000001",
  diagnosis: "10000000-0000-4000-8000-000000000002",
  proposal: "10000000-0000-4000-8000-000000000003",
  closing: "10000000-0000-4000-8000-000000000004",
} as const;

const LEAD_IDS = {
  rafah: "40000000-0000-4000-8000-000000000001",
  orto: "40000000-0000-4000-8000-000000000002",
  solar: "40000000-0000-4000-8000-000000000003",
  premium: "40000000-0000-4000-8000-000000000004",
  escola: "40000000-0000-4000-8000-000000000005",
} as const;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

export function getDemoBoardColumns(
  pipelineId: string = DEMO_PIPELINE_ID,
): BoardColumn[] {
  return [
    {
      id: STAGE_IDS.capture,
      pipeline_id: pipelineId,
      tenant_id: DEMO_TENANT_ID,
      name: "Entrada",
      position: 0,
      description: "Primeiro contato e triagem comercial.",
      integration_enabled: false,
      integration_label: null,
      integration_webhook_url: null,
      leads: [
        {
          id: LEAD_IDS.rafah,
          tenant_id: DEMO_TENANT_ID,
          stage_id: STAGE_IDS.capture,
          name: "Rafah Clinica Estetica",
          phone: "+55 11 99876-2201",
          email: "contato@rafah.com.br",
          value: 2800,
          assigned_to: null,
          last_interaction_at: hoursAgo(8),
          created_at: hoursAgo(30),
          notes: "Lead entrou por indicacao e quer entender CRM + WhatsApp para a recepcao.",
        },
        {
          id: LEAD_IDS.orto,
          tenant_id: DEMO_TENANT_ID,
          stage_id: STAGE_IDS.capture,
          name: "Orto Prime",
          phone: "+55 11 99111-0021",
          email: "leads@ortoprime.com",
          value: 1950,
          assigned_to: null,
          last_interaction_at: hoursAgo(27),
          created_at: hoursAgo(35),
          notes: "Precisa de organizacao do pipeline antes de investir em automacao.",
        },
      ],
    },
    {
      id: STAGE_IDS.diagnosis,
      pipeline_id: pipelineId,
      tenant_id: DEMO_TENANT_ID,
      name: "Diagnostico",
      position: 1,
      description: "Leads que responderam briefing inicial.",
      integration_enabled: false,
      integration_label: null,
      integration_webhook_url: null,
      leads: [
        {
          id: LEAD_IDS.solar,
          tenant_id: DEMO_TENANT_ID,
          stage_id: STAGE_IDS.diagnosis,
          name: "Solar Engenharia",
          phone: "+55 21 99600-4500",
          email: "comercial@solarengenharia.com",
          value: 4200,
          assigned_to: null,
          last_interaction_at: hoursAgo(18),
          created_at: hoursAgo(50),
          notes: "Ja mandou as dores da operacao comercial e quer proposta consultiva.",
        },
      ],
    },
    {
      id: STAGE_IDS.proposal,
      pipeline_id: pipelineId,
      tenant_id: DEMO_TENANT_ID,
      name: "Proposta",
      position: 2,
      description: "Etapa de proposta comercial ativa.",
      integration_enabled: true,
      integration_label: "Webhook N8N",
      integration_webhook_url: "https://example.com/hooks/proposta",
      leads: [
        {
          id: LEAD_IDS.premium,
          tenant_id: DEMO_TENANT_ID,
          stage_id: STAGE_IDS.proposal,
          name: "Premium Odonto",
          phone: "+55 31 99224-1108",
          email: "diretoria@premiumodonto.com.br",
          value: 6500,
          assigned_to: null,
          last_interaction_at: hoursAgo(51),
          created_at: hoursAgo(75),
          notes: "Objeção principal em prazo de onboarding e treinamento da equipe.",
        },
      ],
    },
    {
      id: STAGE_IDS.closing,
      pipeline_id: pipelineId,
      tenant_id: DEMO_TENANT_ID,
      name: "Fechamento",
      position: 3,
      description: "Negociacao final e fechamento.",
      integration_enabled: false,
      integration_label: null,
      integration_webhook_url: null,
      leads: [
        {
          id: LEAD_IDS.escola,
          tenant_id: DEMO_TENANT_ID,
          stage_id: STAGE_IDS.closing,
          name: "Escola Conecta",
          phone: "+55 41 98880-0012",
          email: "mkt@escolaconecta.com",
          value: 8300,
          assigned_to: null,
          last_interaction_at: hoursAgo(12),
          created_at: hoursAgo(84),
          notes: "Aguardando aprovacao final da diretoria e assinatura do contrato.",
        },
      ],
    },
  ].map((column) => ({
    ...column,
    leads: column.leads.map((lead) => ({
      ...lead,
    })),
  }));
}

const demoMessages: Record<string, MessageWithLead[]> = {
  [LEAD_IDS.rafah]: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      tenant_id: DEMO_TENANT_ID,
      lead_id: LEAD_IDS.rafah,
      direction: "inbound",
      content: "Oi, quero entender como funciona a gestao de leads para clinica.",
      created_at: hoursAgo(6),
    },
    {
      id: "50000000-0000-4000-8000-000000000002",
      tenant_id: DEMO_TENANT_ID,
      lead_id: LEAD_IDS.rafah,
      direction: "outbound",
      content: "Perfeito. Posso te mostrar um plano focado em captacao e WhatsApp.",
      created_at: hoursAgo(5),
    },
  ],
  [LEAD_IDS.premium]: [
    {
      id: "50000000-0000-4000-8000-000000000003",
      tenant_id: DEMO_TENANT_ID,
      lead_id: LEAD_IDS.premium,
      direction: "outbound",
      content: "Enviei a proposta completa com CRM e automacoes de follow-up.",
      created_at: hoursAgo(44),
    },
    {
      id: "50000000-0000-4000-8000-000000000004",
      tenant_id: DEMO_TENANT_ID,
      lead_id: LEAD_IDS.premium,
      direction: "inbound",
      content: "Recebi. Vou alinhar com a equipe ainda hoje.",
      created_at: hoursAgo(43),
    },
  ],
};

export function getDemoMessages(leadId: string) {
  return (demoMessages[leadId] ?? []).map((message) => ({
    ...message,
  }));
}
