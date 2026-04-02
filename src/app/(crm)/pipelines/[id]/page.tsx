import { Board } from "@/components/kanban/Board";
import { DEMO_PIPELINE_ID, DEMO_TENANT_ID, getDemoBoardColumns } from "@/lib/demo-data";

type PipelinePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PipelinePage({ params }: PipelinePageProps) {
  const { id } = await params;
  const pipelineId = id || DEMO_PIPELINE_ID;
  const tenantId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? DEMO_TENANT_ID;

  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
          Pipeline ativo
        </p>
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
              Funil comercial principal
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Drag and drop com atualizacao otimista, sincronizacao em tempo real
              e fallback demo para acelerar o desenvolvimento.
            </p>
          </div>
          <p className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-slate-600">
            pipeline_id: {pipelineId}
          </p>
        </div>
      </div>

      <Board
        pipelineId={pipelineId}
        tenantId={tenantId}
        initialColumns={getDemoBoardColumns(pipelineId)}
      />
    </section>
  );
}
