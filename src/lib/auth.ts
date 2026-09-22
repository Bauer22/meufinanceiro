// Sessão por cookie assinado (HMAC-SHA256, Web Crypto: funciona no Edge e no Node).
export const COOKIE = "mf_session";
export const SESSION_DAYS = 30;

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer): string {
  let s = "";
  new Uint8Array(bytes).forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Comparação em tempo constante (strings de mesmo tamanho). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const authSecret = () => process.env.AUTH_SECRET || process.env.APP_PASSWORD || "";

export async function createToken(secret: string, days = SESSION_DAYS): Promise<string> {
  const exp = String(Date.now() + days * 86_400_000);
  return `${exp}.${await sign(secret, `session:${exp}`)}`;
}

export async function verifyToken(secret: string, token: string | undefined): Promise<boolean> {
  if (!token || !secret) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await sign(secret, `session:${exp}`));
}

/** Compara a senha digitada com a configurada sem vazar tamanho nem tempo. */
export async function passwordMatches(input: string, expected: string): Promise<boolean> {
  const k = authSecret() || "k";
  return safeEqual(await sign(k, `pw:${input}`), await sign(k, `pw:${expected}`));
}
