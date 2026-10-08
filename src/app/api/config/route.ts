import { connection, NextResponse } from "next/server";
import { publicConfig } from "@/lib/env";

export async function GET() {
  await connection();
  return NextResponse.json(publicConfig(), { headers: { "Cache-Control": "no-store" } });
}
