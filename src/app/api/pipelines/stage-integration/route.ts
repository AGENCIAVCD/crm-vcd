import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";

const stageIntegrationSchema = z.object({
  leadId: z.string().uuid("leadId invalido."),
  pipelineId: z.string().uuid("pipelineId invalido."),
  stageId: z.string().uuid("stageId invalido."),
  previousStageId: z.string().uuid("previousStageId invalido.").nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    const payload = await request.json();
    const parsedPayload = stageIntegrationSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Payload invalido.",
          details: parsedPayload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const supabase = createServiceRoleSupabaseClient();
    const tenantId = authenticatedUser.profile.tenant_id;

    const { data: stage, error: stageError } = await supabase
      .from("stages")
      .select(
        "id, pipeline_id, tenant_id, name, position, description, integration_enabled, integration_label, integration_webhook_url",
      )
      .eq("id", parsedPayload.data.stageId)
      .eq("tenant_id", tenantId)
      .eq("pipeline_id", parsedPayload.data.pipelineId)
      .maybeSingle();

    if (stageError) {
      throw stageError;
    }

    if (!stage) {
      return NextResponse.json(
        { error: "Etapa nao encontrada para este tenant." },
        { status: 404 },
      );
    }

    if (!stage.integration_enabled || !stage.integration_webhook_url) {
      return NextResponse.json(
        {
          success: true,
          status: "skipped_no_integration",
        },
        { status: 200 },
      );
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(
        "id, tenant_id, stage_id, name, phone, email, value, assigned_to, last_interaction_at, created_at, notes",
      )
      .eq("id", parsedPayload.data.leadId)
      .eq("tenant_id", tenantId)
      .maybeSingle();

    if (leadError) {
      throw leadError;
    }

    if (!lead) {
      return NextResponse.json(
        { error: "Lead nao encontrado para este tenant." },
        { status: 404 },
      );
    }

    let previousStage:
      | {
          id: string;
          name: string;
          position: number;
        }
      | null = null;

    if (parsedPayload.data.previousStageId) {
      const { data: previousStageData } = await supabase
        .from("stages")
        .select("id, name, position")
        .eq("id", parsedPayload.data.previousStageId)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      previousStage = previousStageData;
    }

    try {
      const integrationResponse = await fetch(stage.integration_webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-VCD-CRM-Event": "lead.stage.entered",
        },
        body: JSON.stringify({
          event: "lead.stage.entered",
          occurredAt: new Date().toISOString(),
          tenantId,
          pipelineId: parsedPayload.data.pipelineId,
          user: {
            id: authenticatedUser.user.id,
            email: authenticatedUser.user.email ?? null,
            fullName: authenticatedUser.profile.full_name,
            role: authenticatedUser.profile.role,
          },
          stage: {
            id: stage.id,
            name: stage.name,
            position: stage.position,
            description: stage.description,
            integrationLabel: stage.integration_label,
          },
          previousStage,
          lead,
        }),
      });

      if (!integrationResponse.ok) {
        const details = await integrationResponse.text();
        return NextResponse.json(
          {
            success: true,
            status: "dispatch_failed",
            error: details || `HTTP ${integrationResponse.status}`,
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          status: "dispatched",
        },
        { status: 200 },
      );
    } catch (integrationError) {
      return NextResponse.json(
        {
          success: true,
          status: "dispatch_failed",
          error:
            integrationError instanceof Error
              ? integrationError.message
              : "Falha ao chamar o webhook da etapa.",
        },
        { status: 200 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao disparar a integracao da etapa.",
      },
      { status: 500 },
    );
  }
}
