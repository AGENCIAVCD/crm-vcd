"use client";

import { useState, type FormEvent } from "react";
import { Globe, Link2, LoaderCircle, Save, Workflow } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  IntegrationProvider,
  StageId,
  StageIntegrationConfig,
} from "@/components/sales-kanban/types";

type StageIntegrationModalProps = {
  open: boolean;
  stageId: StageId;
  stageTitle: string;
  value: StageIntegrationConfig;
  onOpenChange: (open: boolean) => void;
  onSave: (config: StageIntegrationConfig) => void;
};

const PROVIDER_OPTIONS: Array<{
  value: IntegrationProvider;
  label: string;
  helper: string;
}> = [
  {
    value: "none",
    label: "Sem integração",
    helper: "Mantém a etapa local, sem disparos externos.",
  },
  {
    value: "webhook",
    label: "Webhook custom",
    helper: "Dispare para qualquer endpoint HTTP próprio.",
  },
  {
    value: "make",
    label: "Make",
    helper: "Cole a URL do webhook instantâneo do Make.",
  },
  {
    value: "google-sheets",
    label: "Google Sheets",
    helper: "Use uma URL de Apps Script ou gateway da sua planilha.",
  },
];

export function StageIntegrationModal({
  open,
  stageId,
  stageTitle,
  value,
  onOpenChange,
  onSave,
}: StageIntegrationModalProps) {
  const [provider, setProvider] = useState<IntegrationProvider>(value.provider);
  const [label, setLabel] = useState(value.label);
  const [webhookUrl, setWebhookUrl] = useState(value.webhookUrl);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (provider !== "none" && !webhookUrl.trim()) {
      setFeedback("Informe a URL do webhook para ativar a integração.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    onSave({
      provider,
      enabled: provider !== "none" && Boolean(webhookUrl.trim()),
      label: label.trim(),
      webhookUrl: webhookUrl.trim(),
    });

    onOpenChange(false);
    setIsSaving(false);
  }

  const selectedProvider = PROVIDER_OPTIONS.find((option) => option.value === provider);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto border-[#2a2a2a] bg-[#171717] text-white shadow-[0_28px_80px_-40px_rgba(0,0,0,0.55)]">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-[#ffcf5c]">
            <Workflow className="size-3.5" />
            Integração da etapa
          </div>
          <DialogTitle className="ds-ui-title text-[1rem] text-white">
            {stageTitle}
          </DialogTitle>
          <DialogDescription className="text-[0.8125rem] leading-5 text-[#a3a3a3]">
            Configure Make, Google Sheets ou um webhook próprio. O disparo acontece quando o lead entra nesta etapa.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#ffcf5c]">
              Tipo de integração
            </span>
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as IntegrationProvider)}
              className="rounded-[12px] border border-[#2a2a2a] bg-[#1d1d1d] px-3.5 py-2.5 text-[0.8125rem] font-normal text-white outline-none transition focus:border-[#ffb500]/60 focus:bg-[#222222] focus:ring-3 focus:ring-[#ffb500]/10"
            >
              {PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-[0.75rem] leading-5 text-[#8c8c8c]">
              {selectedProvider?.helper}
            </p>
          </label>

          <label className="block space-y-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#ffcf5c]">
              Rótulo interno
            </span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={stageId === "inbox" ? "Ex.: Make entrada" : "Ex.: Webhook proposta"}
                className="w-full rounded-[12px] border border-[#2a2a2a] bg-[#1d1d1d] px-10 py-2.5 text-[0.8125rem] font-normal text-white outline-none transition placeholder:text-[#8c8c8c] focus:border-[#ffb500]/60 focus:bg-[#222222] focus:ring-3 focus:ring-[#ffb500]/10"
              />
            </div>
          </label>

          <label className="block space-y-2">
            <span className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#ffcf5c]">
              URL do webhook
            </span>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#8c8c8c]" />
              <input
                value={webhookUrl}
                onChange={(event) => setWebhookUrl(event.target.value)}
                placeholder="https://hook.us1.make.com/... ou Apps Script"
                className="w-full rounded-[12px] border border-[#2a2a2a] bg-[#1d1d1d] px-10 py-2.5 text-[0.8125rem] font-normal text-white outline-none transition placeholder:text-[#8c8c8c] focus:border-[#ffb500]/60 focus:bg-[#222222] focus:ring-3 focus:ring-[#ffb500]/10"
              />
            </div>
          </label>

          <div className="rounded-[12px] border border-[#2a2a2a] bg-[#151515] px-3.5 py-3 text-[0.75rem] leading-5 text-[#a3a3a3]">
            Payload enviado: lead, etapa atual, etapa anterior, usuário e tenant. Isso já cobre Make, planilhas via Apps Script e qualquer endpoint próprio.
          </div>

          {feedback ? (
            <div className="rounded-[12px] border border-[#473810] bg-[#2b2411] px-3.5 py-3 text-[0.8125rem] font-medium text-[#ffcf5c]">
              {feedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-[10px] border border-[#2a2a2a] bg-[#1d1d1d] px-3.5 py-2.5 text-[0.75rem] font-medium text-white transition hover:border-[#ffb500]/50 hover:bg-[#252525] hover:text-[#ffcf5c]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#ffb500] px-3.5 py-2.5 text-[0.75rem] font-medium text-black transition hover:bg-[#e2a000] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : <Save className="size-4" />}
              Salvar integração
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
