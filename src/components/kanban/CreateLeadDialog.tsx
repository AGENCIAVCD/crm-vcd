"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import type { LeadRow, StageRow } from "@/types/crm";

type CreateLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string | null;
  stages: StageRow[];
  defaultStageId?: string | null;
  onCreated?: (lead: LeadRow) => void;
};

const LEAD_SELECT =
  "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at, notes";

type LeadFormState = {
  name: string;
  phone: string;
  email: string;
  value: string;
  notes: string;
  stageId: string;
};

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function CreateLeadDialog({
  open,
  onOpenChange,
  tenantId,
  stages,
  defaultStageId,
  onCreated,
}: CreateLeadDialogProps) {
  const firstStageId = stages[0]?.id ?? "";
  const resolvedDefaultStageId = useMemo(
    () => defaultStageId ?? firstStageId,
    [defaultStageId, firstStageId],
  );
  const [form, setForm] = useState<LeadFormState>({
    name: "",
    phone: "",
    email: "",
    value: "",
    notes: "",
    stageId: resolvedDefaultStageId,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm({
      name: "",
      phone: "",
      email: "",
      value: "",
      notes: "",
      stageId: resolvedDefaultStageId,
    });
    setFeedback(null);
  }, [open, resolvedDefaultStageId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tenantId) {
      setFeedback("Nao foi possivel identificar o tenant atual.");
      return;
    }

    if (!isSupabaseConfigured()) {
      setFeedback("Supabase nao configurado para salvar leads reais.");
      return;
    }

    if (!form.name.trim()) {
      setFeedback("Informe o nome do lead.");
      return;
    }

    if (!form.stageId) {
      setFeedback("Crie ao menos uma etapa antes de cadastrar leads.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedback(null);

      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("leads")
        .insert({
          tenant_id: tenantId,
          stage_id: form.stageId,
          name: form.name.trim(),
          phone: toNullable(form.phone),
          email: toNullable(form.email),
          value: form.value.trim() ? Number(form.value) : 0,
          notes: toNullable(form.notes),
          last_interaction_at: new Date().toISOString(),
        })
        .select(LEAD_SELECT)
        .single();

      if (error) {
        throw error;
      }

      onCreated?.(data);
      onOpenChange(false);
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Nao foi possivel criar o lead.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>
            Cadastre manualmente um lead no pipeline e ja entre com contexto,
            valor e observacoes para o comercial agir.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="ds-label">Nome do lead</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Ex.: Clinica Aurora"
                className="ds-input"
              />
            </label>

            <label className="space-y-2">
              <span className="ds-label">Etapa inicial</span>
              <select
                value={form.stageId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, stageId: event.target.value }))
                }
                className="ds-select"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="ds-label">Telefone</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+55 11 99999-9999"
                className="ds-input"
              />
            </label>

            <label className="space-y-2">
              <span className="ds-label">E-mail</span>
              <input
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="comercial@cliente.com"
                className="ds-input"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="ds-label">Valor estimado</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(event) =>
                  setForm((current) => ({ ...current, value: event.target.value }))
                }
                placeholder="0,00"
                className="ds-input"
              />
            </label>
          </div>

          <label className="block space-y-2">
            <span className="ds-label">Observacoes</span>
            <textarea
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({ ...current, notes: event.target.value }))
              }
              placeholder="Contexto do atendimento, origem do lead, objeções iniciais, urgencia..."
              className="ds-textarea min-h-[140px]"
            />
          </label>

          {feedback ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {feedback}
            </div>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-outline-dark rounded-[8px] px-4 py-3 text-sm font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-dark inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
              {isSubmitting ? "Salvando lead" : "Criar lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
