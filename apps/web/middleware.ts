import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const publicRoutes = ["/login", "/register"];

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Static assets & API routes — always pass through
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Development mode — no Supabase, allow everything
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      // In development, allow through with demo user
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } catch {
    // Supabase unavailable — allow through
    return NextResponse.next();
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
