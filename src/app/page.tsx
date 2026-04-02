import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "VCD-CRM | Redirecionando",
  description: "Redirecionamento inicial para o dashboard do CRM.",
};

export default function Home() {
  redirect("/dashboard");
}
