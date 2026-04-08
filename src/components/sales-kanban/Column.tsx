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
        "flex h-full min-h-[calc(100vh-280px)] w-[308px] shrink-0 flex-col rounded-[26px] border border-white/10 bg-[#101010] p-3 text-white shadow-[0_24px_80px_-50px_rgba(0,0,0,0.8)] transition",
        isOver && "border-[#ffb800] bg-[#16120a]",
      )}
    >
      <header className="rounded-[22px] border border-white/10 bg-black p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ffb800]">
              {subtitle}
            </p>
            <h3 className="ds-ui-title mt-2 text-[1rem] leading-5 text-white">
              {title}
            </h3>
          </div>
          <span className="rounded-full bg-[#ffb800] px-3 py-1 text-[0.75rem] font-semibold text-black">
            {leads.length}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[14px] bg-white/[0.08] px-3 py-2 text-[0.75rem] text-white/78">
          <span>Pipeline</span>
          <strong className="font-medium text-white">{formatCurrency(totalValue)}</strong>
        </div>
      </header>

      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpenDossier={onOpenDossier} />
          ))}

          {leads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-white/15 bg-white/[0.03] px-5 py-10 text-center text-[0.8125rem] leading-5 text-white/58">
              <CircleDotDashed className="size-7 text-[#ffb800]" />
              <p>Sem leads nesta etapa.</p>
              <p className="text-[0.75rem] leading-4 text-white/40">Arraste um card ou cadastre um novo lead na Inbox.</p>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
