import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SalesKanbanDashboard } from "@/components/sales-kanban/KanbanBoard";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

export const metadata: Metadata = {
  title: "VCD-CRM | Pipeline",
  description: "Kanban comercial protegido por autenticacao.",
};

export default async function PipelinePage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  return <SalesKanbanDashboard userName={authenticatedUser.profile.full_name} />;
}
