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
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-brand/30 hover:text-brand disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogOut className="size-4" />
        {isPending ? "Saindo..." : "Sair"}
      </button>

      {feedback ? (
        <p className="max-w-52 text-right text-xs text-rose-600">{feedback}</p>
      ) : null}
    </div>
  );
}

