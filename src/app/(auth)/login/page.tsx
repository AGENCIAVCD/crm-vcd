import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

export default async function LoginPage() {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (authenticatedUser) {
    redirect("/dashboard");
  }

  return <LoginForm />;
}
