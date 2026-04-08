"use client";

import { useEffect, useState, type FormEvent } from "react";
import { FileText, LoaderCircle, PlusCircle, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  SERVICE_TYPES,
  type Lead,
  type LeadDraft,
  type ServiceType,
} from "@/components/sales-kanban/types";

type LeadModalProps = {
  open: boolean;
  mode: "create" | "details";
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: LeadDraft) => void;
  onUpdate: (leadId: string, draft: LeadDraft) => void;
};

const EMPTY_DRAFT: LeadDraft = {
  clientName: "",
  company: "",
  whatsapp: "",
  email: "",
  origin: "",
  service: "Google Ads",
  estimatedValue: "",
  notes: "",
};

function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function draftFromLead(lead: Lead | null): LeadDraft {
  if (!lead) {
    return EMPTY_DRAFT;
  }

  return {
    clientName: lead.clientName,
    company: lead.company,
    whatsapp: lead.whatsapp,
    email: lead.email,
    origin: lead.origin,
    service: lead.service,
    estimatedValue: String(lead.estimatedValue || ""),
    notes: lead.notes,
  };
}

export function LeadModal({
  open,
  mode,
  lead,
  onOpenChange,
  onCreate,
  onUpdate,
}: LeadModalProps) {
  const [draft, setDraft] = useState<LeadDraft>(EMPTY_DRAFT);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft(mode === "details" ? draftFromLead(lead) : EMPTY_DRAFT);
    setFeedback(null);
    setIsSaving(false);
  }, [lead, mode, open]);

  function updateDraft<Key extends keyof LeadDraft>(key: Key, value: LeadDraft[Key]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleWhatsappChange(value: string) {
    updateDraft("whatsapp", formatWhatsapp(value));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.clientName.trim()) {
      setFeedback("Informe o nome do cliente.");
      return;
    }

    if (!draft.company.trim()) {
      setFeedback("Informe a empresa.");
      return;
    }

    if (!draft.whatsapp.trim()) {
      setFeedback("Informe o WhatsApp.");
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      if (mode === "details" && lead) {
        onUpdate(lead.id, draft);
      } else {
        onCreate(draft);
      }

      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-black/8 bg-white text-[#111111] shadow-[0_24px_80px_-44px_rgba(0,0,0,0.24)]">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-black/8 bg-[#fafafa] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
            {mode === "details" ? <FileText className="size-3.5" /> : <PlusCircle className="size-3.5" />}
            {mode === "details" ? "Dossiê do lead" : "Novo lead"}
          </div>
          <DialogTitle className="ds-ui-title text-[1rem] text-[#111111]">
            {mode === "details" ? lead?.company ?? "Dossiê" : "Cadastrar oportunidade manual"}
          </DialogTitle>
          <DialogDescription className="text-[0.8125rem] leading-5 text-[#6b7280]">
            {mode === "details"
              ? "Atualize dados comerciais, origem, serviço e notas sem sair do fluxo Kanban."
              : "O lead entra automaticamente na Inbox e fica salvo no LocalStorage desta sessão."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Nome do cliente *
              </span>
              <input
                value={draft.clientName}
                onChange={(event) => updateDraft("clientName", event.target.value)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
                placeholder="Ex.: Mariana Costa"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Empresa *
              </span>
              <input
                value={draft.company}
                onChange={(event) => updateDraft("company", event.target.value)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
                placeholder="Ex.: Clínica Aurora"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                WhatsApp *
              </span>
              <input
                value={draft.whatsapp}
                onChange={(event) => handleWhatsappChange(event.target.value)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
                placeholder="(11) 99999-9999"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                E-mail
              </span>
              <input
                value={draft.email}
                onChange={(event) => updateDraft("email", event.target.value)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
                placeholder="contato@empresa.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Origem / UTM
              </span>
              <input
                value={draft.origin}
                onChange={(event) => updateDraft("origin", event.target.value)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
                placeholder="utm_campaign=google_pesquisa"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Serviço
              </span>
              <select
                value={draft.service}
                onChange={(event) => updateDraft("service", event.target.value as ServiceType)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
              >
                {SERVICE_TYPES.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
                Valor estimado
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.estimatedValue}
                onChange={(event) => updateDraft("estimatedValue", event.target.value)}
                className="rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.8125rem] font-normal text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
                placeholder="3500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#6b7280]">
              Notas do dossiê
            </span>
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              className="min-h-[140px] rounded-[12px] border border-black/8 bg-[#fafafa] px-3.5 py-3 text-[0.8125rem] leading-6 text-black outline-none transition placeholder:text-[#9ca3af] focus:border-black/18 focus:bg-white focus:ring-3 focus:ring-black/5"
              placeholder="Resumo da conversa, objeções, urgência, próximos passos..."
            />
          </label>

          {feedback ? (
            <div className="rounded-[12px] border border-[#f2ddb0] bg-[#fff8e1] px-3.5 py-3 text-[0.8125rem] font-medium text-[#8a6a00]">
              {feedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[10px] border border-black/8 bg-[#fafafa] px-3.5 py-2.5 text-[0.75rem] font-medium text-[#4b5563] transition hover:border-black/16 hover:bg-white hover:text-[#111111]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#111111] px-3.5 py-2.5 text-[0.75rem] font-medium text-white transition hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              {mode === "details" ? "Salvar dossiê" : "Criar lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
