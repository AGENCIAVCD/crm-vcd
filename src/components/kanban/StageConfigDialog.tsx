"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link2, LoaderCircle, PlusCircle, Settings2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import type { StageRow } from "@/types/crm";

type StageConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
  pipelineId: string;
  defaultPosition: number;
  stage: StageRow | null;
  onSaved?: (stage: StageRow) => void;
};

const STAGE_SELECT =
  "id, pipeline_id, tenant_id, name, position, description, integration_enabled, integration_label, integration_webhook_url";

type StageFormState = {
  name: string;
  description: string;
  integrationEnabled: boolean;
  integrationLabel: string;
  integrationWebhookUrl: string;
};

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function StageConfigDialog({
  open,
  onOpenChange,
  tenantId,
  pipelineId,
  defaultPosition,
  stage,
  onSaved,
}: StageConfigDialogProps) {
  const isEditing = Boolean(stage);
  const initialState = useMemo<StageFormState>(
    () => ({
      name: stage?.name ?? "",
      description: stage?.description ?? "",
      integrationEnabled: stage?.integration_enabled ?? false,
      integrationLabel: stage?.integration_label ?? "",
      integrationWebhookUrl: stage?.integration_webhook_url ?? "",
    }),
    [stage],
  );
  const [form, setForm] = useState<StageFormState>(initialState);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(initialState);
    setFeedback(null);
  }, [initialState, open]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId) {
      setFeedback("Nao foi possivel identificar o tenant atual.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setFeedback("Supabase nao configurado para salvar etapas reais.");
      return;
    }

    if (!form.name.trim()) {
      setFeedback("Informe o nome da etapa.");
      return;
    }

    if (form.integrationEnabled && form.integrationWebhookUrl.trim()) {
      try {
        const url = new URL(form.integrationWebhookUrl.trim());
        if (!["http:", "https:"].includes(url.protocol)) {
          throw new Error("Use apenas webhooks http ou https.");
        }
      } catch {
        setFeedback("Informe uma URL de webhook valida para a integracao da etapa.");
        return;
      }
    }

    if (form.integrationEnabled && !form.integrationWebhookUrl.trim()) {
      setFeedback("Ative a integracao apenas se a URL do webhook estiver preenchida.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const supabase = createBrowserSupabaseClient();
      const payload = {
        tenant_id: tenantId,
        pipeline_id: pipelineId,
        name: form.name.trim(),
        position: stage?.position ?? defaultPosition,
        description: toNullable(form.description),
        integration_enabled: form.integrationEnabled,
        integration_label: toNullable(form.integrationLabel),
        integration_webhook_url: toNullable(form.integrationWebhookUrl),
      };

      const query = stage
        ? supabase
            .from("stages")
            .update(payload)
            .eq("id", stage.id)
            .eq("tenant_id", tenantId)
        : supabase.from("stages").insert(payload);

      const { data, error } = await query.select(STAGE_SELECT).single();

      if (error) {
        throw error;
      }

      onSaved?.(data);
      onOpenChange(false);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Nao foi possivel salvar a etapa.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Configurar etapa" : "Nova etapa"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite o nome, o contexto operacional e a automacao desta coluna."
              : "Crie uma nova coluna no funil e, se quiser, conecte um webhook para esta etapa."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nome da etapa</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ex.: Qualificacao, Negociacao, Pos-venda..."
                className="w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Resumo operacional da etapa</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Ex.: aqui entram leads que ja responderam o briefing inicial e precisam de diagnostico."
                className="min-h-[120px] w-full rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </label>
          </div>

          <section className="rounded-[24px] border border-line bg-slate-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-brand-soft p-3 text-brand">
                <Link2 className="size-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-950">Integracao por etapa</h3>
                  <p className="text-sm leading-6 text-muted">
                    Quando um lead entrar nesta etapa, o CRM pode disparar um webhook
                    com os dados do lead e da etapa para automacoes externas.
                  </p>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.integrationEnabled}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        integrationEnabled: event.target.checked,
                      }))
                    }
                    className="size-4 rounded border-line text-brand focus:ring-brand"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Ativar webhook ao entrar nesta etapa
                  </span>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Rotulo da integracao</span>
                    <input
                      value={form.integrationLabel}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          integrationLabel: event.target.value,
                        }))
                      }
                      placeholder="Ex.: RD Station, webhook N8N, planilha..."
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">URL do webhook</span>
                    <input
                      value={form.integrationWebhookUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          integrationWebhookUrl: event.target.value,
                        }))
                      }
                      placeholder="https://seu-workflow.com/webhook/vcd-crm"
                      className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          {feedback ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {feedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-dark inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : isEditing ? (
                <Settings2 className="size-4" />
              ) : (
                <PlusCircle className="size-4" />
              )}
              {isSubmitting
                ? "Salvando etapa"
                : isEditing
                  ? "Salvar etapa"
                  : "Criar etapa"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
