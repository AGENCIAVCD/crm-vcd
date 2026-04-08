"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock3, FileText, GripVertical, MessageCircle, RadioTower } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { Lead, ServiceType } from "@/components/sales-kanban/types";

type LeadCardProps = {
  lead: Lead;
  onOpenDossier: (leadId: string) => void;
};

const serviceToneMap: Record<ServiceType, string> = {
  "Google Ads": "bg-[#ffb800] text-black border-[#ffb800]",
  SEO: "bg-black text-white border-black",
  "Social Media": "bg-[#fff1bf] text-black border-[#d6b75a]",
  "Landing Page": "bg-[#f3f4f6] text-black border-[#d1d5db]",
  "Tráfego + CRM": "bg-[#1a1a1a] text-[#ffb800] border-[#1a1a1a]",
  Consultoria: "bg-[#f3f4f6] text-black border-[#d1d5db]",
};

function getStageAge(enteredStageAt: string) {
  const diffMs = Date.now() - new Date(enteredStageAt).getTime();
  const totalHours = Math.max(0, Math.floor(diffMs / 3_600_000));

  if (totalHours < 1) {
    return {
      label: "Agora",
      days: 0,
    };
  }

  if (totalHours < 24) {
    return {
      label: `${totalHours}h na etapa`,
      days: 0,
    };
  }

  const days = Math.floor(totalHours / 24);

  return {
    label: `${days}d na etapa`,
    days,
  };
}

function getAlertClass(days: number) {
  if (days >= 5) {
    return "border-l-4 border-l-[#dc2626]";
  }

  if (days >= 3) {
    return "border-l-4 border-l-[#ffb800]";
  }

  return "border-l-4 border-l-black";
}

function toWhatsAppUrl(whatsapp: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
}

export function LeadCard({ lead, onOpenDossier }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "lead",
      leadId: lead.id,
      stageId: lead.stageId,
    },
  });

  const stageAge = getStageAge(lead.enteredStageAt);
  const whatsappUrl = toWhatsAppUrl(lead.whatsapp);

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        "group rounded-[20px] border border-black/10 bg-white p-3.5 shadow-[0_14px_34px_-28px_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_22px_44px_-32px_rgba(0,0,0,0.65)]",
        getAlertClass(stageAge.days),
        isDragging && "rotate-1 opacity-80 shadow-[0_28px_70px_-38px_rgba(0,0,0,0.8)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenDossier(lead.id)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="ds-ui-title line-clamp-2 break-words text-[0.875rem] leading-[1.2] text-[#111111]">
            {lead.company}
          </p>
          <p className="mt-1 line-clamp-1 text-[0.75rem] leading-4 text-[#4b5563]">
            {lead.clientName}
          </p>
        </button>

        <button
          type="button"
          aria-label={`Arrastar ${lead.company}`}
          className="rounded-[12px] border border-black/10 bg-[#f3f4f6] p-2 text-black transition hover:bg-[#ffb800]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
            serviceToneMap[lead.service],
          )}
        >
          {lead.service}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f3f4f6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-black">
          <Clock3 className="size-3" />
          {stageAge.label}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-[0.75rem] leading-4 text-[#4b5563]">
        <p className="flex items-center justify-between gap-3">
          <span className="font-medium text-[#4b5563]">Contrato estimado</span>
          <strong className="text-[0.875rem] font-semibold text-[#111111]">
            {formatCurrency(lead.estimatedValue)}
          </strong>
        </p>
        <p className="flex items-center gap-2">
          <RadioTower className="size-3.5 shrink-0 text-[#111111]" />
          <span className="line-clamp-1 break-all">{lead.origin || "Origem não informada"}</span>
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={whatsappUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!whatsappUrl}
          className={cn(
            "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[12px] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition",
            whatsappUrl
              ? "bg-[#ffb800] text-black hover:bg-[#e5a400]"
              : "pointer-events-none bg-[#f3f4f6] text-[#6b7280]",
          )}
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => onOpenDossier(lead.id)}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[12px] border border-black bg-black px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-white transition hover:bg-[#1a1a1a]"
        >
          <FileText className="size-4" />
          Dossiê
        </button>
      </div>
    </article>
  );
}
