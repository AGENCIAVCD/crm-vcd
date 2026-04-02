import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";

const whatsappPayloadSchema = z.object({
  leadId: z.string().uuid("leadId invalido."),
  content: z.string().min(1, "Mensagem obrigatoria.").max(2000),
});

const MESSAGE_SELECT =
  "id, tenant_id, lead_id, direction, content, created_at";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsedPayload = whatsappPayloadSchema.safeParse(payload);

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
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, tenant_id, phone")
      .eq("id", parsedPayload.data.leadId)
      .single();

    if (leadError) {
      throw leadError;
    }

    const { data: createdMessage, error: insertError } = await supabase
      .from("messages")
      .insert({
        tenant_id: lead.tenant_id,
        lead_id: lead.id,
        direction: "outbound",
        content: parsedPayload.data.content,
      })
      .select(MESSAGE_SELECT)
      .single();

    if (insertError) {
      throw insertError;
    }

    const metaReady = Boolean(
      process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_NUMBER_ID,
    );

    return NextResponse.json(
      {
        success: true,
        message: createdMessage,
        metaDispatched: metaReady,
        metaStatus: metaReady ? "pending_integration" : "skipped_no_meta_credentials",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha inesperada ao processar a mensagem do WhatsApp.",
      },
      { status: 500 },
    );
  }
}
