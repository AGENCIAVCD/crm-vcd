import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";

const leadWebhookSchema = z.object({
  name: z.string().min(2, "Informe o nome do lead."),
  phone: z.string().min(8, "Informe um telefone valido."),
  email: z
    .union([z.string().email(), z.literal(""), z.undefined()])
    .transform((value) => value || null),
  value: z.coerce.number().min(0).optional().default(0),
  notes: z
    .union([z.string(), z.literal(""), z.undefined()])
    .transform((value) => value || null),
  pipelineId: z.string().uuid().optional(),
  tenantKey: z.string().min(3, "tenantKey obrigatorio."),
});

function resolveInboundTenant(tenantKey: string) {
  const expectedTenantKey = process.env.DEFAULT_WEBHOOK_TENANT_KEY;
  const tenantId = process.env.DEFAULT_TENANT_ID;
  const defaultPipelineId = process.env.DEFAULT_PIPELINE_ID;

  if (!expectedTenantKey || !tenantId || !defaultPipelineId) {
    throw new Error(
      "Configure DEFAULT_WEBHOOK_TENANT_KEY, DEFAULT_TENANT_ID e DEFAULT_PIPELINE_ID para ativar o webhook.",
    );
  }

  if (tenantKey !== expectedTenantKey) {
    return null;
  }

  return {
    tenantId,
    defaultPipelineId,
  };
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsedPayload = leadWebhookSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Payload invalido.",
          details: parsedPayload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const tenantConfig = resolveInboundTenant(parsedPayload.data.tenantKey);

    if (!tenantConfig) {
      return NextResponse.json(
        {
          error: "tenantKey invalido.",
        },
        { status: 401 },
      );
    }

    const supabase = createServiceRoleSupabaseClient();
    const pipelineId =
      parsedPayload.data.pipelineId ?? tenantConfig.defaultPipelineId;

    const { data: firstStage, error: firstStageError } = await supabase
      .from("stages")
      .select("id")
      .eq("tenant_id", tenantConfig.tenantId)
      .eq("pipeline_id", pipelineId)
      .order("position")
      .limit(1)
      .maybeSingle();

    if (firstStageError) {
      throw firstStageError;
    }

    if (!firstStage) {
      return NextResponse.json(
        {
          error:
            "Nenhuma etapa inicial encontrada para este tenant. Crie o pipeline e a primeira stage antes de receber leads.",
        },
        { status: 404 },
      );
    }

    const { data: createdLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        tenant_id: tenantConfig.tenantId,
        stage_id: firstStage.id,
        name: parsedPayload.data.name,
        phone: parsedPayload.data.phone,
        email: parsedPayload.data.email,
        value: parsedPayload.data.value,
        notes: parsedPayload.data.notes,
        last_interaction_at: new Date().toISOString(),
      })
      .select(LEAD_SELECT)
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json(
      {
        success: true,
        lead: createdLead,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao processar o webhook do site.",
      },
      { status: 500 },
    );
  }
}

const LEAD_SELECT =
  "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at, notes";
