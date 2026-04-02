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

    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/" || pathname === "/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/pipelines/:path*"],
};

