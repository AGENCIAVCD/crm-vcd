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
  "Google Ads": "bg-[#2b2411] text-[#ffcf5c] border-[#473810]",
  SEO: "bg-[#202020] text-white border-[#2f2f2f]",
  "Social Media": "bg-[#202020] text-white border-[#2f2f2f]",
  "Landing Page": "bg-[#202020] text-white border-[#2f2f2f]",
  "Tráfego + CRM": "bg-[#2b2411] text-[#ffcf5c] border-[#473810]",
  Consultoria: "bg-[#202020] text-white border-[#2f2f2f]",
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
        "group rounded-[14px] border border-[#2a2a2a] bg-[#171717] p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.38)] transition duration-200 hover:border-[#3a3a3a] hover:shadow-[0_14px_34px_-22px_rgba(0,0,0,0.45)]",
        getAlertClass(stageAge.days),
        isDragging && "rotate-[0.8deg] opacity-85 shadow-[0_16px_40px_-26px_rgba(0,0,0,0.28)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenDossier(lead.id)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="ds-ui-title line-clamp-2 break-words text-[0.8125rem] leading-[1.3] text-white">
            {lead.company}
          </p>
          <p className="mt-0.5 line-clamp-1 text-[0.6875rem] leading-4 text-[#a3a3a3]">
            {lead.clientName}
          </p>
        </button>

        <button
          type="button"
          aria-label={`Arrastar ${lead.company}`}
          className="rounded-[10px] border border-[#2a2a2a] bg-[#1d1d1d] p-1.5 text-[#a3a3a3] transition hover:border-[#3a3a3a] hover:bg-[#252525] hover:text-white"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3" />
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-full border px-2 py-1 text-[9px] font-medium tracking-[0.04em]",
            serviceToneMap[lead.service],
          )}
        >
          {lead.service}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#1f1f1f] px-2 py-1 text-[9px] font-medium tracking-[0.04em] text-[#d6d6d6]">
          <Clock3 className="size-2.5" />
          {stageAge.label}
        </span>
      </div>

      <div className="mt-2.5 grid gap-1.5 text-[0.6875rem] leading-4 text-[#a3a3a3]">
        <p className="flex items-center justify-between gap-3">
          <span className="font-normal">Contrato estimado</span>
          <strong className="text-[0.8125rem] font-medium text-white">
            {formatCurrency(lead.estimatedValue)}
          </strong>
        </p>
        <p className="flex items-center gap-2">
          <RadioTower className="size-3 shrink-0 text-[#ffcf5c]" />
          <span className="line-clamp-1 break-all">{lead.origin || "Origem não informada"}</span>
        </p>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <a
          href={whatsappUrl ?? undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!whatsappUrl}
          className={cn(
            "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[10px] border px-2.5 py-2 text-[10px] font-medium transition",
            whatsappUrl
              ? "border-[#2a2a2a] bg-[#1d1d1d] text-white hover:border-[#ffb500]/50 hover:text-[#ffcf5c]"
              : "pointer-events-none border-[#2a2a2a] bg-[#1d1d1d] text-[#6f6f6f]",
          )}
        >
          <MessageCircle className="size-3.5" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={() => onOpenDossier(lead.id)}
          className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#ffb500] bg-[#ffb500] px-2.5 py-2 text-[10px] font-medium text-black transition hover:bg-[#e2a000]"
        >
          <FileText className="size-3.5" />
          Dossiê
        </button>
      </div>
    </article>
  );
}
