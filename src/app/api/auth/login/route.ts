import { NextResponse } from "next/server";
import { COOKIE, SESSION_DAYS, authSecret, createToken, passwordMatches } from "@/lib/auth";

export async function POST(req: Request) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) return NextResponse.json({ error: "APP_PASSWORD não configurada." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const input = typeof body?.password === "string" ? body.password : "";

  if (!(await passwordMatches(input, expected))) {
    await new Promise((r) => setTimeout(r, 700)); // freia tentativas por força bruta
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createToken(authSecret()), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return res;
}
