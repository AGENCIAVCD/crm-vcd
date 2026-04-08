"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-client";

export function SignOutButton() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    setFeedback(null);

    startTransition(async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { error } = await supabase.auth.signOut();

        if (error) {
          setFeedback(error.message);
          return;
        }

        router.replace("/login");
        router.refresh();
      } catch (error) {
        setFeedback(
          error instanceof Error ? error.message : "Nao foi possivel encerrar a sessao.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-[#2a2a2a] bg-[#1d1d1d] px-3 py-2.5 text-[0.75rem] font-medium text-white transition hover:border-[#ffb500]/50 hover:bg-[#252525] hover:text-[#ffcf5c] disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogOut className="size-3.5" />
        {isPending ? "Saindo..." : "Sair"}
      </button>

      {feedback ? (
        <p className="max-w-52 text-right text-xs font-medium text-rose-600">{feedback}</p>
      ) : null}
    </div>
  );
}
