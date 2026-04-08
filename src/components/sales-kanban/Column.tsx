"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CircleDotDashed } from "lucide-react";
import { LeadCard } from "@/components/sales-kanban/LeadCard";
import type { Lead, StageId } from "@/components/sales-kanban/types";
import { cn, formatCurrency } from "@/lib/utils";

type ColumnProps = {
  id: StageId;
  title: string;
  subtitle: string;
  leads: Lead[];
  totalValue: number;
  onOpenDossier: (leadId: string) => void;
};

export function Column({
  id,
  title,
  subtitle,
  leads,
  totalValue,
  onOpenDossier,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "stage",
      stageId: id,
    },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[calc(100vh-250px)] w-[272px] shrink-0 flex-col rounded-[18px] border border-black/6 bg-white p-2.5 text-[#111111] shadow-[0_8px_30px_-26px_rgba(0,0,0,0.18)] transition",
        isOver && "border-[#ffb800] bg-[#fffdf5]",
      )}
    >
      <header className="rounded-[14px] border border-black/6 bg-[#fafafa] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#8a6a00]">
              {subtitle}
            </p>
            <h3 className="ds-ui-title mt-1.5 text-[0.875rem] leading-5 text-[#111111]">
              {title}
            </h3>
          </div>
          <span className="rounded-full border border-black/6 bg-white px-2.5 py-1 text-[0.6875rem] font-medium text-[#4b5563]">
            {leads.length}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-white px-3 py-2 text-[0.6875rem] text-[#6b7280]">
          <span>Pipeline</span>
          <strong className="font-medium text-[#111111]">{formatCurrency(totalValue)}</strong>
        </div>
      </header>

      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-2.5 flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpenDossier={onOpenDossier} />
          ))}

          {leads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-black/10 bg-[#fafafa] px-5 py-10 text-center text-[0.75rem] leading-5 text-[#6b7280]">
              <CircleDotDashed className="size-5 text-[#8a6a00]" />
              <p>Sem leads nesta etapa.</p>
              <p className="text-[0.6875rem] leading-4 text-[#9ca3af]">Arraste um card ou cadastre um lead na Inbox.</p>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
