import { NextResponse } from "next/server";
import { COOKIE, SESSION_DAYS, authSecret, createToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { ensureAppUser } from "@/lib/user";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const secret = authSecret();
  if (!secret) return NextResponse.json({ error: "AUTH_SECRET não configurada." }, { status: 503 });

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  await ensureAppUser();
  const user = username ? await prisma.appUser.findUnique({ where: { username } }) : null;

  if (!user || !verifyPassword(password, user.passwordHash)) {
    await new Promise((r) => setTimeout(r, 700)); // freia tentativas por força bruta
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await createToken(secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return res;
}
