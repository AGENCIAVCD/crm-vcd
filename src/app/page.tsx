import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

export const metadata: Metadata = {
  title: "VCD-CRM | Redirecionando",
  description: "Redirecionamento inicial para o dashboard do CRM.",
};

export default async function Home() {
  const authenticatedUser = await getAuthenticatedAppUser();

  redirect(authenticatedUser ? "/dashboard" : "/login");
}
