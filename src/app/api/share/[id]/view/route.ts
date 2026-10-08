import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/ratelimit";
import { markViewed } from "@/lib/share";
import { sharingEnabled } from "@/lib/store";

/** Called by the public page when the client opens the quote. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!sharingEnabled()) return NextResponse.json({ ok: false });
  const rl = rateLimit(`share-view:${clientIp(req)}`, 120, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ ok: false });
  const { id } = await ctx.params;
  try {
    await markViewed(id);
  } catch (err) {
    console.error("[share/view]", err);
  }
  return NextResponse.json({ ok: true });
}
