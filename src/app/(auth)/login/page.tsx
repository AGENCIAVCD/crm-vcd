import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedAppUser } from "@/lib/supabase-auth";

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authenticatedUser = await getAuthenticatedAppUser();

  if (authenticatedUser) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return <LoginForm nextPath={resolvedSearchParams?.next ?? null} />;
}
