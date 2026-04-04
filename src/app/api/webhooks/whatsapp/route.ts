import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase-server";

const whatsappPayloadSchema = z.object({
  leadId: z.string().uuid("leadId invalido."),
  content: z.string().min(1, "Mensagem obrigatoria.").max(2000),
});

const MESSAGE_SELECT = "id, tenant_id, lead_id, direction, content, created_at";

function normalizeWhatsappPhone(phone: string | null | undefined) {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");

  if (digits.length < 10) {
    return null;
  }

  return digits.startsWith("00") ? digits.slice(2) : digits;
}

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedAppUser();

    if (!authenticatedUser) {
      return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
    }

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

    const tenantId = authenticatedUser.profile.tenant_id;
    const supabase = createServiceRoleSupabaseClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, tenant_id, phone")
      .eq("id", parsedPayload.data.leadId)
      .eq("tenant_id", tenantId)
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

    await supabase
      .from("leads")
      .update({
        last_interaction_at: new Date().toISOString(),
      })
      .eq("id", lead.id)
      .eq("tenant_id", tenantId);

    const metaToken = process.env.META_WHATSAPP_TOKEN;
    const metaPhoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const metaGraphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v23.0";

    if (!metaToken || !metaPhoneNumberId) {
      return NextResponse.json(
        {
          success: true,
          message: createdMessage,
          metaDispatched: false,
          metaStatus: "skipped_no_meta_credentials",
        },
        { status: 201 },
      );
    }

    const normalizedPhone = normalizeWhatsappPhone(lead.phone);

    if (!normalizedPhone) {
      return NextResponse.json(
        {
          success: true,
          message: createdMessage,
          metaDispatched: false,
          metaStatus: "missing_lead_phone",
        },
        { status: 201 },
      );
    }

    try {
      const metaResponse = await fetch(
        `https://graph.facebook.com/${metaGraphApiVersion}/${metaPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${metaToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: normalizedPhone,
            type: "text",
            text: {
              body: parsedPayload.data.content,
            },
          }),
        },
      );

      if (!metaResponse.ok) {
        const metaErrorPayload = (await metaResponse.json().catch(() => null)) as
          | {
              error?: {
                message?: string;
              };
            }
          | null;

        return NextResponse.json(
          {
            success: true,
            message: createdMessage,
            metaDispatched: false,
            metaStatus: "dispatch_failed",
            metaError:
              metaErrorPayload?.error?.message ??
              `Meta retornou HTTP ${metaResponse.status}.`,
          },
          { status: 201 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: createdMessage,
          metaDispatched: true,
          metaStatus: "sent",
        },
        { status: 201 },
      );
    } catch (metaDispatchError) {
      return NextResponse.json(
        {
          success: true,
          message: createdMessage,
          metaDispatched: false,
          metaStatus: "dispatch_failed",
          metaError:
            metaDispatchError instanceof Error
              ? metaDispatchError.message
              : "Falha ao conectar com a Meta Cloud API.",
        },
        { status: 201 },
      );
    }
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
