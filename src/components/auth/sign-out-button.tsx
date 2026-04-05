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
        className="btn-outline-dark inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogOut className="size-4" />
        {isPending ? "Saindo..." : "Sair"}
      </button>

      {feedback ? (
        <p className="max-w-52 text-right text-xs font-medium text-rose-600">{feedback}</p>
      ) : null}
    </div>
  );
}
