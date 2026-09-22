import { NextResponse } from "next/server";
import { getRates } from "@/lib/rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const r = await getRates();
  return NextResponse.json(r ? { USD: r.USD, EUR: r.EUR, at: r.at } : { USD: null, EUR: null, at: null });
}
