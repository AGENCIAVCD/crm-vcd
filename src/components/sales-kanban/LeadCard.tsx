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
  "Social Media": "bg-[#fff1bf] text-black border-black/20",
  "Landing Page": "bg-white text-black border-black",
  "Tráfego + CRM": "bg-[#1a1a1a] text-[#ffb800] border-[#1a1a1a]",
  Consultoria: "bg-[#f2f2f2] text-black border-black/20",
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
        "group rounded-[22px] border border-black/10 bg-white p-4 shadow-[0_14px_34px_-28px_rgba(0,0,0,0.55)] transition duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_22px_44px_-32px_rgba(0,0,0,0.65)]",
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
          <p className="line-clamp-1 text-sm font-black uppercase tracking-tight text-black">
            {lead.company}
          </p>
          <p className="mt-1 line-clamp-1 text-xs font-semibold text-[#575757]">
            {lead.clientName}
          </p>
        </button>

        <button
          type="button"
          aria-label={`Arrastar ${lead.company}`}
          className="rounded-[12px] border border-black/10 bg-[#f2f2f2] p-2 text-black transition hover:bg-[#ffb800]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]",
            serviceToneMap[lead.service],
          )}
        >
          {lead.service}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-black">
          <Clock3 className="size-3" />
          {stageAge.label}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-xs font-semibold text-[#575757]">
        <p className="flex items-center justify-between gap-3">
          <span>Contrato estimado</span>
          <strong className="text-sm font-black text-black">
            {formatCurrency(lead.estimatedValue)}
          </strong>
        </p>
        <p className="flex items-center gap-2">
          <RadioTower className="size-3.5 text-black" />
          <span className="line-clamp-1">{lead.origin || "Origem não informada"}</span>
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <a
          href={whatsappUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!whatsappUrl}
          className={cn(
            "inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] px-3 py-2 text-xs font-black uppercase tracking-[0.08em] transition",
            whatsappUrl
              ? "bg-[#ffb800] text-black hover:bg-[#e5a400]"
              : "pointer-events-none bg-[#f2f2f2] text-[#575757]",
          )}
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => onOpenDossier(lead.id)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-[12px] border border-black bg-black px-3 py-2 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-[#1a1a1a]"
        >
          <FileText className="size-4" />
          Dossiê
        </button>
      </div>
    </article>
  );
}
