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
  healthy: "border-slate-200",
  warning: "border-amber-300 bg-amber-50/70",
  critical: "border-rose-300 bg-rose-50/80",
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
        "group rounded-[22px] border bg-white p-4 shadow-[0_14px_35px_-26px_rgba(15,23,42,0.55)] transition",
        slaToneMap[slaState],
        isDragging && "rotate-1 shadow-[0_22px_45px_-24px_rgba(15,23,42,0.55)] opacity-90",
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
              <p className="text-base font-semibold tracking-tight text-slate-950">
                {lead.name}
              </p>
              <p className="mt-1 text-sm text-muted">{formatCurrency(lead.value)}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">
              SLA
            </span>
          </div>

          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {lead.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-brand" />
                {lead.phone}
              </p>
            ) : null}

            {lead.email ? (
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-accent" />
                {lead.email}
              </p>
            ) : null}

            <p className="flex items-center gap-2">
              <Clock3 className="size-4 text-slate-500" />
              {formatElapsedTime(lead.last_interaction_at)}
            </p>
          </div>
        </button>

        <button
          type="button"
          aria-label={`Arrastar lead ${lead.name}`}
          className="rounded-2xl border border-line bg-slate-50 p-2 text-slate-400 transition hover:border-brand/25 hover:text-brand"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>
    </div>
  );
}
