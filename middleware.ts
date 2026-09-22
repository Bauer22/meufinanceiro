import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, authSecret, verifyToken } from "@/lib/auth";

const PUBLIC = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const secret = authSecret();

  if (!secret) {
    // Em desenvolvimento local sem AUTH_SECRET configurada, deixa passar.
    if (process.env.NODE_ENV === "development") return NextResponse.next();
    const msg = "Defina AUTH_SECRET nas variáveis de ambiente para liberar o acesso.";
    return isApi
      ? NextResponse.json({ error: msg }, { status: 503 })
      : new NextResponse(msg, { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const ok = await verifyToken(secret, req.cookies.get(COOKIE)?.value);

  if (PUBLIC.includes(pathname)) {
    if (ok && pathname === "/login") return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }
  if (ok) return NextResponse.next();

  if (isApi) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
