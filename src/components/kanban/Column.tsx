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
        "flex h-full min-h-[540px] min-w-[310px] max-w-[340px] flex-col rounded-[24px] border border-black/10 bg-[#fcfcfc] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition",
        isOver && "border-black shadow-[0_10px_30px_-20px_rgba(0,0,0,0.35)]",
      )}
    >
      <div className="mb-4 space-y-3 rounded-[20px] border border-black bg-black p-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-[#ffb800] p-2 text-black">
              <CircleDot className="size-4" />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tight text-white">
                {column.name}
              </h3>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                posicao {column.position + 1}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">
            {column.leads.length}
          </span>
        </div>

        <div className="rounded-[16px] bg-white/10 px-3 py-3 text-sm text-white/74">
          Pipeline estimado:{" "}
          <span className="font-black text-white">
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
            <div className="flex flex-1 items-center justify-center rounded-[22px] border-2 border-dashed border-black/15 bg-[#f2f2f2] px-4 py-10 text-center text-sm text-[#575757]">
              Solte um lead aqui para mover para esta etapa.
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
