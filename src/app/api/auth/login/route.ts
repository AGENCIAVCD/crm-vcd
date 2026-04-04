import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function sanitizeNextPath(nextPath: unknown) {
  if (typeof nextPath !== "string" || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export async function POST(request: Request) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error:
          "Supabase nao configurado. Ative as variaveis de ambiente antes de liberar o CRM.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | {
        email?: string;
        password?: string;
        nextPath?: string;
      }
    | null;

  const email = body?.email?.trim();
  const password = body?.password;
  const nextPath = sanitizeNextPath(body?.nextPath);

  if (!email || !password) {
    return NextResponse.json(
      {
        error: "E-mail e senha sao obrigatorios.",
      },
      { status: 400 },
    );
  }

  let response = NextResponse.json({
    ok: true,
    redirectTo: nextPath,
  });

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.headers
          .get("cookie")
          ?.split(";")
          .map((part) => part.trim())
          .filter(Boolean)
          .map((part) => {
            const separatorIndex = part.indexOf("=");

            if (separatorIndex === -1) {
              return {
                name: part,
                value: "",
              };
            }

            return {
              name: part.slice(0, separatorIndex),
              value: decodeURIComponent(part.slice(separatorIndex + 1)),
            };
          }) ?? [];
      },
      setAll(cookiesToSet: CookieToSet[]) {
        response = NextResponse.json({
          ok: true,
          redirectTo: nextPath,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 401 },
    );
  }

  return response;
}
