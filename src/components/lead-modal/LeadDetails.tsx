"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  BadgeDollarSign,
  Building2,
  LoaderCircle,
  Mail,
  NotebookPen,
  Phone,
  Save,
  TimerReset,
} from "lucide-react";
import { WhatsAppChat } from "@/components/lead-modal/WhatsAppChat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { formatCurrency, formatElapsedTime } from "@/lib/utils";
import type { LeadRow } from "@/types/crm";

type LeadDetailsProps = {
  lead: LeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated?: (lead: LeadRow) => void;
};

type LeadFormState = {
  name: string;
  phone: string;
  email: string;
  value: string;
  notes: string;
};

function toNullable(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildLeadFormState(lead: LeadRow): LeadFormState {
  return {
    name: lead.name ?? "",
    phone: lead.phone ?? "",
    email: lead.email ?? "",
    value: lead.value ? String(lead.value) : "",
    notes: lead.notes ?? "",
  };
}

const leadMetaFields = [
  {
    icon: Building2,
    label: "Lead",
    getValue: (lead: LeadRow) => lead.name,
  },
  {
    icon: BadgeDollarSign,
    label: "Valor previsto",
    getValue: (lead: LeadRow) => formatCurrency(lead.value),
  },
  {
    icon: TimerReset,
    label: "Ultima interacao",
    getValue: (lead: LeadRow) => formatElapsedTime(lead.last_interaction_at),
  },
];

export function LeadDetails({
  lead,
  open,
  onOpenChange,
  onLeadUpdated,
}: LeadDetailsProps) {
  const [form, setForm] = useState<LeadFormState>({
    name: "",
    phone: "",
    email: "",
    value: "",
    notes: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!lead) {
      return;
    }

    setForm(buildLeadFormState(lead));
    setFeedback(null);
  }, [lead]);

  const currentLead = lead;

  if (!currentLead) {
    return null;
  }

  const leadId = currentLead.id;
  const leadTenantId = currentLead.tenant_id;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setFeedback("Supabase nao configurado para salvar alteracoes reais.");
      return;
    }

    if (!form.name.trim()) {
      setFeedback("Informe o nome do lead.");
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      const supabase = createBrowserSupabaseClient();
      const nextLastInteractionAt = new Date().toISOString();
      const { data, error } = await supabase
        .from("leads")
        .update({
          name: form.name.trim(),
          phone: toNullable(form.phone),
          email: toNullable(form.email),
          value: form.value.trim() ? Number(form.value) : 0,
          notes: toNullable(form.notes),
          last_interaction_at: nextLastInteractionAt,
        })
        .eq("id", leadId)
        .eq("tenant_id", leadTenantId)
        .select(
          "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at, notes",
        )
        .single();

      if (error) {
        throw error;
      }

      onLeadUpdated?.(data);
      setForm(buildLeadFormState(data));
      setFeedback("Lead atualizado com sucesso.");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Nao foi possivel salvar o lead.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{currentLead.name}</DialogTitle>
          <DialogDescription>
            Edite os dados operacionais do lead, registre observacoes e use o
            historico do WhatsApp como centro do atendimento.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-4 overflow-y-auto rounded-[24px] border border-black/10 bg-[#f2f2f2] p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {leadMetaFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-[20px] border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-[#575757] uppercase">
                    <field.icon className="size-4 text-black" />
                    {field.label}
                  </div>
                  <p className="mt-2 text-sm font-bold text-black">
                    {field.getValue(currentLead)}
                  </p>
                </div>
              ))}
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="ds-label">Nome</span>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black" />
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                      className="ds-input bg-white py-3 pl-11 pr-4"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="ds-label">Valor previsto</span>
                  <div className="relative">
                    <BadgeDollarSign className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.value}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, value: event.target.value }))
                      }
                      className="ds-input bg-white py-3 pl-11 pr-4"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="ds-label">Telefone</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black" />
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      className="ds-input bg-white py-3 pl-11 pr-4"
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="ds-label">E-mail</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-black" />
                    <input
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="ds-input bg-white py-3 pl-11 pr-4"
                    />
                  </div>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-black">
                  <NotebookPen className="size-4 text-black" />
                  Observacoes comerciais
                </span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Registre contexto, objeções, prioridade, origem do lead e próximos passos..."
                  className="ds-textarea min-h-[180px] bg-white"
                />
              </label>

              {feedback ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedback.includes("sucesso")
                      ? "border border-black/10 bg-[#fff1bf] text-black"
                      : "border border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  {feedback}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-dark inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {isSaving ? "Salvando" : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </section>

          <WhatsAppChat lead={currentLead} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
