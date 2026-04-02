"use client";

import { BadgeDollarSign, Building2, Mail, Phone, TimerReset } from "lucide-react";
import { WhatsAppChat } from "@/components/lead-modal/WhatsAppChat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency, formatElapsedTime } from "@/lib/utils";
import type { LeadRow } from "@/types/crm";

type LeadDetailsProps = {
  lead: LeadRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const fieldLabels = [
  {
    icon: Building2,
    label: "Lead",
    getValue: (lead: LeadRow) => lead.name,
  },
  {
    icon: Phone,
    label: "Telefone",
    getValue: (lead: LeadRow) => lead.phone ?? "Nao informado",
  },
  {
    icon: Mail,
    label: "E-mail",
    getValue: (lead: LeadRow) => lead.email ?? "Nao informado",
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
}: LeadDetailsProps) {
  if (!lead) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{lead.name}</DialogTitle>
          <DialogDescription>
            Modal inicial do lead pronto para evoluir com campos customizados,
            ownership e historico completo do WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <section className="space-y-4 rounded-[24px] border border-line bg-slate-50/70 p-4">
            {fieldLabels.map((field) => (
              <div
                key={field.label}
                className="rounded-[20px] border border-white bg-white p-4 shadow-[0_12px_30px_-30px_rgba(15,23,42,0.7)]"
              >
                <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-muted uppercase">
                  <field.icon className="size-4 text-brand" />
                  {field.label}
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {field.getValue(lead)}
                </p>
              </div>
            ))}
          </section>

          <WhatsAppChat lead={lead} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
