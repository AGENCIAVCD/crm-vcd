"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";
import { MessageCircleMore, SendHorizonal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getDemoMessages } from "@/lib/demo-data";
import { createBrowserSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";
import { cn } from "@/lib/utils";
import type { LeadRow, MessageWithLead } from "@/types/crm";

type WhatsAppChatProps = {
  lead: LeadRow;
};

function formatMessageTime(timestamp: string | null) {
  if (!timestamp) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function WhatsAppChat({ lead }: WhatsAppChatProps) {
  const [messages, setMessages] = useState<MessageWithLead[]>([]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function syncMessages() {
    if (!isSupabaseConfigured()) {
      setMessages(getDemoMessages(lead.id));
      return;
    }

    try {
      setIsLoading(true);
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("messages")
        .select("id, tenant_id, lead_id, direction, content, created_at")
        .eq("lead_id", lead.id)
        .order("created_at");

      if (error) {
        throw error;
      }

      startTransition(() => {
        setMessages(data);
      });
    } catch (error) {
      console.error("Falha ao carregar conversa do WhatsApp:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const loadMessagesEffect = useEffectEvent(async () => {
    await syncMessages();
  });

  useEffect(() => {
    void loadMessagesEffect();
  }, [lead.id]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`lead:${lead.id}:messages`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `lead_id=eq.${lead.id}`,
        },
        () => {
          void loadMessagesEffect();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [lead.id]);

  async function handleSendMessage() {
    const content = draft.trim();

    if (!content) {
      return;
    }

    if (!isSupabaseConfigured()) {
      const demoMessage: MessageWithLead = {
        id: crypto.randomUUID(),
        tenant_id: lead.tenant_id,
        lead_id: lead.id,
        direction: "outbound",
        content,
        created_at: new Date().toISOString(),
      };

      setDraft("");
      setFeedback("Mensagem salva apenas no modo demo. Configure o Supabase para envio real.");
      setMessages((currentMessages) => [...currentMessages, demoMessage]);
      return;
    }

    try {
      setIsSending(true);
      setFeedback(null);

      const response = await fetch("/api/webhooks/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: lead.id,
          content,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        metaStatus?: string;
        metaError?: string | null;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Nao foi possivel enviar a mensagem.");
      }

      setDraft("");
      if (payload.metaStatus === "sent") {
        setFeedback("Mensagem enviada para o WhatsApp oficial do lead.");
      } else if (payload.metaStatus === "skipped_no_meta_credentials") {
        setFeedback("Mensagem salva no historico. Ative as credenciais da Meta para envio real.");
      } else if (payload.metaStatus === "missing_lead_phone") {
        setFeedback("Mensagem salva no historico, mas o lead ainda nao tem telefone para WhatsApp.");
      } else if (payload.metaStatus === "dispatch_failed") {
        setFeedback(
          payload.metaError
            ? `Mensagem salva no CRM, mas a Meta recusou o envio: ${payload.metaError}`
            : "Mensagem salva no CRM, mas a Meta nao aceitou o envio.",
        );
      } else {
        setFeedback("Mensagem salva no historico do lead.");
      }
      void syncMessages();
    } catch (error) {
      console.error("Falha ao enviar mensagem:", error);
      setFeedback(
        error instanceof Error ? error.message : "Falha ao enviar mensagem para o lead.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-black/10 bg-white">
      <header className="border-b border-black bg-black px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-[18px] bg-[#ffb800] p-3 text-black">
            <MessageCircleMore className="size-5" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase text-white">WhatsApp do lead</h3>
            <p className="text-sm text-white/70">
              Historico persistido por `lead_id`. Com Meta configurada, esta caixa passa a disparar o WhatsApp oficial.
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[420px] bg-[linear-gradient(180deg,_#fcfcfc,_#f2f2f2)] px-4 py-5">
        <div className="space-y-3">
          {messages.map((message) => {
            const outbound = message.direction === "outbound";

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  outbound ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-[22px] px-4 py-3 text-sm shadow-[0_16px_35px_-28px_rgba(15,23,42,0.65)]",
                    outbound
                      ? "rounded-br-md bg-black text-white"
                      : "rounded-bl-md border border-black/10 bg-white text-black",
                  )}
                >
                  <p className="leading-6">{message.content}</p>
                  <p
                    className={cn(
                      "mt-2 text-[11px]",
                      outbound ? "text-white/75" : "text-[#575757]",
                    )}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && !isLoading ? (
            <div className="rounded-[20px] border-2 border-dashed border-black/15 bg-white px-4 py-8 text-center text-sm text-[#575757]">
              Nenhuma mensagem ainda. Envie a primeira interacao para abrir o
              historico deste lead.
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t border-black/10 bg-white p-4">
        {feedback ? (
          <div className="mb-3 rounded-[18px] border border-black/10 bg-[#f2f2f2] px-4 py-3 text-sm text-[#575757]">
            {feedback}
          </div>
        ) : null}
        <div className="flex gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escreva uma mensagem para o lead..."
            className="ds-textarea min-h-[96px] flex-1 resize-none"
          />
          <button
            type="button"
            disabled={isSending || draft.trim().length === 0}
            onClick={() => {
              void handleSendMessage();
            }}
            className="btn-attention inline-flex h-fit items-center gap-2 rounded-[8px] px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            <SendHorizonal className="size-4" />
            {isSending ? "Enviando" : "Enviar"}
          </button>
        </div>
      </div>
    </section>
  );
}
