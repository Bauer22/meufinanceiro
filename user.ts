import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

/**
 * Garante que exista um usuário de acesso. Na primeira vez que qualquer rota chamar isso,
 * cria um usuário a partir de APP_USERNAME/APP_PASSWORD (variáveis de ambiente antigas),
 * para não travar o acesso de quem já tinha o app configurado. Depois disso, o usuário e a
 * senha só mudam pela tela "Acesso" dentro do app.
 */
export async function ensureAppUser() {
  const existing = await prisma.appUser.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;

  const username = process.env.APP_USERNAME?.trim() || "admin";
  const password = process.env.APP_PASSWORD || "mudar-senha";
  try {
    return await prisma.appUser.create({ data: { username, passwordHash: hashPassword(password) } });
  } catch {
    // Corrida rara: duas requisições tentaram criar o primeiro usuário ao mesmo tempo.
    const created = await prisma.appUser.findFirst({ orderBy: { createdAt: "asc" } });
    if (created) return created;
    throw new Error("Não foi possível preparar o usuário de acesso.");
  }
}
