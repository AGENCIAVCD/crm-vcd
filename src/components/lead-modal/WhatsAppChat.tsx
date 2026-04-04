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
      setMessages((currentMessages) => [...currentMessages, demoMessage]);
      return;
    }

    try {
      setIsSending(true);

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

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Nao foi possivel enviar a mensagem.");
      }

      setDraft("");
      void syncMessages();
    } catch (error) {
      console.error("Falha ao enviar mensagem:", error);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[24px] border border-line bg-white">
      <header className="border-b border-line bg-[linear-gradient(180deg,_rgba(15,118,110,0.08),_rgba(15,118,110,0.02))] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-brand-soft p-3 text-brand">
            <MessageCircleMore className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-950">WhatsApp do lead</h3>
            <p className="text-sm text-muted">
              Realtime filtrado por `lead_id` com envio via rota interna.
            </p>
          </div>
        </div>
      </header>

      <ScrollArea className="h-[420px] bg-[radial-gradient(circle_at_top,_rgba(219,234,254,0.55),_transparent_35%),linear-gradient(180deg,_#f8fbff,_#f1f6f8)] px-4 py-5">
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
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md border border-white bg-white text-slate-800",
                  )}
                >
                  <p className="leading-6">{message.content}</p>
                  <p
                    className={cn(
                      "mt-2 text-[11px]",
                      outbound ? "text-white/75" : "text-slate-400",
                    )}
                  >
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && !isLoading ? (
            <div className="rounded-[20px] border border-dashed border-line bg-white/80 px-4 py-8 text-center text-sm text-muted">
              Nenhuma mensagem ainda. Envie a primeira interacao para abrir o
              historico deste lead.
            </div>
          ) : null}
        </div>
      </ScrollArea>

      <div className="border-t border-line bg-white p-4">
        <div className="flex gap-3">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escreva uma mensagem para o lead..."
            className="min-h-[96px] flex-1 resize-none rounded-[20px] border border-line bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
          />
          <button
            type="button"
            disabled={isSending || draft.trim().length === 0}
            onClick={() => {
              void handleSendMessage();
            }}
            className="btn-dark inline-flex h-fit items-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed"
          >
            <SendHorizonal className="size-4" />
            {isSending ? "Enviando" : "Enviar"}
          </button>
        </div>
      </div>
    </section>
  );
}
