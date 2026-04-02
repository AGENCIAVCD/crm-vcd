"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CircleDot } from "lucide-react";
import type { BoardColumn, LeadRow } from "@/types/crm";
import { LeadCard } from "@/components/kanban/LeadCard";
import { cn, formatCurrency } from "@/lib/utils";

type ColumnProps = {
  column: BoardColumn;
  onOpenLead: (lead: LeadRow) => void;
};

export function Column({ column, onOpenLead }: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: "stage",
      stageId: column.id,
    },
  });

  const stageValue = column.leads.reduce(
    (sum, lead) => sum + Number(lead.value ?? 0),
    0,
  );

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[540px] min-w-[310px] max-w-[340px] flex-col rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(244,247,251,0.92))] p-4 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.45)] transition",
        isOver && "border-brand/35 shadow-[0_22px_60px_-32px_rgba(15,118,110,0.55)]",
      )}
    >
      <div className="mb-4 space-y-3 rounded-[22px] border border-line/80 bg-white/80 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-brand-soft p-2 text-brand">
              <CircleDot className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold tracking-tight text-slate-950">
                {column.name}
              </h3>
              <p className="text-xs text-muted">posicao {column.position + 1}</p>
            </div>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {column.leads.length}
          </span>
        </div>

        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Pipeline estimado:{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(stageValue)}
          </span>
        </div>
      </div>

      <SortableContext
        items={column.leads.map((lead) => lead.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3 [content-visibility:auto]">
          {column.leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              stageId={column.id}
              onOpen={onOpenLead}
            />
          ))}

          {column.leads.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[22px] border border-dashed border-line bg-white/60 px-4 py-10 text-center text-sm text-muted">
              Solte um lead aqui para mover para esta etapa.
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
