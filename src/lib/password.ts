// Hash de senha com scrypt (Node built-in — sem dependência nova).
// Fica em arquivo separado de src/lib/auth.ts de propósito: auth.ts é importado pelo
// middleware.ts, que roda no Edge runtime (sem o módulo "crypto" do Node). Este arquivo
// só pode ser importado por rotas de API (Node runtime).
import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const hashBuffer = Buffer.from(hash, "hex");
    const suppliedBuffer = crypto.scryptSync(password, salt, 64);
    return hashBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(hashBuffer, suppliedBuffer);
  } catch {
    return false;
  }
}
