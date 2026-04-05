"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock3, GripVertical, Mail, Phone } from "lucide-react";
import type { LeadRow } from "@/types/crm";
import { cn, formatCurrency, formatElapsedTime, getLeadSlaState } from "@/lib/utils";

type LeadCardProps = {
  lead: LeadRow;
  stageId: string;
  onOpen: (lead: LeadRow) => void;
};

const slaToneMap = {
  healthy: "border-l-4 border-black",
  warning: "border-l-4 border-[#ffb800]",
  critical: "border-l-4 border-[#dc2626]",
};

export function LeadCard({ lead, stageId, onOpen }: LeadCardProps) {
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
      stageId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const slaState = getLeadSlaState(lead.last_interaction_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-[24px] border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition",
        slaToneMap[slaState],
        isDragging && "rotate-1 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.4)] opacity-90",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onOpen(lead)}
          className="flex-1 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-black uppercase tracking-tight text-black">
                {lead.name}
              </p>
              <p className="mt-1 text-sm font-medium text-[#575757]">{formatCurrency(lead.value)}</p>
            </div>
            <span className="rounded-full bg-[#ffb800] px-2.5 py-1 text-[11px] font-black tracking-[0.18em] text-black uppercase">
              SLA
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-[#575757]">
            {lead.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-black" />
                {lead.phone}
              </p>
            ) : null}

            {lead.email ? (
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-black" />
                {lead.email}
              </p>
            ) : null}

            <p className="flex items-center gap-2">
              <Clock3 className="size-4 text-black" />
              {formatElapsedTime(lead.last_interaction_at)}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-label={`Arrastar lead ${lead.name}`}
          className="rounded-[14px] border border-black/10 bg-[#f2f2f2] p-2 text-black transition hover:bg-[#ffb800]"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
    </div>
  );
}
