import { NextResponse, type NextRequest } from "next/server";
import {
  createProxySupabaseClient,
  isSupabaseConfiguredServer,
} from "@/lib/supabase-auth";

function isProtectedPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pipelines")
  );
}

function withSupabaseCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie);
  });

  return target;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isSupabaseConfiguredServer()) {
    if (pathname === "/login") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { supabase, response } = createProxySupabaseClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    const next = `${pathname}${search}`;

    if (next && next !== "/") {
      loginUrl.searchParams.set("next", next);
    }

    return withSupabaseCookies(NextResponse.redirect(loginUrl), response);
  }

  if (user && (pathname === "/" || pathname === "/login")) {
    return withSupabaseCookies(
      NextResponse.redirect(new URL("/dashboard", request.url)),
      response,
    );
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/pipelines/:path*"],
};
