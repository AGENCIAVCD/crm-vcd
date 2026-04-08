"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CircleDotDashed, Workflow } from "lucide-react";
import { LeadCard } from "@/components/sales-kanban/LeadCard";
import type {
  Lead,
  StageId,
  StageIntegrationConfig,
} from "@/components/sales-kanban/types";
import { cn, formatCurrency } from "@/lib/utils";

type ColumnProps = {
  id: StageId;
  title: string;
  subtitle: string;
  leads: Lead[];
  totalValue: number;
  integration: StageIntegrationConfig;
  onOpenDossier: (leadId: string) => void;
  onOpenIntegration: (stageId: StageId) => void;
};

export function Column({
  id,
  title,
  subtitle,
  leads,
  totalValue,
  integration,
  onOpenDossier,
  onOpenIntegration,
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
        "flex h-full min-h-[calc(100vh-250px)] w-[272px] shrink-0 flex-col rounded-[18px] border border-[#2a2a2a] bg-[#1a1a1a] p-2.5 text-white shadow-[0_16px_40px_-32px_rgba(0,0,0,0.42)] transition",
        isOver && "border-[#ffb500] bg-[#211a0d]",
      )}
    >
      <header className="rounded-[14px] border border-[#2a2a2a] bg-[#151515] p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#ffcf5c]">
              {subtitle}
            </p>
            <h3 className="ds-ui-title mt-1.5 text-[0.875rem] leading-5 text-white">
              {title}
            </h3>
          </div>
          <span className="rounded-full border border-[#2a2a2a] bg-[#1d1d1d] px-2.5 py-1 text-[0.6875rem] font-medium text-white">
            {leads.length}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-[#1d1d1d] px-3 py-2 text-[0.6875rem] text-[#a3a3a3]">
          <span>Pipeline</span>
          <strong className="font-medium text-white">{formatCurrency(totalValue)}</strong>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenIntegration(id)}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#2a2a2a] bg-[#1d1d1d] px-2.5 py-1.5 text-[0.625rem] font-medium uppercase tracking-[0.1em] text-[#d6d6d6] transition hover:border-[#ffb500]/50 hover:text-[#ffcf5c]"
          >
            <Workflow className="size-3" />
            Integrações
          </button>
          {integration.enabled ? (
            <span className="rounded-full border border-[#473810] bg-[#2b2411] px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.08em] text-[#ffcf5c]">
              {integration.provider === "make"
                ? "Make"
                : integration.provider === "google-sheets"
                  ? "Sheets"
                  : "Webhook"}
            </span>
          ) : null}
        </div>
      </header>

      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-2.5 flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onOpenDossier={onOpenDossier} />
          ))}

          {leads.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-[#2a2a2a] bg-[#151515] px-5 py-10 text-center text-[0.75rem] leading-5 text-[#a3a3a3]">
              <CircleDotDashed className="size-5 text-[#ffb500]" />
              <p>Sem leads nesta etapa.</p>
              <p className="text-[0.6875rem] leading-4 text-[#6f6f6f]">Arraste um card ou cadastre um lead na Inbox.</p>
            </div>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}
