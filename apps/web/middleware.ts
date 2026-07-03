import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // TODO: ověřit Supabase session token z cookies
  // Pro demo režim povolíme všechny routy
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
