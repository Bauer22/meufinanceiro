import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ensureAppUser } from "@/lib/user";
import { bad, str } from "@/lib/validate";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await ensureAppUser();
  return NextResponse.json({ username: user.username });
}

export async function PATCH(req: Request) {
  const user = await ensureAppUser();
  const b = await req.json().catch(() => null);
  const currentPassword = typeof b?.currentPassword === "string" ? b.currentPassword : "";
  if (!verifyPassword(currentPassword, user.passwordHash)) return bad("Senha atual incorreta.", 401);

  const data: { username?: string; passwordHash?: string } = {};

  if (typeof b?.username === "string" && b.username.trim()) {
    const username = str(b.username, 60);
    if (!username) return bad("Usuário inválido.");
    if (username !== user.username) {
      const clash = await prisma.appUser.findUnique({ where: { username } });
      if (clash) return bad("Esse usuário já está em uso.");
      data.username = username;
    }
  }

  if (typeof b?.newPassword === "string" && b.newPassword) {
    if (b.newPassword.length < 6) return bad("A nova senha precisa ter pelo menos 6 caracteres.");
    data.passwordHash = hashPassword(b.newPassword);
  }

  if (Object.keys(data).length === 0) return bad("Nada para atualizar.");

  const updated = await prisma.appUser.update({ where: { id: user.id }, data });
  return NextResponse.json({ username: updated.username });
}
