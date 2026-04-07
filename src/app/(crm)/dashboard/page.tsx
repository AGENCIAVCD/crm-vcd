import { redirect } from "next/navigation";
import { SalesKanbanDashboard } from "@/components/sales-kanban/KanbanBoard";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

export default async function DashboardPage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (!authenticatedUser) {
    redirect("/login");
  }

  return <SalesKanbanDashboard userName={authenticatedUser.profile.full_name} />;
}
