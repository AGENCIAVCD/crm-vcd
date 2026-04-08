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
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#ffb800]/40 bg-[#0b0b0b] text-white">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#ffb800] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-black">
            {mode === "details" ? <FileText className="size-3.5" /> : <PlusCircle className="size-3.5" />}
            {mode === "details" ? "Dossiê do lead" : "Novo lead"}
          </div>
          <DialogTitle className="ds-ui-title text-[1.125rem] text-white">
            {mode === "details" ? lead?.company ?? "Dossiê" : "Cadastrar oportunidade manual"}
          </DialogTitle>
          <DialogDescription className="text-[0.875rem] leading-6 text-white/74">
            {mode === "details"
              ? "Atualize dados comerciais, origem, serviço e notas sem sair do fluxo Kanban."
              : "O lead entra automaticamente na Inbox e fica salvo no LocalStorage desta sessão."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                Nome do cliente *
              </span>
              <input
                value={draft.clientName}
                onChange={(event) => updateDraft("clientName", event.target.value)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
                placeholder="Ex.: Mariana Costa"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                Empresa *
              </span>
              <input
                value={draft.company}
                onChange={(event) => updateDraft("company", event.target.value)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
                placeholder="Ex.: Clínica Aurora"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                WhatsApp *
              </span>
              <input
                value={draft.whatsapp}
                onChange={(event) => handleWhatsappChange(event.target.value)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
                placeholder="(11) 99999-9999"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                E-mail
              </span>
              <input
                value={draft.email}
                onChange={(event) => updateDraft("email", event.target.value)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
                placeholder="contato@empresa.com"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                Origem / UTM
              </span>
              <input
                value={draft.origin}
                onChange={(event) => updateDraft("origin", event.target.value)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
                placeholder="utm_campaign=google_pesquisa"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                Serviço
              </span>
              <select
                value={draft.service}
                onChange={(event) => updateDraft("service", event.target.value as ServiceType)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
              >
                {SERVICE_TYPES.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
                Valor estimado
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.estimatedValue}
                onChange={(event) => updateDraft("estimatedValue", event.target.value)}
                className="rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] font-medium text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
                placeholder="3500"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#ffb800]">
              Notas do dossiê
            </span>
            <textarea
              value={draft.notes}
              onChange={(event) => updateDraft("notes", event.target.value)}
              className="min-h-[160px] rounded-[14px] border border-white/10 bg-white px-4 py-3 text-[0.875rem] leading-6 text-black outline-none transition placeholder:text-[#6b7280] focus:border-[#ffb800] focus:ring-4 focus:ring-[#ffb800]/20"
              placeholder="Resumo da conversa, objeções, urgência, próximos passos..."
            />
          </label>

          {feedback ? (
            <div className="rounded-[16px] border border-[#ffb800] bg-[#ffb800]/10 px-4 py-3 text-[0.875rem] font-medium text-[#ffdd75]">
              {feedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[8px] border-2 border-white px-4 py-3 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-white hover:text-black"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#ffb800] px-4 py-3 text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-black transition hover:bg-[#e5a400] disabled:cursor-not-allowed disabled:opacity-70"
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
