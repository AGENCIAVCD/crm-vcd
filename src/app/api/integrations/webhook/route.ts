import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

const leadSchema = z.object({
  id: z.string(),
  clientName: z.string(),
  company: z.string(),
  whatsapp: z.string(),
  email: z.string(),
  origin: z.string(),
  service: z.string(),
  estimatedValue: z.number(),
  notes: z.string(),
  stageId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  enteredStageAt: z.string(),
});

const integrationWebhookSchema = z.object({
  provider: z.enum(["webhook", "make", "google-sheets"]),
  stageId: z.string(),
  stageTitle: z.string(),
  previousStageId: z.string().nullable().optional(),
  previousStageTitle: z.string().nullable().optional(),
  webhookUrl: z.string().url("Webhook invalido."),
  integrationLabel: z.string().optional(),
  event: z.enum(["lead.created", "lead.stage.entered"]),
  lead: leadSchema,
});

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

    const payload = await request.json();
    const parsedPayload = integrationWebhookSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return NextResponse.json(
        {
          error: "Payload invalido.",
          details: parsedPayload.error.flatten(),
        },
        { status: 400 },
      );
    }

    const integrationResponse = await fetch(parsedPayload.data.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-VCD-CRM-Event": parsedPayload.data.event,
        "X-VCD-CRM-Provider": parsedPayload.data.provider,
      },
      body: JSON.stringify({
        event: parsedPayload.data.event,
        occurredAt: new Date().toISOString(),
        tenantId: authenticatedUser.profile.tenant_id,
        user: {
          id: authenticatedUser.user.id,
          email: authenticatedUser.user.email ?? null,
          fullName: authenticatedUser.profile.full_name,
          role: authenticatedUser.profile.role,
        },
        provider: parsedPayload.data.provider,
        integrationLabel: parsedPayload.data.integrationLabel ?? null,
        stage: {
          id: parsedPayload.data.stageId,
          title: parsedPayload.data.stageTitle,
        },
        previousStage: parsedPayload.data.previousStageId
          ? {
              id: parsedPayload.data.previousStageId,
              title: parsedPayload.data.previousStageTitle ?? null,
            }
          : null,
        lead: parsedPayload.data.lead,
      }),
    });

    if (!integrationResponse.ok) {
      const details = await integrationResponse.text();
      return NextResponse.json(
        {
          success: false,
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
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao disparar o webhook da integracao.",
      },
      { status: 500 },
    );
  }
}
